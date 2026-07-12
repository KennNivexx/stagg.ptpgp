import { getLicenses } from "@/app/actions/licenses";
import { getEmployees } from "@/app/actions/hrd";
import LicensesClient from "./LicensesClient";

export default async function LicensesPage() {
  const [licenses, employeesRaw] = await Promise.all([getLicenses(), getEmployees()]);
  const employees = (employeesRaw as Array<{ id: string; full_name: string; department: string }>).map(e => ({
    id: e.id, full_name: e.full_name, department: e.department,
  }));

  return <LicensesClient initialLicenses={licenses} employees={employees} />;
}
