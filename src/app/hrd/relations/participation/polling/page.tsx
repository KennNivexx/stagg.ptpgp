import { getParticipationEntries } from "@/app/actions/employee-relations";
import ParticipationClient from "@/components/hrd/ParticipationClient";

export default async function PollingPage() {
  const rows = await getParticipationEntries("Polling");
  return <ParticipationClient type="Polling" title="Polling" description="Jajak pendapat cepat kepada karyawan, termasuk Employee Net Promoter Score (eNPS)." initialRows={rows as never} hasScore scoreLabel="Skor eNPS" />;
}
