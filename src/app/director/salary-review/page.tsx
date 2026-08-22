import { getSalaryReviews } from "@/app/actions/rewards";
import SalaryApprovalClient from "@/app/hrd/career/approval/salary/SalaryApprovalClient";

// Same "director role required but /hrd/* blocked for that role" gap as
// /director/career-committee — updateSalaryReviewStatus (rewards.ts)
// requires requireRole("director","superadmin"), but the only page exposing
// this decision lived under /hrd/career/approval/salary, unreachable by an
// actual director. Reuses the exact same client component and actions.
export default async function DirectorSalaryReviewPage() {
  const rows = await getSalaryReviews();
  return <SalaryApprovalClient initialRows={rows as never} />;
}
