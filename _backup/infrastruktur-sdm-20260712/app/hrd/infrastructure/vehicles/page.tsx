import { getVehicles } from "@/app/actions/vehicles";
import { getEmployees } from "@/app/actions/hrd";
import VehiclesClient from "./VehiclesClient";

export default async function VehiclesPage() {
  const [vehicles, employeesRaw] = await Promise.all([getVehicles(), getEmployees()]);
  const employees = (employeesRaw as Array<{ id: string; full_name: string; department: string }>).map(e => ({
    id: e.id, full_name: e.full_name, department: e.department,
  }));

  return <VehiclesClient initialVehicles={vehicles} employees={employees} />;
}
