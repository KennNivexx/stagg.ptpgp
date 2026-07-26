"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { issueWarning } from "@/app/actions/employee";

const uid = () => "veh-" + crypto.randomUUID();

export interface Vehicle {
  id: string; plate_number: string; type: string; brand: string; model: string;
  year: number | null; status: string;
  stnk_expiry: string | null; kir_expiry: string | null; insurance_expiry: string | null;
  assigned_driver_id: string | null; notes: string;
  created_at: string; updated_at: string;
}

export interface DriverVehicle extends Vehicle {
  driver_name: string | null;
  driver_nik: string | null;
  driver_kode_jabatan: string | null;
}

export async function getVehicles(): Promise<Vehicle[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("kendaraan").select("*").order("plate_number");
  return (data as Vehicle[]) || [];
}

export async function getVehiclesWithDrivers(): Promise<DriverVehicle[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("kendaraan").select("*").order("plate_number");
  const vehicles = (data as Vehicle[]) || [];
  const driverIds = [...new Set(vehicles.map(v => v.assigned_driver_id).filter(Boolean))] as string[];
  const { data: drivers } = driverIds.length
    ? await supabaseAdmin.from("karyawan").select("id, full_name, nik, kode_jabatan").in("id", driverIds)
    : { data: [] };
  const driverMap = new Map((drivers || []).map((d: { id: string; full_name: string; nik: string | null; kode_jabatan: string | null }) => [d.id, d]));
  return vehicles.map(v => {
    const d = v.assigned_driver_id ? driverMap.get(v.assigned_driver_id) : null;
    return {
      ...v,
      driver_name: d?.full_name || null,
      driver_nik: d?.nik || null,
      driver_kode_jabatan: d?.kode_jabatan || null,
    };
  });
}

/**
 * Get only supir (driver) employees for vehicle assignment.
 * Aset Kendaraan hanya untuk jabatan supir - tidak ada jabatan lain.
 */
export async function getSupirForAssignment() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, nik, kode_jabatan, department, position")
    .neq("status", "Inactive")
    .or("position.ilike.%supir%,position.ilike.%sopir%,position.ilike.%driver%")
    .order("full_name");
  return data || [];
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
export async function getFleetForDept(): Promise<{ vehicles: DriverVehicle[]; department: string | null }> {
  const user = await requireRole("department_manager", "superadmin");
  if (user.role === "superadmin") return { vehicles: [], department: null };

  const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
  const myDept = (mgr as { department?: string } | null)?.department || null;
  if (!myDept) return { vehicles: [], department: null };

  const { data: deptEmployees } = await supabaseAdmin.from("karyawan").select("id, full_name, nik, kode_jabatan").eq("department", myDept);
  const employeeIds = (deptEmployees || []).map((e: { id: string }) => e.id);
  if (employeeIds.length === 0) return { vehicles: [], department: myDept };

  const { data: vehicles } = await supabaseAdmin.from("kendaraan").select("*").in("assigned_driver_id", employeeIds).order("plate_number");
  const empMap = new Map((deptEmployees || []).map((e: { id: string; full_name: string; nik: string | null; kode_jabatan: string | null }) => [e.id, e]));
  const result: DriverVehicle[] = ((vehicles as Vehicle[]) || []).map(v => {
    const d = v.assigned_driver_id ? empMap.get(v.assigned_driver_id) : null;
    return { ...v, driver_name: d?.full_name || null, driver_nik: d?.nik || null, driver_kode_jabatan: d?.kode_jabatan || null };
  });
  return { vehicles: result, department: myDept };
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

// ── PR-SDM-02: Monitoring Kinerja Pengemudi (post-hire quarterly review) ───
// Extends the driver domain already anchored in this file (getSupirForAssignment)
// rather than a separate module. Uses migration 20260817001_driver_operator_recruitment_sop.

export interface DriverPerformanceReview {
  id: string;
  employee_id: string;
  employee_name: string;
  periode: string;
  evaluator: string;
  catatan: string;
  hasil: "Baik" | "Perlu Perbaikan" | "Pelanggaran Ringan" | "Pelanggaran Kritikal";
  tindak_lanjut: "Surat Teguran" | "Briefing/Pelatihan Tambahan" | "PHK" | null;
  related_warning_id: string | null;
  created_at: string;
}

const HASIL_MONITORING = ["Baik", "Perlu Perbaikan", "Pelanggaran Ringan", "Pelanggaran Kritikal"] as const;
const TINDAK_LANJUT_MONITORING = ["Surat Teguran", "Briefing/Pelatihan Tambahan", "PHK"] as const;

export async function getDriverPerformanceReviews(employeeId?: string): Promise<DriverPerformanceReview[]> {
  await requireRole("hrd", "superadmin", "department_manager");
  let q = supabaseAdmin.from("monitoring_kinerja_pengemudi").select("*").order("created_at", { ascending: false });
  if (employeeId) q = q.eq("employee_id", employeeId);
  const { data, error } = await q;
  if (error?.code === "42P01") return [];
  return (data as DriverPerformanceReview[]) || [];
}

/**
 * Submit a quarterly driver performance review (Spv/Ka Div Operasional).
 * When hasil === "Pelanggaran Kritikal", this creates a linked entry in the
 * SAME surat_peringatan warning/PHK system every other employee goes
 * through (via the existing issueWarning action in employee.ts) — not a
 * separate, disconnected warning flow.
 */
export async function submitDriverPerformanceReview(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin", "department_manager");

  const employeeId = (formData.get("employee_id") as string || "").trim();
  const periode = (formData.get("periode") as string || "").trim();
  const evaluator = (formData.get("evaluator") as string || "").trim() || user.name || user.email;
  const catatan = (formData.get("catatan") as string || "").trim();
  const hasil = (formData.get("hasil") as string || "").trim() as DriverPerformanceReview["hasil"];
  const tindakLanjutRaw = (formData.get("tindak_lanjut") as string || "").trim();

  if (!employeeId || !periode || !hasil) return { error: "Karyawan, periode, dan hasil wajib diisi." };
  if (!(HASIL_MONITORING as readonly string[]).includes(hasil)) return { error: "Hasil penilaian tidak valid." };
  if (tindakLanjutRaw && !(TINDAK_LANJUT_MONITORING as readonly string[]).includes(tindakLanjutRaw)) {
    return { error: "Tindak lanjut tidak valid." };
  }
  const tindakLanjut = (tindakLanjutRaw || null) as DriverPerformanceReview["tindak_lanjut"];

  const { data: empRow } = await supabaseAdmin
    .from("karyawan").select("id, full_name, email").eq("id", employeeId).maybeSingle();
  const emp = empRow as { id?: string; full_name?: string; email?: string } | null;
  if (!emp) return { error: "Karyawan tidak ditemukan." };

  let relatedWarningId: string | null = null;

  if (hasil === "Pelanggaran Kritikal") {
    const warnFd = new FormData();
    warnFd.set("employee_id", employeeId);
    warnFd.set("employee_name", emp.full_name || "");
    warnFd.set("employee_email", emp.email || "");
    warnFd.set("sp_level", "SP3");
    warnFd.set(
      "reason",
      `Monitoring Kinerja Pengemudi (${periode}): ${catatan || "Pelanggaran kritikal pada evaluasi kinerja pengemudi."}`
    );
    const warnRes = await issueWarning(warnFd);
    if (warnRes && "error" in warnRes) {
      console.error("[vehicles] submitDriverPerformanceReview: gagal membuat surat peringatan terkait:", warnRes.error);
    } else {
      const { data: latestWarning } = await supabaseAdmin
        .from("surat_peringatan")
        .select("id")
        .eq("employee_id", employeeId)
        .eq("sp_level", "SP3")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      relatedWarningId = (latestWarning as { id?: string } | null)?.id || null;
    }
  }

  const { error } = await supabaseAdmin.from("monitoring_kinerja_pengemudi").insert({
    id: "mkp-" + crypto.randomUUID(),
    employee_id: employeeId,
    employee_name: emp.full_name || "",
    periode,
    evaluator,
    catatan: catatan || "",
    hasil,
    tindak_lanjut: tindakLanjut,
    related_warning_id: relatedWarningId,
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260817001_driver_operator_recruitment_sop terlebih dahulu." };
  if (error) {
    console.error("[vehicles] submitDriverPerformanceReview error:", error.message);
    return { error: "Gagal menyimpan hasil monitoring kinerja." };
  }

  revalidatePath("/hrd/workforce/driver-monitoring");
  revalidatePath("/hrd/relations/warnings");
  return { success: true };
}
