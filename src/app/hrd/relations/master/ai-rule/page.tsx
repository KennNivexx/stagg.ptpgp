import { getAiRecommendationRules } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function AIRulePage() {
  const rows = await getAiRecommendationRules();
  return (
    <MasterDataTable
      title="AI Recommendation Rule"
      description="Aturan threshold yang dievaluasi AI ER Engine terhadap metrik nyata untuk menghasilkan rekomendasi."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada AI Recommendation Rule."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "trigger_metric", label: "Metrik Trigger" },
        { key: "threshold", label: "Ambang Batas", render: (r) => `${r.comparison === "gte" ? "≥" : r.comparison === "lte" ? "≤" : "="} ${r.threshold_value}` },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
