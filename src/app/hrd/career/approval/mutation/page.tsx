import { getCareerApprovals } from "@/app/actions/career-development";
import { requireAuth } from "@/lib/auth-guard";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

export default async function MutationApprovalPage() {
  const [{ role }, rows] = await Promise.all([requireAuth(), getCareerApprovals("mutation")]);
  return <CareerApprovalClient title="Mutation Approval" description="Persetujuan berjenjang untuk pengajuan mutasi." initialRows={rows as never} currentRole={role} />;
}
