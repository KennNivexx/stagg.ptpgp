import { getCareerCommitteeApprovals } from "@/app/actions/career-development";
import { requireAuth } from "@/lib/auth-guard";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

// Career Committee approvals require role "director" (career-development.ts's
// decideCareerApproval), but /hrd/* is blocked to that role by middleware.ts —
// the only page that used to expose this decision was under /hrd/career/
// approval/committee, so a director could never actually reach it; every
// submitted transaction sat stuck at this step unless a superadmin
// intervened manually. Same client component and actions as the HRD-side
// page, just reachable from a route directors can actually load.
export default async function DirectorCareerCommitteePage() {
  const [{ role }, rows] = await Promise.all([requireAuth(), getCareerCommitteeApprovals()]);
  return <CareerApprovalClient title="Career Committee" description="Langkah persetujuan level komite untuk transaksi karier yang memerlukan tinjauan bersama." initialRows={rows as never} currentRole={role} />;
}
