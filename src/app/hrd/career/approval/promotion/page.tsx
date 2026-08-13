import { getCareerApprovals } from "@/app/actions/career-development";
import { requireAuth } from "@/lib/auth-guard";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

export default async function PromotionApprovalPage() {
  const [{ role }, rows] = await Promise.all([requireAuth(), getCareerApprovals("promotion")]);
  return <CareerApprovalClient title="Promotion Approval" description="Persetujuan berjenjang untuk pengajuan promosi." initialRows={rows as never} currentRole={role} />;
}
