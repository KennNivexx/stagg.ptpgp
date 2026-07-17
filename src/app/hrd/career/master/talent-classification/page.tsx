import { getTalentClassifications } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function TalentClassificationPage() {
  const rows = await getTalentClassifications();
  return (
    <MasterDataTable
      title="Talent Classification"
      description="Kategori 9-Box Matrix — kombinasi rentang skor kinerja dan potensi."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Talent Classification."
      columns={[
        { key: "name", label: "Kategori", render: (r) => (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: String(r.color_code || "#94a3b8") }} />
            {String(r.name)}
          </span>
        ) },
        { key: "performance_range", label: "Rentang Kinerja", render: (r) => `${r.performance_min}–${r.performance_max}` },
        { key: "potential_range", label: "Rentang Potensi", render: (r) => `${r.potential_min}–${r.potential_max}` },
      ]}
    />
  );
}
