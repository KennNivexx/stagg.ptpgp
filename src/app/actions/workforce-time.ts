"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const MISSING = "Jalankan migrasi 20260713003_workforce_time_management.sql terlebih dahulu.";
const revalidateWtm = () => { revalidatePath("/hrd/workforce-time"); };

/* ─────── Kalender Kerja ─────── */
export async function getKalenderKerja() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("kalender_kerja").select("*").order("tanggal");
  return data || [];
}

export async function saveHariLibur(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const tanggal = (formData.get("tanggal") as string || "").trim();
  const nama_libur = (formData.get("nama_libur") as string || "").trim();
  const jenis = (formData.get("jenis") as string || "Nasional").trim();
  if (!tanggal || !nama_libur) return { error: "Tanggal dan nama libur wajib diisi." };

  const { error } = await supabaseAdmin.from("kalender_kerja").insert({ id: uid("cal"), tanggal, nama_libur, jenis });
  if (error?.code === "42P01") return { error: MISSING };
  if (error) return { error: "Gagal menyimpan hari libur." };
  revalidateWtm();
  return { success: true };
}

export async function deleteHariLibur(id: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("kalender_kerja").delete().eq("id", id);
  revalidateWtm();
  return { success: true };
}

/* ─────── Penugasan Kerja ─────── */
export async function getPenugasanKerja() {
  await requireRole("hrd", "superadmin");
  const { data: rows } = await supabaseAdmin.from("penugasan_kerja").select("*").order("created_at", { ascending: false });
  const list = (rows || []) as Record<string, unknown>[];
  const empIds = [...new Set(list.flatMap(r => [r.karyawan_id, r.supervisor_karyawan_id].filter(Boolean)))] as string[];
  const unitIds = [...new Set(list.map(r => r.unit_organisasi_id).filter(Boolean))] as string[];
  const [{ data: emps }, { data: units }] = await Promise.all([
    empIds.length ? supabaseAdmin.from("karyawan").select("id, full_name").in("id", empIds) : Promise.resolve({ data: [] }),
    unitIds.length ? supabaseAdmin.from("unit_organisasi").select("id, name").in("id", unitIds) : Promise.resolve({ data: [] }),
  ]);
  const empName = new Map(((emps || []) as { id: string; full_name: string }[]).map(e => [e.id, e.full_name]));
  const unitName = new Map(((units || []) as { id: string; name: string }[]).map(u => [u.id, u.name]));
  return list.map(r => ({
    ...r,
    karyawan_nama: empName.get(r.karyawan_id as string) || "—",
    supervisor_nama: r.supervisor_karyawan_id ? empName.get(r.supervisor_karyawan_id as string) || "—" : null,
    unit_nama: r.unit_organisasi_id ? unitName.get(r.unit_organisasi_id as string) || "—" : null,
  }));
}

export async function savePenugasan(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const unit_organisasi_id = (formData.get("unit_organisasi_id") as string || "").trim() || null;
  const nama_project = (formData.get("nama_project") as string || "").trim() || null;
  const nama_klien = (formData.get("nama_klien") as string || "").trim() || null;
  const supervisor_karyawan_id = (formData.get("supervisor_karyawan_id") as string || "").trim() || null;
  const tanggal_mulai = (formData.get("tanggal_mulai") as string || "").trim() || null;
  const tanggal_selesai = (formData.get("tanggal_selesai") as string || "").trim() || null;
  if (!karyawan_id) return { error: "Karyawan wajib dipilih." };

  const { error } = await supabaseAdmin.from("penugasan_kerja").insert({
    id: uid("pgs"), karyawan_id, unit_organisasi_id, nama_project, nama_klien,
    supervisor_karyawan_id, tanggal_mulai, tanggal_selesai, status: "Aktif",
  });
  if (error?.code === "42P01") return { error: MISSING };
  if (error) return { error: "Gagal menyimpan penugasan." };
  revalidateWtm();
  return { success: true };
}

export async function selesaikanPenugasan(id: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("penugasan_kerja").update({ status: "Selesai" }).eq("id", id);
  revalidateWtm();
  return { success: true };
}

export async function deletePenugasan(id: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("penugasan_kerja").delete().eq("id", id);
  revalidateWtm();
  return { success: true };
}

/* ─────── Koreksi Absensi ─────── */
export async function getKoreksiAbsensi() {
  await requireRole("hrd", "superadmin");
  const { data: rows } = await supabaseAdmin.from("koreksi_absensi").select("*").order("created_at", { ascending: false });
  return joinKaryawanNames(rows || []);
}

export async function ajukanKoreksi(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const tanggal = (formData.get("tanggal") as string || "").trim();
  const jenis_koreksi = (formData.get("jenis_koreksi") as string || "").trim();
  const alasan = (formData.get("alasan") as string || "").trim();
  if (!karyawan_id || !tanggal || !jenis_koreksi || !alasan) return { error: "Semua field wajib diisi." };

  const { error } = await supabaseAdmin.from("koreksi_absensi").insert({ id: uid("kor"), karyawan_id, tanggal, jenis_koreksi, alasan });
  if (error?.code === "42P01") return { error: MISSING };
  if (error) return { error: "Gagal mengajukan koreksi." };
  revalidateWtm();
  return { success: true };
}

export async function reviewKoreksi(id: string, approve: boolean) {
  const user = await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("koreksi_absensi").update({
    status: approve ? "Disetujui" : "Ditolak", reviewed_by: user.name || user.email,
  }).eq("id", id);
  revalidateWtm();
  return { success: true };
}

/* ─────── Lembur ─────── */
export async function getLembur() {
  await requireRole("hrd", "superadmin");
  const { data: rows } = await supabaseAdmin.from("lembur").select("*").order("created_at", { ascending: false });
  return joinKaryawanNames(rows || []);
}

export async function ajukanLembur(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const tanggal = (formData.get("tanggal") as string || "").trim();
  const jam_mulai = (formData.get("jam_mulai") as string || "").trim() || null;
  const jam_selesai = (formData.get("jam_selesai") as string || "").trim() || null;
  const alasan = (formData.get("alasan") as string || "").trim() || null;
  if (!karyawan_id || !tanggal) return { error: "Karyawan dan tanggal wajib diisi." };

  const { error } = await supabaseAdmin.from("lembur").insert({ id: uid("lbr"), karyawan_id, tanggal, jam_mulai, jam_selesai, alasan });
  if (error?.code === "42P01") return { error: MISSING };
  if (error) return { error: "Gagal mengajukan lembur." };
  revalidateWtm();
  return { success: true };
}

export async function reviewLembur(id: string, approve: boolean) {
  const user = await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("lembur").update({
    status: approve ? "Disetujui" : "Ditolak", reviewed_by: user.name || user.email,
  }).eq("id", id);
  revalidateWtm();
  return { success: true };
}

/* ─────── Timesheet / Daily Activity ─────── */
export async function getTimesheet() {
  await requireRole("hrd", "superadmin");
  const { data: rows } = await supabaseAdmin.from("catatan_aktivitas_harian").select("*").order("tanggal", { ascending: false }).limit(100);
  return joinKaryawanNames(rows || []);
}

export async function saveTimesheet(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const tanggal = (formData.get("tanggal") as string || "").trim();
  const jam_mulai = (formData.get("jam_mulai") as string || "").trim() || null;
  const jam_selesai = (formData.get("jam_selesai") as string || "").trim() || null;
  const deskripsi_aktivitas = (formData.get("deskripsi_aktivitas") as string || "").trim();
  const project_site = (formData.get("project_site") as string || "").trim() || null;
  const jam_kerjaRaw = formData.get("jam_kerja") as string;
  const jam_kerja = jam_kerjaRaw ? parseFloat(jam_kerjaRaw) : null;
  const mode_kerja = (formData.get("mode_kerja") as string || "Kantor").trim();
  if (!karyawan_id || !tanggal || !deskripsi_aktivitas) return { error: "Karyawan, tanggal, dan aktivitas wajib diisi." };

  const { error } = await supabaseAdmin.from("catatan_aktivitas_harian").insert({
    id: uid("ts"), karyawan_id, tanggal, jam_mulai, jam_selesai, deskripsi_aktivitas, project_site, jam_kerja, mode_kerja,
  });
  if (error?.code === "42P01") return { error: MISSING };
  if (error) return { error: "Gagal menyimpan timesheet." };
  revalidateWtm();
  return { success: true };
}

export async function deleteTimesheet(id: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("catatan_aktivitas_harian").delete().eq("id", id);
  revalidateWtm();
  return { success: true };
}

/* ─────── Saldo Cuti ─────── */
export async function getSaldoCuti() {
  await requireRole("hrd", "superadmin");
  const { data: rows } = await supabaseAdmin.from("saldo_cuti").select("*").order("tahun", { ascending: false });
  return joinKaryawanNames(rows || []);
}

export async function saveSaldoCuti(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  const tahun = parseInt((formData.get("tahun") as string) || "0", 10);
  const jenis_cuti = (formData.get("jenis_cuti") as string || "Tahunan").trim();
  const total_hari = parseInt((formData.get("total_hari") as string) || "12", 10);
  const terpakai = parseInt((formData.get("terpakai") as string) || "0", 10);
  if (!karyawan_id || !tahun) return { error: "Karyawan dan tahun wajib diisi." };

  const { data: existing } = await supabaseAdmin.from("saldo_cuti").select("id")
    .eq("karyawan_id", karyawan_id).eq("tahun", tahun).eq("jenis_cuti", jenis_cuti).maybeSingle();
  const id = (existing as { id: string } | null)?.id || uid("sc");

  const { error } = await supabaseAdmin.from("saldo_cuti").upsert({
    id, karyawan_id, tahun, jenis_cuti, total_hari, terpakai,
  }, { onConflict: "karyawan_id,tahun,jenis_cuti" });
  if (error?.code === "42P01") return { error: MISSING };
  if (error) return { error: "Gagal menyimpan saldo cuti." };
  revalidateWtm();
  return { success: true };
}

/* ─────── Dashboard stats (reuses existing tables, no new heavy queries) ─────── */
export async function getWorkforceTimeStats() {
  await requireRole("hrd", "superadmin");
  const today = new Date().toISOString().slice(0, 10);
  const [
    { count: hadirHariIni }, { count: pendingCuti }, { count: pendingKoreksi }, { count: pendingLembur },
  ] = await Promise.all([
    supabaseAdmin.from("absensi").select("*", { count: "exact", head: true }).eq("date", today),
    supabaseAdmin.from("pengajuan_cuti").select("*", { count: "exact", head: true }).eq("status", "Pending"),
    supabaseAdmin.from("koreksi_absensi").select("*", { count: "exact", head: true }).eq("status", "Pending"),
    supabaseAdmin.from("lembur").select("*", { count: "exact", head: true }).eq("status", "Pending"),
  ]);
  return {
    hadirHariIni: hadirHariIni || 0,
    pendingCuti: pendingCuti || 0,
    pendingKoreksi: pendingKoreksi || 0,
    pendingLembur: pendingLembur || 0,
  };
}

/* ─────── shared helper ─────── */
async function joinKaryawanNames(rows: Record<string, unknown>[]) {
  const empIds = [...new Set(rows.map(r => r.karyawan_id).filter(Boolean))] as string[];
  if (empIds.length === 0) return rows.map(r => ({ ...r, karyawan_nama: "—" }));
  const { data: emps } = await supabaseAdmin.from("karyawan").select("id, full_name").in("id", empIds);
  const empName = new Map(((emps || []) as { id: string; full_name: string }[]).map(e => [e.id, e.full_name]));
  return rows.map(r => ({ ...r, karyawan_nama: empName.get(r.karyawan_id as string) || "—" }));
}

export async function getActiveEmployeesForSelect() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("karyawan").select("id, full_name, department, kode_jabatan, nik").neq("status", "Inactive").order("full_name");
  return data || [];
}

/** Get leave balance for all active employees (sidebar display) */
export async function getLeaveBalances() {
  await requireRole("hrd", "superadmin");
  const currentYear = new Date().getFullYear();
  const { data: saldo } = await supabaseAdmin.from("saldo_cuti").select("*").eq("tahun", currentYear);
  const { data: emps } = await supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, department").neq("status", "Inactive");
  const empMap = new Map((emps || []).map((e: { id: string; full_name: string; kode_jabatan: string | null; department: string | null }) => [e.id, e]));
  const saldoList = (saldo || []) as Record<string, unknown>[];
  // Group by employee
  const balanceMap = new Map<string, { total: number; terpakai: number; jenis: Record<string, { total: number; terpakai: number }> }>();
  for (const s of saldoList) {
    const empId = s.karyawan_id as string;
    if (!balanceMap.has(empId)) balanceMap.set(empId, { total: 0, terpakai: 0, jenis: {} });
    const b = balanceMap.get(empId)!;
    const th = Number(s.total_hari) || 0;
    const tp = Number(s.terpakai) || 0;
    b.total += th;
    b.terpakai += tp;
    b.jenis[s.jenis_cuti as string] = { total: th, terpakai: tp };
  }
  return Array.from(empMap.entries()).map(([id, emp]) => {
    const b = balanceMap.get(id);
    return {
      employee_id: id,
      employee_name: emp.full_name,
      kode_jabatan: emp.kode_jabatan || "",
      department: emp.department || "",
      total_hari: b?.total || 12,
      terpakai: b?.terpakai || 0,
      sisa: (b?.total || 12) - (b?.terpakai || 0),
      jenis: b?.jenis || {},
    };
  });
}
