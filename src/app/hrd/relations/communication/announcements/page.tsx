import { getCommunications } from "@/app/actions/employee-relations";
import CommunicationClient from "@/components/hrd/CommunicationClient";

export default async function AnnouncementsPage() {
  const rows = await getCommunications("Announcement");
  return <CommunicationClient type="Announcement" title="Company Announcement" description="Pengumuman resmi perusahaan kepada seluruh karyawan atau grup tertentu." initialRows={rows as never} />;
}
