import { getCareerCommitteeApprovals } from "@/app/actions/career-development";
import { requireAuth } from "@/lib/auth-guard";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

export default async function CareerCommitteePage() {
  const [{ role }, rows] = await Promise.all([requireAuth(), getCareerCommitteeApprovals()]);
  return <CareerApprovalClient title="Career Committee" description="Langkah persetujuan level komite untuk transaksi karier yang memerlukan tinjauan bersama." initialRows={rows as never} currentRole={role} />;
}
