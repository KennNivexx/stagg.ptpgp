import { getCareerApprovals } from "@/app/actions/career-development";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

export default async function PromotionApprovalPage() {
  const rows = await getCareerApprovals("promotion");
  return <CareerApprovalClient title="Promotion Approval" description="Persetujuan berjenjang untuk pengajuan promosi." initialRows={rows as never} />;
}
