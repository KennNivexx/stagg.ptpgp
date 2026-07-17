import { getParticipationEntries } from "@/app/actions/employee-relations";
import ParticipationClient from "@/components/hrd/ParticipationClient";

export default async function VoicePage() {
  const rows = await getParticipationEntries("Voice of Employee");
  return <ParticipationClient type="Voice of Employee" title="Voice of Employee" description="Aspirasi dan pendapat karyawan, dapat disampaikan secara anonim." initialRows={rows as never} />;
}
