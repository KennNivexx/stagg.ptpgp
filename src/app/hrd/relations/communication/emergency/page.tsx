import { getCommunications } from "@/app/actions/employee-relations";
import CommunicationClient from "@/components/hrd/CommunicationClient";

export default async function EmergencyPage() {
  const rows = await getCommunications("Emergency");
  return <CommunicationClient type="Emergency" title="Emergency Notification" description="Notifikasi darurat dengan prioritas tertinggi untuk seluruh karyawan." initialRows={rows as never} />;
}
