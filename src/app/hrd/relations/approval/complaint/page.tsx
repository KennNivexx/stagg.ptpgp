import { getErApprovals } from "@/app/actions/employee-relations";
import ErApprovalClient from "@/components/hrd/ErApprovalClient";

export default async function ComplaintApprovalPage() {
  const rows = await getErApprovals("Complaint");
  return <ErApprovalClient title="Complaint Approval" description="Persetujuan penanganan kasus complaint." initialRows={rows as never} />;
}
