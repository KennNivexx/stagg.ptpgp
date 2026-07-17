import { getCareerAssessments, getCareerReadinessRules } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type AssessmentRow = Record<string, unknown> & {
  karyawan?: { full_name?: string; department?: string } | null;
  career_readiness_rules?: { category_name?: string; color_code?: string } | null;
};
type RuleRow = { id: string; category_name: string; color_code: string | null };

export default async function CareerReadinessPage() {
  const [assessments, rules] = await Promise.all([getCareerAssessments(), getCareerReadinessRules()]);
  const rows = assessments as AssessmentRow[];

  const countByCategory: Record<string, number> = {};
  rows.forEach((r) => {
    const name = r.career_readiness_rules?.category_name;
    if (name) countByCategory[name] = (countByCategory[name] || 0) + 1;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Career Readiness</h1>
        <p className="text-sm text-slate-500 mt-1">Distribusi tingkat kesiapan karier seluruh karyawan yang sudah dinilai.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {(rules as RuleRow[]).map((rule) => (
          <div key={rule.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: rule.color_code || "#94a3b8" }} />
              <p className="text-[10px] font-bold text-slate-400 uppercase leading-snug">{rule.category_name}</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-800">{countByCategory[rule.category_name] || 0}</p>
          </div>
        ))}
      </div>

      <MasterDataTable
        bare
        title="Detail per Karyawan"
        description="Kesiapan karier berdasarkan Career Assessment terakhir."
        backHref="/hrd/career"
        rows={rows}
        emptyLabel="Belum ada data kesiapan karier."
        columns={[
          { key: "name", label: "Karyawan", render: (r) => (r as AssessmentRow).karyawan?.full_name || "-" },
          { key: "department", label: "Departemen", render: (r) => (r as AssessmentRow).karyawan?.department || "-" },
          { key: "final_career_score", label: "Career Score" },
          { key: "readiness", label: "Kesiapan", render: (r) => (r as AssessmentRow).career_readiness_rules?.category_name || "-" },
        ]}
      />
    </div>
  );
}
