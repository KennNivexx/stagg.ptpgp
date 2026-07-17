import { getCareerReadinessRules } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CareerReadinessRulesPage() {
  const rows = await getCareerReadinessRules();
  return (
    <MasterDataTable
      title="Career Readiness Rules"
      description="Ambang skor yang menentukan kategori kesiapan karier seorang karyawan."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Career Readiness Rules."
      columns={[
        { key: "category_name", label: "Kategori", render: (r) => (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: String(r.color_code || "#94a3b8") }} />
            {String(r.category_name)}
          </span>
        ) },
        { key: "score_range", label: "Rentang Skor", render: (r) => `${r.min_score}–${r.max_score}` },
      ]}
    />
  );
}
