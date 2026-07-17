import { getParticipationEntries } from "@/app/actions/employee-relations";
import ParticipationClient from "@/components/hrd/ParticipationClient";

export default async function InnovationsPage() {
  const rows = await getParticipationEntries("Innovation");
  return <ParticipationClient type="Innovation" title="Innovation Proposal" description="Proposal inovasi dari karyawan." initialRows={rows as never} />;
}
