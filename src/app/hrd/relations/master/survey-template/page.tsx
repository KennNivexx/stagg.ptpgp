import { getSurveyTemplates } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function SurveyTemplatePage() {
  const rows = await getSurveyTemplates();
  return (
    <MasterDataTable
      title="Survey Template"
      description="Template survei karyawan — Engagement, Satisfaction, eNPS, dan lainnya."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Survey Template."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "survey_type", label: "Jenis" },
        { key: "questions_count", label: "Jumlah Pertanyaan", render: (r) => String(Array.isArray(r.questions) ? r.questions.length : 0) },
      ]}
    />
  );
}
