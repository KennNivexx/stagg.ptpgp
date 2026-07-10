/**
 * Geofence check shared by clockInForEmployee/clockOutForEmployee. Kept out of
 * a "use server" file for the same reason as attendance-core/leaves-core —
 * plain lib exports here are only reachable from other server-side code.
 */
import { supabaseAdmin } from "@/lib/supabase";

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type GeofenceResult =
  | { blocked: true; error: string }
  | { blocked: false; isBusinessTrip: boolean; distanceMeters: number | null; withinGeofence: boolean | null };

/**
 * employeeId here is the session's users.id (attendance.employee_id and
 * business_trips.employee_id both key off it — same convention as
 * leave_requests). employeeEmail is used to resolve the employees.id row
 * (location_id lives there, a different id space — see dual-table-identity
 * memory) so we can look up their assigned work_location.
 */
export async function checkGeofenceForEmployee(params: {
  employeeId: string;
  employeeEmail: string;
  latitude?: string;
  longitude?: string;
}): Promise<GeofenceResult> {
  const { employeeId, employeeEmail } = params;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  const { data: trip } = await supabaseAdmin
    .from("perjalanan_dinas")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("status", "Disetujui")
    .lte("start_date", today)
    .gte("end_date", today)
    .maybeSingle();

  if (trip) {
    return { blocked: false, isBusinessTrip: true, distanceMeters: null, withinGeofence: null };
  }

  const { data: emp } = await supabaseAdmin
    .from("karyawan")
    .select("location_id")
    .eq("email", employeeEmail)
    .maybeSingle();
  const locationId = (emp as { location_id?: string } | null)?.location_id;
  if (!locationId) {
    // Belum ditugaskan ke lokasi kerja manapun — HRD belum mengatur geofence
    // untuk karyawan ini, jadi tidak diblokir (fail-open).
    return { blocked: false, isBusinessTrip: false, distanceMeters: null, withinGeofence: null };
  }

  const { data: loc } = await supabaseAdmin
    .from("lokasi_kerja")
    .select("latitude, longitude, radius_meters, name")
    .eq("id", locationId)
    .maybeSingle();
  const location = loc as { latitude?: number; longitude?: number; radius_meters?: number; name?: string } | null;
  if (!location || location.latitude == null || location.longitude == null) {
    // Lokasi belum dikonfigurasi titik koordinatnya — fail-open.
    return { blocked: false, isBusinessTrip: false, distanceMeters: null, withinGeofence: null };
  }

  const lat = params.latitude ? parseFloat(params.latitude) : NaN;
  const lng = params.longitude ? parseFloat(params.longitude) : NaN;
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { blocked: true, error: "Lokasi GPS tidak terdeteksi. Aktifkan GPS/izin lokasi untuk bisa absen di lokasi kerja ini." };
  }

  const distance = haversineMeters(lat, lng, location.latitude, location.longitude);
  const radius = location.radius_meters ?? 200;
  if (distance > radius) {
    return {
      blocked: true,
      error: `Anda berada ${Math.round(distance)}m dari lokasi kerja "${location.name}" (maks ${radius}m). Absensi hanya bisa dilakukan di dalam area kerja, atau ajukan Perjalanan Dinas jika sedang bertugas di luar.`,
    };
  }

  return { blocked: false, isBusinessTrip: false, distanceMeters: distance, withinGeofence: true };
}
