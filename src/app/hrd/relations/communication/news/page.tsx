import { getCommunications } from "@/app/actions/employee-relations";
import CommunicationClient from "@/components/hrd/CommunicationClient";

export default async function CompanyNewsPage() {
  const rows = await getCommunications("News");
  return <CommunicationClient type="News" title="Company News" description="Berita dan informasi umum perusahaan untuk seluruh karyawan." initialRows={rows as never} />;
}
