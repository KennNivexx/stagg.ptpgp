import { getIndustrialMeetings } from "@/app/actions/employee-relations";
import IndustrialMeetingClient from "@/components/hrd/IndustrialMeetingClient";

export default async function DisputePage() {
  const rows = await getIndustrialMeetings("Dispute");
  return <IndustrialMeetingClient type="Dispute" title="Industrial Dispute" description="Kasus perselisihan hubungan industrial yang tercatat." initialRows={rows as never} />;
}
