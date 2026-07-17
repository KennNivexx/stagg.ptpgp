import { getCareerAssessments } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  karyawan?: { full_name?: string; department?: string } | null;
  career_readiness_rules?: { category_name?: string; color_code?: string } | null;
};

export default async function CareerAssessmentPage() {
  const rows = (await getCareerAssessments()) as Row[];
  return (
    <MasterDataTable
      title="Career Assessment"
      description="Hasil evaluasi otomatis Career Development Engine dari kinerja, kompetensi, skills, leadership, dan indikator lainnya."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada Career Assessment."
      columns={[
        { key: "period", label: "Periode" },
        { key: "name", label: "Karyawan", render: (r) => (r as Row).karyawan?.full_name || "-" },
        { key: "department", label: "Departemen", render: (r) => (r as Row).karyawan?.department || "-" },
        { key: "final_career_score", label: "Career Score" },
        { key: "readiness", label: "Kesiapan", render: (r) => {
          const rule = (r as Row).career_readiness_rules;
          return rule ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: rule.color_code || "#94a3b8" }} />
              {rule.category_name}
            </span>
          ) : "-";
        } },
      ]}
    />
  );
}
