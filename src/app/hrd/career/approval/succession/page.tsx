import { getCareerApprovals } from "@/app/actions/career-development";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

export default async function SuccessionApprovalPage() {
  const rows = await getCareerApprovals("succession");
  return <CareerApprovalClient title="Succession Approval" description="Persetujuan berjenjang untuk penempatan suksesor." initialRows={rows as never} />;
}
