import { getTrips } from "@/app/actions/trips";
import { getSupirForAssignment } from "@/app/actions/vehicles";
import { getVehicles } from "@/app/actions/vehicles";
import TripsClient from "./TripsClient";

export default async function TripsPage() {
  const [trips, supirRaw, vehicles] = await Promise.all([
    getTrips(),
    getSupirForAssignment(),
    getVehicles(),
  ]);
  const employees = (supirRaw as Array<{
    id: string; full_name: string; department: string;
    kode_jabatan: string | null; nik: string | null; position: string;
  }>).map(e => ({
    id: e.id, full_name: e.full_name, department: e.department,
    kode_jabatan: e.kode_jabatan, nik: e.nik, position: e.position,
  }));

  return <TripsClient initialTrips={trips} employees={employees} vehicles={vehicles} />;
}
