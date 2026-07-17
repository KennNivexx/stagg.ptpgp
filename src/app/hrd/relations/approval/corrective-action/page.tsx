import { getErApprovals } from "@/app/actions/employee-relations";
import ErApprovalClient from "@/components/hrd/ErApprovalClient";

export default async function CorrectiveActionApprovalPage() {
  const rows = await getErApprovals("Corrective Action");
  return <ErApprovalClient title="Corrective Action Approval" description="Persetujuan tindakan perbaikan/disipliner." initialRows={rows as never} />;
}
