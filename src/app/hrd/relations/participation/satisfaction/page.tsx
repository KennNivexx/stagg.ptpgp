import { getParticipationEntries } from "@/app/actions/employee-relations";
import ParticipationClient from "@/components/hrd/ParticipationClient";

export default async function SatisfactionPage() {
  const rows = await getParticipationEntries("Satisfaction Survey");
  return <ParticipationClient type="Satisfaction Survey" title="Employee Satisfaction Survey" description="Hasil survei kepuasan karyawan." initialRows={rows as never} hasScore scoreLabel="Skor Kepuasan" />;
}
