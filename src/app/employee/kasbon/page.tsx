import { requireRole } from "@/lib/auth-guard";
import { getMyKasbon } from "@/app/actions/kasbon";
import KasbonClient from "./KasbonClient";

export default async function EmployeeKasbon() {
  // Page-level guard on top of getMyKasbon's own — matches the pattern from
  // the RBAC sweep; relying solely on the action throwing is fragile if this
  // page ever gains a second data source.
  await requireRole("employee", "department_manager");
  const kasbon = await getMyKasbon();
  return <KasbonClient initialKasbon={kasbon} />;
}
