import { getIndustrialMeetings } from "@/app/actions/employee-relations";
import IndustrialMeetingClient from "@/components/hrd/IndustrialMeetingClient";

export default async function BipartitePage() {
  const rows = await getIndustrialMeetings("Bipartite");
  return <IndustrialMeetingClient type="Bipartite" title="Bipartite Meeting" description="Pertemuan dua pihak antara manajemen dan perwakilan karyawan/serikat pekerja." initialRows={rows as never} />;
}
