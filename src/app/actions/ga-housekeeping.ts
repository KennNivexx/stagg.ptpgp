"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

/** PR-SDM-08 Housekeeping & 5R — General Affair module, tables
 * checklist_kebersihan / audit_5r / laporan_ketidaksesuaian from
 * 20260816001_general_affair.sql. */

const uid = (prefix: string) => `${prefix}-` + crypto.randomUUID();

export interface ChecklistItem { item: string; status: "OK" | "Rusak"; }

export interface ChecklistKebersihan {
  id: string;
  ruang_atau_area: string;
  tanggal: string;
  petugas: string | null;
  item_diperiksa: ChecklistItem[];
  catatan: string | null;
  created_at: string;
}

export interface Audit5R {
  id: string;
  area: string;
  tanggal_audit: string;
  auditor: string | null;
  skor_atau_hasil: string | null;
  created_at: string;
}

export interface LaporanNC {
  id: string;
  audit_5r_id: string | null;
  deskripsi: string;
  tindak_lanjut: string | null;
  pic: string | null;
  batas_waktu: string | null;
  status: "Terbuka" | "Ditindaklanjuti" | "Ditutup";
  created_at: string;
}

export async function getChecklistKebersihan(): Promise<ChecklistKebersihan[]> {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin.from("checklist_kebersihan").select("*").order("tanggal", { ascending: false });
  if (error) { console.error("[ga-housekeeping] getChecklistKebersihan error:", error.message); return []; }
  return (data as ChecklistKebersihan[]) || [];
}

export async function submitChecklistKebersihan(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const ruang_atau_area = (formData.get("ruang_atau_area") as string || "").trim();
  const petugas = (formData.get("petugas") as string || "").trim() || null;
  const catatan = (formData.get("catatan") as string || "").trim() || null;
  const itemsRaw = (formData.get("item_diperiksa") as string || "[]").trim();

  if (!ruang_atau_area) return { error: "Ruang/area wajib diisi." };

  let items: ChecklistItem[] = [];
  try { items = JSON.parse(itemsRaw); } catch { return { error: "Format item pemeriksaan tidak valid." }; }

  const { error } = await supabaseAdmin.from("checklist_kebersihan").insert({
    id: uid("chk"), ruang_atau_area, tanggal: new Date().toISOString().split("T")[0],
    petugas, item_diperiksa: items, catatan, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-housekeeping] submitChecklistKebersihan error:", error.message); return { error: "Gagal menyimpan checklist." }; }

  await auditLog({ action: "ga.housekeeping.checklist_submit", targetName: ruang_atau_area, performedBy: user });
  revalidatePath("/hrd/ga/housekeeping");
  return { success: true };
}

export async function getAudit5R(): Promise<Audit5R[]> {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin.from("audit_5r").select("*").order("tanggal_audit", { ascending: false });
  if (error) { console.error("[ga-housekeeping] getAudit5R error:", error.message); return []; }
  return (data as Audit5R[]) || [];
}

export async function submitAudit5R(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const area = (formData.get("area") as string || "").trim();
  const auditor = (formData.get("auditor") as string || "").trim() || null;
  const skor_atau_hasil = (formData.get("skor_atau_hasil") as string || "").trim() || null;
  if (!area) return { error: "Area wajib diisi." };

  const { error } = await supabaseAdmin.from("audit_5r").insert({
    id: uid("a5r"), area, tanggal_audit: new Date().toISOString().split("T")[0],
    auditor, skor_atau_hasil, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-housekeeping] submitAudit5R error:", error.message); return { error: "Gagal menyimpan audit 5R." }; }

  await auditLog({ action: "ga.housekeeping.audit5r_submit", targetName: area, performedBy: user });
  revalidatePath("/hrd/ga/housekeeping");
  return { success: true };
}

export async function getNCReports(): Promise<LaporanNC[]> {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin.from("laporan_ketidaksesuaian").select("*").order("created_at", { ascending: false });
  if (error) { console.error("[ga-housekeeping] getNCReports error:", error.message); return []; }
  return (data as LaporanNC[]) || [];
}

export async function createNC(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const audit_5r_id = (formData.get("audit_5r_id") as string || "").trim() || null;
  const deskripsi = (formData.get("deskripsi") as string || "").trim();
  const tindak_lanjut = (formData.get("tindak_lanjut") as string || "").trim() || null;
  const pic = (formData.get("pic") as string || "").trim() || null;
  const batas_waktu = (formData.get("batas_waktu") as string || "").trim() || null;

  if (!deskripsi) return { error: "Deskripsi ketidaksesuaian wajib diisi." };

  const { error } = await supabaseAdmin.from("laporan_ketidaksesuaian").insert({
    id: uid("nc"), audit_5r_id, deskripsi, tindak_lanjut, pic, batas_waktu,
    status: "Terbuka", created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-housekeeping] createNC error:", error.message); return { error: "Gagal menyimpan laporan ketidaksesuaian." }; }

  await auditLog({ action: "ga.housekeeping.nc_create", performedBy: user, detail: deskripsi.slice(0, 80) });
  revalidatePath("/hrd/ga/housekeeping");
  return { success: true };
}

export async function updateNCStatus(id: string, status: "Terbuka" | "Ditindaklanjuti" | "Ditutup"): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  if (!["Terbuka", "Ditindaklanjuti", "Ditutup"].includes(status)) return { error: "Status tidak valid." };

  const { error } = await supabaseAdmin.from("laporan_ketidaksesuaian").update({ status }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-housekeeping] updateNCStatus error:", error.message); return { error: "Gagal memperbarui status." }; }

  await auditLog({ action: "ga.housekeeping.nc_update", targetId: id, performedBy: user, detail: status });
  revalidatePath("/hrd/ga/housekeeping");
  return { success: true };
}
