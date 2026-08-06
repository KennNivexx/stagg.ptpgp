import { requireRole } from "@/lib/auth-guard";
import { getPayrollPeriods } from "@/app/actions/admin";
import PeriodeClient from "./PeriodeClient";

export default async function PeriodePayrollPage() {
  await requireRole("hrd", "superadmin", "director");
  const periods = await getPayrollPeriods();
  return <PeriodeClient initialPeriods={periods} />;
}
