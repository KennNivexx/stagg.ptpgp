import { getCareerScoreFormulas } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CareerScoreFormulaPage() {
  const rows = await getCareerScoreFormulas();
  return (
    <MasterDataTable
      title="Career Score Formula"
      description="Bobot masing-masing komponen yang membentuk Career Score."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Career Score Formula."
      columns={[
        { key: "performance_weight_pct", label: "Kinerja %" },
        { key: "competency_weight_pct", label: "Kompetensi %" },
        { key: "skills_weight_pct", label: "Skills %" },
        { key: "leadership_weight_pct", label: "Leadership %" },
        { key: "learning_weight_pct", label: "Learning %" },
        { key: "attendance_weight_pct", label: "Kehadiran %" },
        { key: "discipline_weight_pct", label: "Disiplin %" },
        { key: "innovation_weight_pct", label: "Inovasi %" },
        { key: "experience_weight_pct", label: "Pengalaman %" },
        { key: "assessment_weight_pct", label: "Assessment %" },
      ]}
    />
  );
}
