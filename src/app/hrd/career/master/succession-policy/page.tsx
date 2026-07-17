import { getSuccessionPolicies } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function SuccessionPolicyPage() {
  const rows = await getSuccessionPolicies();
  return (
    <MasterDataTable
      title="Succession Policy"
      description="Ambang skor kesiapan dan jumlah maksimum kandidat suksesor per posisi."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Succession Policy."
      columns={[
        { key: "min_readiness_score", label: "Min. Skor Kesiapan" },
        { key: "max_successors_per_position", label: "Maks. Suksesor / Posisi" },
      ]}
    />
  );
}
