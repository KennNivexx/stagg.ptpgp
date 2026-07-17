import { getIndustrialMeetings } from "@/app/actions/employee-relations";
import IndustrialMeetingClient from "@/components/hrd/IndustrialMeetingClient";

export default async function TripartitePage() {
  const rows = await getIndustrialMeetings("Tripartite");
  return <IndustrialMeetingClient type="Tripartite" title="Tripartite Meeting" description="Pertemuan tiga pihak melibatkan Dinas Ketenagakerjaan." initialRows={rows as never} />;
}
