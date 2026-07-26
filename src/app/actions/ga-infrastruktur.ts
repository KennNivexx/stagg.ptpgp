"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

/** PR-SDM-07 Pemeliharaan Infrastruktur — General Affair module, tables
 * infrastruktur / pemeliharaan_infrastruktur from
 * 20260816001_general_affair.sql. A single maintenance table covers both
 * the Terjadwal (scheduled) and Reaktif (reactive) branches of the SOP via
 * the `jenis` column. */

const uid = (prefix: string) => `${prefix}-` + crypto.randomUUID();

export interface Infrastruktur {
  id: string;
  nama: string;
  jenis: string | null;
  lokasi: string | null;
  created_at: string;
}

export type MaintenanceStatus = "Diajukan" | "Dianalisis" | "Dikerjakan" | "Diverifikasi" | "Selesai";

export interface PemeliharaanInfrastruktur {
  id: string;
  infrastruktur_id: string;
  jenis: "Terjadwal" | "Reaktif";
  deskripsi: string | null;
  requested_by: string | null;
  tanggal_permintaan: string;
  status: MaintenanceStatus;
  butuh_spare_part: boolean;
  hasil_verifikasi: "Efektif" | "Belum Efektif" | null;
  created_at: string;
  updated_at: string;
}

export async function getInfrastruktur(): Promise<Infrastruktur[]> {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data, error } = await supabaseAdmin.from("infrastruktur").select("*").order("nama");
  if (error) { console.error("[ga-infrastruktur] getInfrastruktur error:", error.message); return []; }
  return (data as Infrastruktur[]) || [];
}

export async function createInfrastruktur(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const nama = (formData.get("nama") as string || "").trim();
  const jenis = (formData.get("jenis") as string || "").trim() || null;
  const lokasi = (formData.get("lokasi") as string || "").trim() || null;
  if (!nama) return { error: "Nama infrastruktur wajib diisi." };

  const { error } = await supabaseAdmin.from("infrastruktur").insert({
    id: uid("infra"), nama, jenis, lokasi, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-infrastruktur] createInfrastruktur error:", error.message); return { error: "Gagal menyimpan infrastruktur." }; }

  await auditLog({ action: "ga.infrastruktur.create", targetName: nama, performedBy: user });
  revalidatePath("/hrd/ga/infrastruktur");
  return { success: true };
}

export async function getMaintenanceRequests(): Promise<PemeliharaanInfrastruktur[]> {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data, error } = await supabaseAdmin.from("pemeliharaan_infrastruktur").select("*").order("created_at", { ascending: false });
  if (error) { console.error("[ga-infrastruktur] getMaintenanceRequests error:", error.message); return []; }
  return (data as PemeliharaanInfrastruktur[]) || [];
}

export async function requestMaintenance(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const infrastruktur_id = (formData.get("infrastruktur_id") as string || "").trim();
  const jenis = (formData.get("jenis") as string || "").trim();
  const deskripsi = (formData.get("deskripsi") as string || "").trim() || null;
  const butuh_spare_part = formData.get("butuh_spare_part") === "on";

  if (!infrastruktur_id) return { error: "Infrastruktur wajib dipilih." };
  if (!["Terjadwal", "Reaktif"].includes(jenis)) return { error: "Jenis pemeliharaan tidak valid." };

  const { error } = await supabaseAdmin.from("pemeliharaan_infrastruktur").insert({
    id: uid("pmi"), infrastruktur_id, jenis, deskripsi, requested_by: user.email,
    tanggal_permintaan: new Date().toISOString().split("T")[0], status: "Diajukan",
    butuh_spare_part, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-infrastruktur] requestMaintenance error:", error.message); return { error: "Gagal mengajukan permintaan pemeliharaan." }; }

  await auditLog({ action: "ga.infrastruktur.maintenance_request", targetId: infrastruktur_id, performedBy: user, detail: jenis });
  revalidatePath("/hrd/ga/infrastruktur");
  return { success: true };
}

export async function updateMaintenanceStatus(id: string, status: MaintenanceStatus, hasilVerifikasi?: "Efektif" | "Belum Efektif"): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const validStatuses: MaintenanceStatus[] = ["Diajukan", "Dianalisis", "Dikerjakan", "Diverifikasi", "Selesai"];
  if (!validStatuses.includes(status)) return { error: "Status tidak valid." };
  if (status === "Diverifikasi" && !hasilVerifikasi) return { error: "Hasil verifikasi wajib diisi." };

  // Jika hasil verifikasi "Belum Efektif", pekerjaan dikembalikan ke status
  // Dikerjakan (siklus ulang) sesuai alur SOP, bukan lanjut ke Selesai.
  const nextStatus: MaintenanceStatus = status === "Diverifikasi" && hasilVerifikasi === "Belum Efektif" ? "Dikerjakan" : status;

  const { error } = await supabaseAdmin.from("pemeliharaan_infrastruktur").update({
    status: nextStatus, hasil_verifikasi: hasilVerifikasi || null, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260816001_general_affair terlebih dahulu." };
  if (error) { console.error("[ga-infrastruktur] updateMaintenanceStatus error:", error.message); return { error: "Gagal memperbarui status." }; }

  await auditLog({ action: "ga.infrastruktur.maintenance_update", targetId: id, performedBy: user, detail: nextStatus });
  revalidatePath("/hrd/ga/infrastruktur");
  return { success: true };
}
