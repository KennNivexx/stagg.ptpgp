import { getIndustrialMeetings } from "@/app/actions/employee-relations";
import IndustrialMeetingClient from "@/components/hrd/IndustrialMeetingClient";

export default async function PhiPage() {
  const rows = await getIndustrialMeetings("PHI Documentation");
  return <IndustrialMeetingClient type="PHI Documentation" title="PHI Documentation" description="Dokumentasi proses Perselisihan Hubungan Industrial (PHI)." initialRows={rows as never} />;
}
