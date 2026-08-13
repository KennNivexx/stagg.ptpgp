import { getCareerApprovals } from "@/app/actions/career-development";
import { requireAuth } from "@/lib/auth-guard";
import CareerApprovalClient from "@/components/hrd/CareerApprovalClient";

export default async function SuccessionApprovalPage() {
  const [{ role }, rows] = await Promise.all([requireAuth(), getCareerApprovals("succession")]);
  return <CareerApprovalClient title="Succession Approval" description="Persetujuan berjenjang untuk penempatan suksesor." initialRows={rows as never} currentRole={role} />;
}
