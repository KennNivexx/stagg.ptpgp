import { getCommunications } from "@/app/actions/employee-relations";
import CommunicationClient from "@/components/hrd/CommunicationClient";

export default async function MemosPage() {
  const rows = await getCommunications("Memo");
  return <CommunicationClient type="Memo" title="Internal Memo" description="Surat memo internal antar departemen atau dari manajemen ke tim." initialRows={rows as never} />;
}
