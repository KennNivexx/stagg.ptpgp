import { getErApprovals } from "@/app/actions/employee-relations";
import ErApprovalClient from "@/components/hrd/ErApprovalClient";

export default async function IndustrialApprovalPage() {
  const rows = await getErApprovals("Industrial");
  return <ErApprovalClient title="Industrial Relations Approval" description="Persetujuan untuk proses hubungan industrial." initialRows={rows as never} />;
}
