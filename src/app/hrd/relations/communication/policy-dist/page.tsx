import { getCommunications } from "@/app/actions/employee-relations";
import CommunicationClient from "@/components/hrd/CommunicationClient";

export default async function PolicyDistributionPage() {
  const rows = await getCommunications("Policy Distribution");
  return <CommunicationClient type="Policy Distribution" title="Policy Distribution" description="Distribusi kebijakan perusahaan kepada karyawan." initialRows={rows as never} />;
}
