"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "trip-" + crypto.randomUUID();

export interface Trip {
  id: string; driver_id: string; driver_name: string; department: string;
  vehicle_id: string | null; vehicle_plate: string;
  origin: string; destination: string; trip_date: string;
  start_time: string; end_time: string | null;
  distance_km: number | null; rate_per_km: number; status: string;
  incentive_generated: boolean; notes: string;
  created_at: string; updated_at: string;
}

export async function getTrips(params?: { driverId?: string; status?: string; from?: string; to?: string }): Promise<Trip[]> {
  await requireRole("hrd", "superadmin");
  let q = supabaseAdmin.from("trip_supir").select("*").order("trip_date", { ascending: false }).order("start_time", { ascending: false });
  if (params?.driverId) q = q.eq("driver_id", params.driverId);
  if (params?.status) q = q.eq("status", params.status);
  if (params?.from) q = q.gte("trip_date", params.from);
  if (params?.to) q = q.lte("trip_date", params.to);
  const { data } = await q.limit(500);
  return (data as Trip[]) || [];
}

export async function saveTrip(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const driver_id = (formData.get("driver_id") as string || "").trim();
  const vehicle_id = (formData.get("vehicle_id") as string || "").trim() || null;
  const origin = (formData.get("origin") as string || "").trim();
  const destination = (formData.get("destination") as string || "").trim();
  const trip_date = (formData.get("trip_date") as string || "").trim();
  const start_time = (formData.get("start_time") as string || "").trim();
  const end_time = (formData.get("end_time") as string || "").trim() || null;
  const distanceRaw = (formData.get("distance_km") as string || "").trim();
  const rateRaw = (formData.get("rate_per_km") as string || "").trim();
  const status = (formData.get("status") as string || "Berjalan").trim();
  const notes = (formData.get("notes") as string || "").trim();

  if (!driver_id || !destination || !trip_date || !start_time) {
    return { error: "Supir, tujuan, tanggal, dan jam mulai wajib diisi." };
  }

  const { data: emp } = await supabaseAdmin.from("karyawan").select("full_name, department").eq("id", driver_id).maybeSingle();
  let vehiclePlate = "";
  if (vehicle_id) {
    const { data: veh } = await supabaseAdmin.from("kendaraan").select("plate_number").eq("id", vehicle_id).maybeSingle();
    vehiclePlate = (veh as { plate_number?: string } | null)?.plate_number || "";
  }

  const { error } = await supabaseAdmin.from("trip_supir").upsert({
    id: id || uid(),
    driver_id,
    driver_name: emp?.full_name || "",
    department: emp?.department || "",
    vehicle_id, vehicle_plate: vehiclePlate,
    origin, destination, trip_date,
    start_time: new Date(start_time).toISOString(),
    end_time: end_time ? new Date(end_time).toISOString() : null,
    distance_km: distanceRaw ? parseFloat(distanceRaw) : null,
    rate_per_km: rateRaw ? parseFloat(rateRaw) : 2000,
    status, notes,
    updated_at: new Date().toISOString(),
  });
  if (error) { console.error("[trips] saveTrip error:", error.message); return { error: "Gagal menyimpan data trip." }; }
  revalidatePath("/hrd/trips");
  return { success: true };
}

export async function deleteTrip(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("trip_supir").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus data trip." };
  revalidatePath("/hrd/trips");
  return { success: true };
}

/** Trip tim milik kepala departemen yang login — trips.department sudah
 * diisi saat saveTrip() (dari employees.department si supir), jadi cukup
 * filter langsung, sama seperti getLeaves() dept-scoped. Generik untuk
 * semua departemen. */
export async function getTripsForDept(params?: { from?: string; to?: string }): Promise<{ trips: Trip[]; department: string | null }> {
  const user = await requireRole("department_manager", "superadmin");
  if (user.role === "superadmin") return { trips: [], department: null };

  const { data: mgr } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
  const myDept = (mgr as { department?: string } | null)?.department || null;
  if (!myDept) return { trips: [], department: null };

  let q = supabaseAdmin.from("trip_supir").select("*").eq("department", myDept).order("trip_date", { ascending: false });
  if (params?.from) q = q.gte("trip_date", params.from);
  if (params?.to) q = q.lte("trip_date", params.to);
  const { data } = await q.limit(500);
  return { trips: (data as Trip[]) || [], department: myDept };
}

/** Trip milik karyawan/supir yang login sendiri. trips.driver_id adalah
 * employees.id (diisi dari daftar supir saat HRD mencatat trip), berbeda
 * dari users.id sesi — jadi perlu resolve lewat email dulu. */
export async function getMyTrips(): Promise<Trip[]> {
  const user = await requireRole("employee", "department_manager", "hrd", "superadmin");
  const { data: emp } = await supabaseAdmin.from("karyawan").select("id").eq("email", user.email).maybeSingle();
  const employeeId = (emp as { id?: string } | null)?.id;
  if (!employeeId) return [];
  const { data } = await supabaseAdmin.from("trip_supir").select("*").eq("driver_id", employeeId).order("trip_date", { ascending: false }).limit(100);
  return (data as Trip[]) || [];
}

export interface DriverHoursSummary {
  driver_id: string; driver_name: string; department: string;
  totalHours: number; tripCount: number; maxDailyHours: number;
}

/**
 * Rekap jam mengemudi per supir dalam rentang tanggal — dipakai untuk
 * fatigue compliance. maxDailyHours = jam mengemudi terpanjang dalam SATU
 * hari pada rentang ini (bukan rata-rata), karena itu yang relevan untuk
 * menandai supir yang kelelahan pada hari tertentu.
 */
export async function getDriverHoursSummary(params: { from: string; to: string }): Promise<DriverHoursSummary[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("trip_supir")
    .select("driver_id, driver_name, department, trip_date, start_time, end_time")
    .gte("trip_date", params.from)
    .lte("trip_date", params.to)
    .not("end_time", "is", null);

  const rows = (data as Array<{ driver_id: string; driver_name: string; department: string; trip_date: string; start_time: string; end_time: string }>) || [];
  const byDriver: Record<string, { name: string; dept: string; totalHours: number; tripCount: number; dailyHours: Record<string, number> }> = {};

  for (const r of rows) {
    const hours = (new Date(r.end_time).getTime() - new Date(r.start_time).getTime()) / (1000 * 60 * 60);
    if (hours <= 0) continue;
    const entry = (byDriver[r.driver_id] ||= { name: r.driver_name, dept: r.department, totalHours: 0, tripCount: 0, dailyHours: {} });
    entry.totalHours += hours;
    entry.tripCount += 1;
    entry.dailyHours[r.trip_date] = (entry.dailyHours[r.trip_date] || 0) + hours;
  }

  return Object.entries(byDriver).map(([driver_id, v]) => ({
    driver_id, driver_name: v.name, department: v.dept,
    totalHours: Math.round(v.totalHours * 10) / 10,
    tripCount: v.tripCount,
    maxDailyHours: Math.round(Math.max(...Object.values(v.dailyHours)) * 10) / 10,
  })).sort((a, b) => b.maxDailyHours - a.maxDailyHours);
}

/**
 * Generate insentif trip-based untuk satu bulan — dijumlah dari trip
 * berstatus "Selesai" yang belum pernah digenerate (incentive_generated =
 * false), lalu dimasukkan ke tabel incentive_payments yang SUDAH ADA
 * (type='incentive', status='Pending') supaya masuk alur approval &
 * payroll yang sudah berjalan tanpa mengubah engine payroll sama sekali.
 */
export async function generateTripIncentives(month: number, year: number): Promise<{ error: string } | { success: true; generated: number; totalAmount: number }> {
  const user = await requireRole("hrd", "superadmin");
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: trips } = await supabaseAdmin
    .from("trip_supir")
    .select("id, driver_id, distance_km, rate_per_km")
    .eq("status", "Selesai")
    .eq("incentive_generated", false)
    .gte("trip_date", from)
    .lte("trip_date", to);

  const rows = (trips as Array<{ id: string; driver_id: string; distance_km: number | null; rate_per_km: number }>) || [];
  if (rows.length === 0) return { success: true, generated: 0, totalAmount: 0 };

  const byDriver: Record<string, { amount: number; tripIds: string[] }> = {};
  for (const t of rows) {
    if (!t.distance_km) continue;
    const entry = (byDriver[t.driver_id] ||= { amount: 0, tripIds: [] });
    entry.amount += t.distance_km * (t.rate_per_km || 2000);
    entry.tripIds.push(t.id);
  }

  const period = `${String(month).padStart(2, "0")}/${year}`;
  let generated = 0;
  let totalAmount = 0;

  for (const [driverId, v] of Object.entries(byDriver)) {
    if (v.amount <= 0) continue;
    const { error } = await supabaseAdmin.from("insentif").insert({
      id: "inc-" + crypto.randomUUID(),
      employee_id: driverId,
      program: "Insentif Trip Berbasis Jarak",
      amount: Math.round(v.amount),
      period,
      notes: `Otomatis dari ${v.tripIds.length} trip selesai periode ${period}`,
      type: "incentive",
      status: "Pending",
      created_at: new Date().toISOString(),
    });
    if (error) { console.error("[trips] generateTripIncentives insert error:", error.message); continue; }

    await supabaseAdmin.from("trip_supir").update({ incentive_generated: true }).in("id", v.tripIds);
    generated++;
    totalAmount += Math.round(v.amount);
  }

  await supabaseAdmin.from("notifikasi").insert({
    id: "ntf-" + crypto.randomUUID(),
    user_email: user.email,
    title: "Insentif Trip Digenerate",
    message: `${generated} supir mendapat insentif trip periode ${period}, total Rp ${totalAmount.toLocaleString("id-ID")}. Cek di Insentif untuk approval.`,
    link: "/hrd/rewards/incentives",
  });

  revalidatePath("/hrd/trips");
  revalidatePath("/hrd/rewards/incentives");
  return { success: true, generated, totalAmount };
}
