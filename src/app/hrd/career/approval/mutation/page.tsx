import { getCareerApprovals } from "@/app/actions/career-development";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

export default async function MutationApprovalPage() {
  const rows = await getCareerApprovals("mutation");
  return <CareerApprovalClient title="Mutation Approval" description="Persetujuan berjenjang untuk pengajuan mutasi." initialRows={rows as never} />;
}
