import { getMutationPolicies } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function MutationPolicyPage() {
  const rows = await getMutationPolicies();
  return (
    <MasterDataTable
      title="Mutation Policy"
      description="Ketentuan minimum masa kerja dan kinerja untuk mutasi antar unit."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Mutation Policy."
      columns={[
        { key: "min_tenure_months", label: "Min. Masa Kerja (bulan)" },
        { key: "min_performance_score", label: "Min. Skor Kinerja" },
        { key: "allow_cross_stream", label: "Boleh Lintas Stream", render: (r) => (r.allow_cross_stream ? "Ya" : "Tidak") },
      ]}
    />
  );
}
