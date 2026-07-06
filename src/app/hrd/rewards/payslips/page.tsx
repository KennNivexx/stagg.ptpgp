import { redirect } from "next/navigation";

// This route duplicated /hrd/rewards/payroll exactly (same query, same
// PayrollClient, just a different title prop). Kept as a redirect so the
// existing "Slip Gaji" sidebar entry keeps working without duplicate code.
export default function PayslipsRedirect() {
  redirect("/hrd/rewards/payroll");
}
