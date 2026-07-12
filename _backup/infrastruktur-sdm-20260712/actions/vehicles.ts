"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "veh-" + crypto.randomUUID();

export interface Vehicle {
  id: string; plate_number: string; type: string; brand: string; model: string;
  year: number | null; status: string;
  stnk_expiry: string | null; kir_expiry: string | null; insurance_expiry: string | null;
  assigned_driver_id: string | null; notes: string;
  created_at: string; updated_at: string;
}

export async function getVehicles(): Promise<Vehicle[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("kendaraan").select("*").order("plate_number");
  return (data as Vehicle[]) || [];
}

export async function saveVehicle(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const plate_number = (formData.get("plate_number") as string || "").trim();
  const type = (formData.get("type") as string || "Truk").trim();
  const brand = (formData.get("brand") as string || "").trim();
  const model = (formData.get("model") as string || "").trim();
  const yearRaw = (formData.get("year") as string || "").trim();
  const status = (formData.get("status") as string || "Aktif").trim();
  const stnk_expiry = (formData.get("stnk_expiry") as string || "").trim() || null;
  const kir_expiry = (formData.get("kir_expiry") as string || "").trim() || null;
  const insurance_expiry = (formData.get("insurance_expiry") as string || "").trim() || null;
  const notes = (formData.get("notes") as string || "").trim();

  if (!plate_number) return { error: "Nomor plat wajib diisi." };

  const { error } = await supabaseAdmin.from("kendaraan").upsert({
    id: id || uid(),
    plate_number, type, brand, model,
    year: yearRaw ? parseInt(yearRaw) : null,
    status, stnk_expiry, kir_expiry, insurance_expiry, notes,
    updated_at: new Date().toISOString(),
  });
  if (error) { console.error("[vehicles] saveVehicle error:", error.message); return { error: "Gagal menyimpan data kendaraan." }; }
  revalidatePath("/hrd/infrastructure/vehicles");
  return { success: true };
}

export async function deleteVehicle(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("kendaraan").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus kendaraan." };
  revalidatePath("/hrd/infrastructure/vehicles");
  return { success: true };
}

/**
 * Armada milik departemen manager yang login — dihitung lewat supir yang
 * ditugaskan (assigned_driver_id), bukan field department langsung di
 * vehicles, karena satu kendaraan tidak "milik" departemen tapi "dipakai
 * oleh" supir yang berasal dari suatu departemen. Generik untuk semua
 * departemen — kalau departemennya tidak punya supir/kendaraan, hasilnya
 * kosong (bukan error), sama seperti pola getDeptData/getAttendanceForDept.
 */
export async function getFleetForDept(): Promise<{ vehicles: Vehicle[]; department: string | null }> {
  const user = await requireRole("department_manager", "superadmin");
  if (user.role === "superadmin") return { vehicles: [], department: null };

  const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
  const myDept = (mgr as { department?: string } | null)?.department || null;
  if (!myDept) return { vehicles: [], department: null };

  const { data: deptEmployees } = await supabaseAdmin.from("karyawan").select("id").eq("department", myDept);
  const employeeIds = (deptEmployees || []).map((e: { id: string }) => e.id);
  if (employeeIds.length === 0) return { vehicles: [], department: myDept };

  const { data: vehicles } = await supabaseAdmin.from("kendaraan").select("*").in("assigned_driver_id", employeeIds).order("plate_number");
  return { vehicles: (vehicles as Vehicle[]) || [], department: myDept };
}

export interface VehicleLiveStatus extends Vehicle {
  driver_name: string | null;
  live_status: "Sedang Jalan" | "Tersedia" | "Servis" | "Nonaktif";
  current_trip_destination: string | null;
  current_trip_since: string | null;
}

function expiryDaysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

/** Dashboard real-time armada tim — kendaraan mana yang sedang jalan (ada
 * trip aktif), mana yang available, mana yang lagi servis. */
export async function getFleetLiveForDept(): Promise<{ vehicles: VehicleLiveStatus[]; department: string | null }> {
  const { vehicles, department } = await getFleetForDept();
  if (vehicles.length === 0) return { vehicles: [], department };

  const { data: driverRows } = await supabaseAdmin.from("karyawan").select("id, full_name").in("id", vehicles.map(v => v.assigned_driver_id).filter(Boolean) as string[]);
  const driverNameById: Record<string, string> = {};
  (driverRows || []).forEach((d: { id: string; full_name: string }) => { driverNameById[d.id] = d.full_name; });

  const { data: ongoingTrips } = await supabaseAdmin
    .from("trip_supir")
    .select("vehicle_id, destination, start_time")
    .eq("status", "Berjalan")
    .in("vehicle_id", vehicles.map(v => v.id));
  const tripByVehicle: Record<string, { destination: string; start_time: string }> = {};
  (ongoingTrips || []).forEach((t: { vehicle_id: string; destination: string; start_time: string }) => { tripByVehicle[t.vehicle_id] = t; });

  const result: VehicleLiveStatus[] = vehicles.map(v => {
    const trip = tripByVehicle[v.id];
    let live_status: VehicleLiveStatus["live_status"] = "Tersedia";
    if (v.status === "Servis") live_status = "Servis";
    else if (v.status === "Nonaktif") live_status = "Nonaktif";
    else if (trip) live_status = "Sedang Jalan";

    return {
      ...v,
      driver_name: v.assigned_driver_id ? driverNameById[v.assigned_driver_id] || null : null,
      live_status,
      current_trip_destination: trip?.destination || null,
      current_trip_since: trip?.start_time || null,
    };
  });
  return { vehicles: result, department };
}

/**
 * Dipanggil saat kepala departemen membuka dashboard armada — kalau ada
 * dokumen kendaraan tim yang akan habis dalam 14 hari, kirim notifikasi.
 * Di-dedupe (skip kalau sudah pernah dikirim dalam 7 hari terakhir untuk
 * kendaraan yang sama) karena sistem ini tidak punya cron job — jadi
 * pengecekan terjadi "on-view", bukan benar-benar proaktif di background.
 */
export async function checkAndNotifyFleetExpiry(): Promise<{ notified: number }> {
  const user = await requireRole("department_manager", "superadmin");
  if (user.role === "superadmin") return { notified: 0 };

  const { vehicles, department } = await getFleetForDept();
  if (!department || vehicles.length === 0) return { notified: 0 };

  const soon = vehicles.filter(v => {
    const days = [expiryDaysLeft(v.stnk_expiry), expiryDaysLeft(v.kir_expiry), expiryDaysLeft(v.insurance_expiry)];
    return days.some(d => d !== null && d <= 14);
  });
  if (soon.length === 0) return { notified: 0 };

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  let notified = 0;
  for (const v of soon) {
    const dedupeTitle = `Dokumen Kendaraan Segera Habis: ${v.plate_number}`;
    const { data: existing } = await supabaseAdmin
      .from("notifikasi")
      .select("id")
      .eq("user_email", user.email)
      .eq("title", dedupeTitle)
      .gte("created_at", sevenDaysAgo)
      .maybeSingle();
    if (existing) continue;

    await supabaseAdmin.from("notifikasi").insert({
      id: "ntf-" + crypto.randomUUID(),
      user_email: user.email,
      title: dedupeTitle,
      message: `STNK/KIR/Asuransi kendaraan ${v.plate_number} akan habis dalam waktu dekat. Segera jadwalkan perpanjangan.`,
      link: "/department/fleet",
    });
    notified++;
  }
  return { notified };
}

export interface FleetExecutiveSummary {
  totalVehicles: number; activeVehicles: number; onTripNow: number; inService: number;
  expiringDocs30d: number; expiredDocs: number;
}

/** Ringkasan armada perusahaan untuk dashboard eksekutif Direktur. */
export async function getFleetExecutiveSummary(): Promise<FleetExecutiveSummary> {
  await requireRole("director", "superadmin");
  const { data } = await supabaseAdmin.from("kendaraan").select("*");
  const vehicles = (data as Vehicle[]) || [];

  const { data: ongoing } = await supabaseAdmin.from("trip_supir").select("vehicle_id").eq("status", "Berjalan");
  const onTripVehicleIds = new Set((ongoing || []).map((t: { vehicle_id: string | null }) => t.vehicle_id).filter(Boolean));

  let expiringDocs30d = 0, expiredDocs = 0;
  for (const v of vehicles) {
    for (const d of [v.stnk_expiry, v.kir_expiry, v.insurance_expiry]) {
      const days = expiryDaysLeft(d);
      if (days === null) continue;
      if (days < 0) expiredDocs++;
      else if (days <= 30) expiringDocs30d++;
    }
  }

  return {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === "Aktif").length,
    onTripNow: onTripVehicleIds.size,
    inService: vehicles.filter(v => v.status === "Servis").length,
    expiringDocs30d, expiredDocs,
  };
}

/** Kendaraan yang ditugaskan ke karyawan yang login sendiri, untuk reminder
 * pribadi jadwal servis/dokumen. */
export async function getMyVehicle(): Promise<Vehicle | null> {
  const user = await requireRole("employee", "department_manager", "hrd", "superadmin");
  const { data: emp } = await supabaseAdmin.from("karyawan").select("id").eq("email", user.email).maybeSingle();
  const employeeId = (emp as { id?: string } | null)?.id;
  if (!employeeId) return null;
  const { data } = await supabaseAdmin.from("kendaraan").select("*").eq("assigned_driver_id", employeeId).maybeSingle();
  return (data as Vehicle) || null;
}

export async function assignVehicleDriver(vehicleId: string, employeeId: string | null): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("kendaraan").update({ assigned_driver_id: employeeId, updated_at: new Date().toISOString() }).eq("id", vehicleId);
  if (error) return { error: "Gagal menugaskan supir." };
  revalidatePath("/hrd/infrastructure/vehicles");
  return { success: true };
}
