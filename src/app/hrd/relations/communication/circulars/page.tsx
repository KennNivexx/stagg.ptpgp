import { getCommunications } from "@/app/actions/employee-relations";
import CommunicationClient from "@/components/hrd/CommunicationClient";

export default async function CircularsPage() {
  const rows = await getCommunications("Circular");
  return <CommunicationClient type="Circular" title="Circular Letter" description="Surat edaran resmi perusahaan." initialRows={rows as never} />;
}
