import { redirect } from "next/navigation";

// This route duplicated /hrd/rewards/payroll exactly (same query, same
// PayrollClient). Kept as a redirect so the existing dashboard quick-link
// (src/app/hrd/page.tsx) keeps working without pointing at dead code.
export default function HRDPayrollRedirect() {
  redirect("/hrd/rewards/payroll");
}
