"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "vpr-" + crypto.randomUUID();

export interface VehicleProcurementRequest {
  id: string; requested_by: string; vehicle_type: string; quantity: number;
  estimated_cost: number | null; reason: string; status: string;
  approved_by: string; rejection_reason: string;
  created_at: string; updated_at: string;
}

export async function submitVehicleRequest(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const vehicle_type = (formData.get("vehicle_type") as string || "").trim();
  const quantity = parseInt(formData.get("quantity") as string || "1") || 1;
  const estimatedRaw = (formData.get("estimated_cost") as string || "").trim();
  const reason = (formData.get("reason") as string || "").trim();

  if (!vehicle_type) return { error: "Jenis kendaraan wajib diisi." };

  const { error } = await supabaseAdmin.from("pengadaan_kendaraan").insert({
    id: uid(),
    requested_by: user.name || user.email,
    vehicle_type, quantity,
    estimated_cost: estimatedRaw ? parseFloat(estimatedRaw) : null,
    reason, status: "Pending",
  });
  if (error) { console.error("[vehicle-procurement] submitVehicleRequest error:", error.message); return { error: "Gagal mengajukan permintaan." }; }

  await supabaseAdmin.from("notifikasi").insert({
    id: "ntf-" + crypto.randomUUID(),
    user_email: "direktur@ptpgp.co.id",
    title: "Pengajuan Pengadaan Kendaraan",
    message: `${user.name || user.email} mengajukan pengadaan ${quantity}x ${vehicle_type}.`,
    link: "/director/vehicle-requests",
  });

  revalidatePath("/hrd/vehicle-requests");
  return { success: true };
}

export async function updateVehicleRequestStatus(id: string, status: "Disetujui" | "Ditolak", rejectionReason?: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("director", "superadmin");

  const { data: req } = await supabaseAdmin.from("pengadaan_kendaraan").select("status").eq("id", id).maybeSingle();
  if (!req) return { error: "Permintaan tidak ditemukan." };
  if ((req as { status?: string }).status !== "Pending") return { error: "Permintaan ini sudah diproses sebelumnya." };
  if (status === "Ditolak" && !(rejectionReason || "").trim()) return { error: "Alasan penolakan wajib diisi." };

  const { error } = await supabaseAdmin.from("pengadaan_kendaraan").update({
    status, approved_by: user.name || user.email,
    rejection_reason: status === "Ditolak" ? (rejectionReason || "").trim() : "",
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: "Gagal memproses. Silakan coba lagi." };

  revalidatePath("/director/vehicle-requests");
  revalidatePath("/hrd/vehicle-requests");
  return { success: true };
}

export async function getVehicleRequests(): Promise<VehicleProcurementRequest[]> {
  await requireRole("hrd", "superadmin", "director");
  const { data } = await supabaseAdmin.from("pengadaan_kendaraan").select("*").order("created_at", { ascending: false }).limit(100);
  return (data as VehicleProcurementRequest[]) || [];
}
