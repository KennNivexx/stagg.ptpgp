import { getTrips } from "@/app/actions/trips";
import { getEmployees } from "@/app/actions/hrd";
import { getVehicles } from "@/app/actions/vehicles";
import TripsClient from "./TripsClient";

export default async function TripsPage() {
  const [trips, employeesRaw, vehicles] = await Promise.all([
    getTrips(),
    getEmployees(),
    getVehicles(),
  ]);
  const employees = (employeesRaw as Array<{ id: string; full_name: string; department: string }>).map(e => ({
    id: e.id, full_name: e.full_name, department: e.department,
  }));

  return <TripsClient initialTrips={trips} employees={employees} vehicles={vehicles} />;
}
