import { getErApprovals } from "@/app/actions/employee-relations";
import ErApprovalClient from "@/components/hrd/ErApprovalClient";

export default async function CaseClosureApprovalPage() {
  const rows = await getErApprovals("Case Closure");
  return <ErApprovalClient title="Case Closure Approval" description="Persetujuan penutupan kasus." initialRows={rows as never} />;
}
