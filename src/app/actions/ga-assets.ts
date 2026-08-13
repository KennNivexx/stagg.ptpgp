"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

/** SOP-SDM-10 Pengendalian Aset — General Affair module, table
 * aset_perusahaan / permintaan_perbaikan_aset from
 * 20260816001_general_affair.sql. */

const uid = (prefix: string) => `${prefix}-` + crypto.randomUUID();

export interface Aset {
  id: string;
  nama_aset: string;
  jenis: string;
  kode_aset: string;
  divisi: string | null;
  unit_organisasi_id: string | null;
  penanggung_jawab: string | null;
  jumlah: number;
  kondisi: "Baik" | "Rusak Ringan" | "Rusak Berat" | "Hilang";
  tanggal_input: string;
  status: "Aktif" | "Nonaktif";
  created_at: string;
  updated_at: string;
}

export interface PermintaanPerbaikanAset {
  id: string;
  asset_id: string;
  jenis_permintaan: "Perbaikan" | "Penambahan";
  alasan: string | null;
  status: "Diajukan" | "Disetujui" | "Ditolak" | "Selesai";
  requested_by: string | null;
  approved_by: string | null;
  created_at: string;
}

// Division-code map used when auto-generating kode_aset (PGP-<divisi>-<seq>).
const DIVISI_CODE: Record<string, string> = {
  "SDM & Aset": "GA",
  "Operasional": "OPS",
  "Keuangan": "FIN",
  "IT": "IT",
  "Marketing": "MKT",
};

function divisiCode(divisi: string): string {
  return DIVISI_CODE[divisi] || divisi.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase() || "GA";
}

export async function getAssets(): Promise<Aset[]> {
  await requireRole("hrd", "superadmin", "department_manager", "director");
  const { data, error } = await supabaseAdmin.from("aset_perusahaan").select("*").order("created_at", { ascending: false });
  if (error) { console.error("[ga-assets] getAssets error:", error.message); return []; }
  return (data as Aset[]) || [];
}

export async function createAsset(formData: FormData): Promise<{ error: string } | { success: true; kode_aset: string }> {
  const user = await requireRole("hrd", "superadmin");
  const nama_aset = (formData.get("nama_aset") as string || "").trim();
  const jenis = (formData.get("jenis") as string || "").trim();
  const divisi = (formData.get("divisi") as string || "").trim();
  const penanggung_jawab = (formData.get("penanggung_jawab") as string || "").trim() || null;
  const jumlahRaw = (formData.get("jumlah") as string || "1").trim();
  const kondisi = (formData.get("kondisi") as string || "Baik").trim();

  if (!nama_aset || !jenis || !divisi) return { error: "Nama aset, jenis, dan divisi wajib diisi." };

  const code = divisiCode(divisi);
  const { count } = await supabaseAdmin
    .from("aset_perusahaan")
    .select("*", { count: "exact", head: true })
    .eq("divisi", divisi);
  const seq = String((count || 0) + 1).padStart(3, "0");
  const kode_aset = `PGP-${code}-${seq}`;

  const { error } = await supabaseAdmin.from("aset_perusahaan").insert({
    id: uid("aset"), nama_aset, jenis, kode_aset, divisi,
    penanggung_jawab, jumlah: parseInt(jumlahRaw) || 1,
    kondisi, tanggal_input: new Date().toISOString().split("T")[0],
    status: "Aktif", created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-assets] createAsset error:", error.message); return { error: "Gagal menyimpan aset." }; }

  await auditLog({ action: "ga.asset.create", targetName: nama_aset, performedBy: user, detail: kode_aset });
  revalidatePath("/hrd/ga/assets");
  return { success: true, kode_aset };
}

export async function updateAsset(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  if (!id) return { error: "ID aset tidak valid." };
  const nama_aset = (formData.get("nama_aset") as string || "").trim();
  const jenis = (formData.get("jenis") as string || "").trim();
  const divisi = (formData.get("divisi") as string || "").trim();
  const penanggung_jawab = (formData.get("penanggung_jawab") as string || "").trim() || null;
  const jumlahRaw = (formData.get("jumlah") as string || "1").trim();
  const kondisi = (formData.get("kondisi") as string || "Baik").trim();
  const status = (formData.get("status") as string || "Aktif").trim();

  if (!nama_aset || !jenis || !divisi) return { error: "Nama aset, jenis, dan divisi wajib diisi." };

  const { error } = await supabaseAdmin.from("aset_perusahaan").update({
    nama_aset, jenis, divisi, penanggung_jawab, jumlah: parseInt(jumlahRaw) || 1,
    kondisi, status, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-assets] updateAsset error:", error.message); return { error: "Gagal memperbarui aset." }; }

  await auditLog({ action: "ga.asset.update", targetId: id, targetName: nama_aset, performedBy: user });
  revalidatePath("/hrd/ga/assets");
  return { success: true };
}

export async function getAssetRepairRequests(): Promise<PermintaanPerbaikanAset[]> {
  await requireRole("hrd", "superadmin", "department_manager", "director");
  const { data, error } = await supabaseAdmin.from("permintaan_perbaikan_aset").select("*").order("created_at", { ascending: false });
  if (error) { console.error("[ga-assets] getAssetRepairRequests error:", error.message); return []; }
  return (data as PermintaanPerbaikanAset[]) || [];
}

// Sesuai SOP: permintaan perbaikan/penambahan aset diajukan oleh Kepala Divisi
// (department_manager) atau HRD, lalu diverifikasi dan direalisasikan oleh
// Direktur — dua level otorisasi berbeda, lihat requestAssetRepair vs
// decideAssetRepair.
export async function requestAssetRepair(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const asset_id = (formData.get("asset_id") as string || "").trim();
  const jenis_permintaan = (formData.get("jenis_permintaan") as string || "").trim();
  const alasan = (formData.get("alasan") as string || "").trim() || null;

  if (!asset_id) return { error: "Aset wajib dipilih." };
  if (!["Perbaikan", "Penambahan"].includes(jenis_permintaan)) return { error: "Jenis permintaan tidak valid." };

  const { error } = await supabaseAdmin.from("permintaan_perbaikan_aset").insert({
    id: uid("ppa"), asset_id, jenis_permintaan, alasan,
    status: "Diajukan", requested_by: user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-assets] requestAssetRepair error:", error.message); return { error: "Gagal mengajukan permintaan." }; }

  await auditLog({ action: "ga.asset.repair_request", targetId: asset_id, performedBy: user, detail: jenis_permintaan });
  revalidatePath("/hrd/ga/assets");
  return { success: true };
}

// Realization/decision is Direktur's alone per SOP-SDM-10 ("diverifikasi dan
// direalisasikan oleh Direktur") — previously this also accepted "hrd",
// which meant HRD could approve/reject/complete its own request end-to-end
// with no director involvement at all, the exact two-tier separation the
// SOP comment on requestAssetRepair() describes but never enforced.
// superadmin stays as the standing break-glass override used everywhere
// else in this app.
export async function decideAssetRepair(id: string, decision: "Disetujui" | "Ditolak" | "Selesai"): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("director", "superadmin");
  if (!["Disetujui", "Ditolak", "Selesai"].includes(decision)) return { error: "Keputusan tidak valid." };

  const { error } = await supabaseAdmin.from("permintaan_perbaikan_aset").update({
    status: decision, approved_by: user.email,
  }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-assets] decideAssetRepair error:", error.message); return { error: "Gagal memproses keputusan." }; }

  await auditLog({ action: "ga.asset.repair_decision", targetId: id, performedBy: user, detail: decision });
  revalidatePath("/hrd/ga/assets");
  return { success: true };
}
