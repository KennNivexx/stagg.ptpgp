import { getParticipationEntries } from "@/app/actions/employee-relations";
import ParticipationClient from "@/components/hrd/ParticipationClient";

export default async function FeedbackPage() {
  const rows = await getParticipationEntries("Feedback");
  return <ParticipationClient type="Feedback" title="Employee Feedback" description="Umpan balik karyawan atas kebijakan atau layanan HR." initialRows={rows as never} />;
}
