"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuth } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

const MIGRATION_NAME = "20260816002_meeting_governance";
const MIGRATION_ERROR = { error: `Jalankan migrasi SQL ${MIGRATION_NAME} terlebih dahulu.` };

const uid = (prefix: string) => `${prefix}-` + crypto.randomUUID();

function isMissingTableError(error: { code?: string } | null): boolean {
  return !!error && error.code === "42P01";
}

/* ─────────────────────────────────────────────────────────────────────
 * 1) Pengendalian Ruang Meeting — SOP-SDM-09
 * ───────────────────────────────────────────────────────────────────── */

export interface RuangMeeting {
  id: string;
  nama: string;
  kapasitas: number | null;
  status: "Tersedia" | "Perlu Dibersihkan" | "Non-Aktif";
  created_at: string;
}

export interface BookingRuangMeeting {
  id: string;
  ruang_id: string;
  user_pemohon: string;
  nama_acara: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  kebutuhan_snack: boolean;
  catatan_snack: string | null;
  status: "Menunggu" | "Dikonfirmasi" | "Ditolak" | "Selesai" | "Kedaluwarsa";
  created_at: string;
}

/** Hitung jumlah hari kerja (Senin-Jumat) di antara dua tanggal. */
function businessDaysBetween(from: Date, to: Date): number {
  let count = 0;
  const cur = new Date(from);
  cur.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  while (cur < end) {
    cur.setDate(cur.getDate() + 1);
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return count;
}

/** Booking "Menunggu" yang sudah lewat 3 hari kerja sejak diajukan dianggap
 * kedaluwarsa (sesuai SOP-SDM-09). Ini dicek "on-read" (lazy), bukan lewat
 * cron job, karena sistem ini tidak punya background job runner terpasang
 * — pola yang sama dipakai checkAndNotifyFleetExpiry di actions/vehicles.ts. */
function withComputedExpiry(rows: BookingRuangMeeting[]): BookingRuangMeeting[] {
  const now = new Date();
  return rows.map((b) => {
    if (b.status === "Menunggu" && businessDaysBetween(new Date(b.created_at), now) > 3) {
      return { ...b, status: "Kedaluwarsa" as const };
    }
    return b;
  });
}

/** Tandai booking "Menunggu" yang sudah lewat 3 hari kerja sebagai
 * "Kedaluwarsa" secara permanen di database. Dipanggil dari halaman list
 * (on-view), bukan cron. */
export async function expireStaleBookings(): Promise<{ expired: number }> {
  await requireAuth();
  const { data, error } = await supabaseAdmin
    .from("booking_ruang_meeting")
    .select("id, created_at")
    .eq("status", "Menunggu");
  if (error || !data) return { expired: 0 };

  const now = new Date();
  const staleIds = (data as { id: string; created_at: string }[])
    .filter((b) => businessDaysBetween(new Date(b.created_at), now) > 3)
    .map((b) => b.id);
  if (staleIds.length === 0) return { expired: 0 };

  await supabaseAdmin.from("booking_ruang_meeting").update({ status: "Kedaluwarsa" }).in("id", staleIds);
  return { expired: staleIds.length };
}

export async function getRooms(): Promise<RuangMeeting[]> {
  await requireAuth();
  const { data } = await supabaseAdmin.from("ruang_meeting").select("*").order("nama");
  return (data as RuangMeeting[]) || [];
}

export async function getBookings(): Promise<BookingRuangMeeting[]> {
  await requireAuth();
  await expireStaleBookings();
  const { data } = await supabaseAdmin
    .from("booking_ruang_meeting")
    .select("*")
    .order("tanggal", { ascending: false })
    .order("waktu_mulai", { ascending: false });
  return withComputedExpiry((data as BookingRuangMeeting[]) || []);
}

export async function saveRoom(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const id = ((formData.get("id") as string) || "").trim();
  const nama = ((formData.get("nama") as string) || "").trim();
  const kapasitasRaw = ((formData.get("kapasitas") as string) || "").trim();
  const status = ((formData.get("status") as string) || "Tersedia").trim();
  if (!nama) return { error: "Nama ruang wajib diisi." };

  const { error } = await supabaseAdmin.from("ruang_meeting").upsert({
    id: id || uid("room"),
    nama,
    kapasitas: kapasitasRaw ? parseInt(kapasitasRaw) : null,
    status,
  });
  if (error) {
    if (isMissingTableError(error)) return MIGRATION_ERROR;
    console.error("[meetings] saveRoom error:", error.message);
    return { error: "Gagal menyimpan data ruang meeting." };
  }
  revalidatePath("/hrd/meetings/rooms");
  revalidatePath("/hrd/meetings");
  return { success: true };
}

export async function requestBooking(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "director", "department_manager", "employee");
  const ruang_id = ((formData.get("ruang_id") as string) || "").trim();
  const nama_acara = ((formData.get("nama_acara") as string) || "").trim();
  const tanggal = ((formData.get("tanggal") as string) || "").trim();
  const waktu_mulai = ((formData.get("waktu_mulai") as string) || "").trim();
  const waktu_selesai = ((formData.get("waktu_selesai") as string) || "").trim();
  const kebutuhan_snack = formData.get("kebutuhan_snack") === "on" || formData.get("kebutuhan_snack") === "true";
  const catatan_snack = ((formData.get("catatan_snack") as string) || "").trim() || null;

  if (!ruang_id || !nama_acara || !tanggal || !waktu_mulai || !waktu_selesai) {
    return { error: "Ruang, nama acara, tanggal, dan waktu wajib diisi." };
  }
  if (waktu_selesai <= waktu_mulai) {
    return { error: "Waktu selesai harus setelah waktu mulai." };
  }

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("booking_ruang_meeting")
    .select("id, waktu_mulai, waktu_selesai")
    .eq("ruang_id", ruang_id)
    .eq("tanggal", tanggal)
    .in("status", ["Menunggu", "Dikonfirmasi"]);
  if (fetchError) {
    if (isMissingTableError(fetchError)) return MIGRATION_ERROR;
    return { error: "Gagal memeriksa jadwal ruang." };
  }

  const conflict = (existing || []).some(
    (b: { waktu_mulai: string; waktu_selesai: string }) => waktu_mulai < b.waktu_selesai && waktu_selesai > b.waktu_mulai
  );
  if (conflict) {
    return { error: "Ruang sudah dipesan pada rentang waktu tersebut. Silakan periksa jadwal dan pilih waktu lain." };
  }

  const { error } = await supabaseAdmin.from("booking_ruang_meeting").insert({
    id: uid("bkg"),
    ruang_id,
    user_pemohon: user.name || user.email,
    nama_acara,
    tanggal,
    waktu_mulai,
    waktu_selesai,
    kebutuhan_snack,
    catatan_snack,
    status: "Menunggu",
  });
  if (error) {
    if (isMissingTableError(error)) return MIGRATION_ERROR;
    console.error("[meetings] requestBooking error:", error.message);
    return { error: "Gagal mengajukan booking ruang." };
  }
  revalidatePath("/hrd/meetings/rooms");
  revalidatePath("/hrd/meetings");
  return { success: true };
}

export async function confirmBooking(id: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("booking_ruang_meeting").update({ status: "Dikonfirmasi" }).eq("id", id);
  if (error) return { error: "Gagal mengonfirmasi booking." };
  await auditLog({ action: "meeting.room_booking_status", targetId: id, targetName: "Booking Ruang Meeting", performedBy: user, detail: "Dikonfirmasi" });
  revalidatePath("/hrd/meetings/rooms");
  revalidatePath("/hrd/meetings");
  return { success: true };
}

export async function rejectBooking(id: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("booking_ruang_meeting").update({ status: "Ditolak" }).eq("id", id);
  if (error) return { error: "Gagal menolak booking." };
  await auditLog({ action: "meeting.room_booking_status", targetId: id, targetName: "Booking Ruang Meeting", performedBy: user, detail: "Ditolak" });
  revalidatePath("/hrd/meetings/rooms");
  revalidatePath("/hrd/meetings");
  return { success: true };
}

export async function completeBooking(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin", "director", "department_manager", "employee");
  const { error } = await supabaseAdmin.from("booking_ruang_meeting").update({ status: "Selesai" }).eq("id", id);
  if (error) return { error: "Gagal memperbarui status booking." };
  revalidatePath("/hrd/meetings/rooms");
  revalidatePath("/hrd/meetings");
  return { success: true };
}

/* ─────────────────────────────────────────────────────────────────────
 * 2) Daftar Hadir — FR-PR-MRE-06-02
 * ───────────────────────────────────────────────────────────────────── */

export interface DaftarHadir {
  id: string;
  nama_acara: string;
  tanggal: string;
  tempat: string | null;
  waktu: string | null;
  terkait_agenda: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DaftarHadirPeserta {
  id: string;
  daftar_hadir_id: string;
  nama: string;
  divisi: string | null;
  hadir: boolean;
  created_at: string;
}

export async function listDaftarHadir(): Promise<DaftarHadir[]> {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data } = await supabaseAdmin.from("daftar_hadir").select("*").order("tanggal", { ascending: false });
  return (data as DaftarHadir[]) || [];
}

export async function getDaftarHadir(id: string): Promise<{ sheet: DaftarHadir; peserta: DaftarHadirPeserta[] } | null> {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data: sheet } = await supabaseAdmin.from("daftar_hadir").select("*").eq("id", id).maybeSingle();
  if (!sheet) return null;
  const { data: peserta } = await supabaseAdmin
    .from("daftar_hadir_peserta")
    .select("*")
    .eq("daftar_hadir_id", id)
    .order("created_at");
  return { sheet: sheet as DaftarHadir, peserta: (peserta as DaftarHadirPeserta[]) || [] };
}

export async function createDaftarHadir(formData: FormData): Promise<{ error: string } | { success: true; id: string }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const nama_acara = ((formData.get("nama_acara") as string) || "").trim();
  const tanggal = ((formData.get("tanggal") as string) || "").trim();
  const tempat = ((formData.get("tempat") as string) || "").trim() || null;
  const waktu = ((formData.get("waktu") as string) || "").trim() || null;
  const terkait_agenda = ((formData.get("terkait_agenda") as string) || "").trim() || null;

  if (!nama_acara || !tanggal) return { error: "Nama acara dan tanggal wajib diisi." };

  const id = uid("dh");
  const { error } = await supabaseAdmin.from("daftar_hadir").insert({
    id, nama_acara, tanggal, tempat, waktu, terkait_agenda,
    created_by: user.name || user.email,
  });
  if (error) {
    if (isMissingTableError(error)) return MIGRATION_ERROR;
    console.error("[meetings] createDaftarHadir error:", error.message);
    return { error: "Gagal membuat daftar hadir." };
  }
  revalidatePath("/hrd/meetings/attendance");
  revalidatePath("/hrd/meetings");
  return { success: true, id };
}

/** Tambah beberapa peserta sekaligus. Setiap baris: "Nama|Divisi" per baris teks,
 * agar form input bisa berupa satu textarea (bulk-add) daripada N field terpisah. */
export async function addPesertaBulk(daftarHadirId: string, formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin", "department_manager");
  const raw = ((formData.get("peserta_bulk") as string) || "").trim();
  if (!raw) return { error: "Daftar peserta tidak boleh kosong." };

  const rows = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nama, divisi] = line.split("|").map((s) => s?.trim() || "");
      return { id: uid("psrt"), daftar_hadir_id: daftarHadirId, nama, divisi: divisi || null, hadir: false };
    })
    .filter((r) => r.nama);

  if (rows.length === 0) return { error: "Format tidak valid. Gunakan: Nama|Divisi per baris." };

  const { error } = await supabaseAdmin.from("daftar_hadir_peserta").insert(rows);
  if (error) {
    if (isMissingTableError(error)) return MIGRATION_ERROR;
    console.error("[meetings] addPesertaBulk error:", error.message);
    return { error: "Gagal menambahkan peserta." };
  }
  revalidatePath(`/hrd/meetings/attendance/${daftarHadirId}`);
  revalidatePath("/hrd/meetings/attendance");
  return { success: true };
}

export async function togglePesertaHadir(pesertaId: string, hadir: boolean): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin", "department_manager");
  const { error } = await supabaseAdmin.from("daftar_hadir_peserta").update({ hadir }).eq("id", pesertaId);
  if (error) return { error: "Gagal memperbarui kehadiran." };
  revalidatePath("/hrd/meetings/attendance");
  return { success: true };
}

/* ─────────────────────────────────────────────────────────────────────
 * 3) Notulen Rapat — FR-PR-MRE-06-03
 * ───────────────────────────────────────────────────────────────────── */

export interface NotulenRapat {
  id: string;
  nama_acara: string;
  tanggal: string;
  tempat: string | null;
  waktu: string | null;
  agenda: string[];
  dibuat_oleh: string | null;
  disetujui_oleh: string | null;
  status: "Draft" | "Menunggu Persetujuan" | "Disetujui";
  created_at: string;
}

export interface NotulenRapatItem {
  id: string;
  notulen_id: string;
  nomor: number;
  catatan_pembahasan: string | null;
  tindak_lanjut: string | null;
  pic: string | null;
  batas_waktu: string | null;
  catatan_verifikasi: string | null;
  status: "Belum Selesai" | "Selesai";
  created_at: string;
}

export async function listNotulen(): Promise<NotulenRapat[]> {
  await requireRole("hrd", "superadmin", "director", "department_manager");
  const { data } = await supabaseAdmin.from("notulen_rapat").select("*").order("tanggal", { ascending: false });
  return (data as NotulenRapat[]) || [];
}

export async function getNotulen(id: string): Promise<{ notulen: NotulenRapat; items: NotulenRapatItem[] } | null> {
  await requireRole("hrd", "superadmin", "director", "department_manager");
  const { data: notulen } = await supabaseAdmin.from("notulen_rapat").select("*").eq("id", id).maybeSingle();
  if (!notulen) return null;
  const { data: items } = await supabaseAdmin
    .from("notulen_rapat_item")
    .select("*")
    .eq("notulen_id", id)
    .order("nomor");
  return { notulen: notulen as NotulenRapat, items: (items as NotulenRapatItem[]) || [] };
}

export async function createNotulen(formData: FormData): Promise<{ error: string } | { success: true; id: string }> {
  const user = await requireRole("hrd", "superadmin", "director", "department_manager");
  const nama_acara = ((formData.get("nama_acara") as string) || "").trim();
  const tanggal = ((formData.get("tanggal") as string) || "").trim();
  const tempat = ((formData.get("tempat") as string) || "").trim() || null;
  const waktu = ((formData.get("waktu") as string) || "").trim() || null;
  const agendaRaw = ((formData.get("agenda") as string) || "").trim();
  const agenda = agendaRaw.split("\n").map((s) => s.trim()).filter(Boolean);

  if (!nama_acara || !tanggal) return { error: "Nama acara dan tanggal wajib diisi." };

  const id = uid("not");
  const { error } = await supabaseAdmin.from("notulen_rapat").insert({
    id, nama_acara, tanggal, tempat, waktu, agenda,
    dibuat_oleh: user.name || user.email,
    status: "Draft",
  });
  if (error) {
    if (isMissingTableError(error)) return MIGRATION_ERROR;
    console.error("[meetings] createNotulen error:", error.message);
    return { error: "Gagal membuat notulen rapat." };
  }
  revalidatePath("/hrd/meetings/minutes");
  revalidatePath("/hrd/meetings");
  return { success: true, id };
}

export async function addNotulenItem(notulenId: string, formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin", "director", "department_manager");
  const catatan_pembahasan = ((formData.get("catatan_pembahasan") as string) || "").trim() || null;
  const tindak_lanjut = ((formData.get("tindak_lanjut") as string) || "").trim() || null;
  const pic = ((formData.get("pic") as string) || "").trim() || null;
  const batas_waktu = ((formData.get("batas_waktu") as string) || "").trim() || null;

  const { count } = await supabaseAdmin
    .from("notulen_rapat_item")
    .select("id", { count: "exact", head: true })
    .eq("notulen_id", notulenId);
  const nomor = (count || 0) + 1;

  const { error } = await supabaseAdmin.from("notulen_rapat_item").insert({
    id: uid("noti"),
    notulen_id: notulenId,
    nomor,
    catatan_pembahasan,
    tindak_lanjut,
    pic,
    batas_waktu,
    status: "Belum Selesai",
  });
  if (error) {
    if (isMissingTableError(error)) return MIGRATION_ERROR;
    console.error("[meetings] addNotulenItem error:", error.message);
    return { error: "Gagal menambahkan poin notulen." };
  }
  revalidatePath(`/hrd/meetings/minutes/${notulenId}`);
  revalidatePath("/hrd/meetings/minutes");
  return { success: true };
}

export async function submitNotulenForApproval(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin", "director", "department_manager");
  const { error } = await supabaseAdmin.from("notulen_rapat").update({ status: "Menunggu Persetujuan" }).eq("id", id);
  if (error) return { error: "Gagal mengajukan notulen untuk persetujuan." };
  revalidatePath("/hrd/meetings/minutes");
  return { success: true };
}

export async function approveNotulen(id: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "director", "department_manager");
  const { error } = await supabaseAdmin
    .from("notulen_rapat")
    .update({ status: "Disetujui", disetujui_oleh: user.name || user.email })
    .eq("id", id);
  if (error) return { error: "Gagal menyetujui notulen." };
  await auditLog({ action: "meeting.notulen_approve", targetId: id, targetName: "Notulen Rapat", performedBy: user });
  revalidatePath("/hrd/meetings/minutes");
  revalidatePath("/hrd/meetings");
  return { success: true };
}

export async function verifyTindakLanjut(itemId: string, catatan: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin", "director", "department_manager");
  const { error } = await supabaseAdmin
    .from("notulen_rapat_item")
    .update({ status: "Selesai", catatan_verifikasi: catatan || null })
    .eq("id", itemId);
  if (error) return { error: "Gagal memverifikasi tindak lanjut." };
  revalidatePath("/hrd/meetings/minutes");
  return { success: true };
}
