import { getErApprovals } from "@/app/actions/employee-relations";
import ErApprovalClient from "@/components/hrd/ErApprovalClient";

export default async function InvestigationApprovalPage() {
  const rows = await getErApprovals("Investigation");
  return <ErApprovalClient title="Investigation Approval" description="Persetujuan untuk memulai proses investigasi." initialRows={rows as never} />;
}
