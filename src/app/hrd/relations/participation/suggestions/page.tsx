import { getParticipationEntries } from "@/app/actions/employee-relations";
import ParticipationClient from "@/components/hrd/ParticipationClient";

export default async function SuggestionsPage() {
  const rows = await getParticipationEntries("Suggestion");
  return <ParticipationClient type="Suggestion" title="Suggestion System" description="Saran dan masukan karyawan untuk perbaikan perusahaan." initialRows={rows as never} />;
}
