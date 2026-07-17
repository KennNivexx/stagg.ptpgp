import { getIndustrialMeetings } from "@/app/actions/employee-relations";
import IndustrialMeetingClient from "@/components/hrd/IndustrialMeetingClient";

export default async function MediationPage() {
  const rows = await getIndustrialMeetings("Mediation");
  return <IndustrialMeetingClient type="Mediation" title="Negotiation & Mediation" description="Proses negosiasi dan mediasi perselisihan hubungan industrial." initialRows={rows as never} />;
}
