import { getErApprovals } from "@/app/actions/employee-relations";
import ErApprovalClient from "@/components/hrd/ErApprovalClient";

export default async function SeparationApprovalPage() {
  const rows = await getErApprovals("Separation");
  return <ErApprovalClient title="Separation Approval" description="Persetujuan pemisahan hubungan kerja." initialRows={rows as never} />;
}
