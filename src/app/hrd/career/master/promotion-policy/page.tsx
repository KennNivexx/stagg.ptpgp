import { getPromotionPolicies } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function PromotionPolicyPage() {
  const rows = await getPromotionPolicies();
  return (
    <MasterDataTable
      title="Promotion Policy"
      description="Persyaratan promosi — dapat dikonfigurasi per framework."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Promotion Policy."
      columns={[
        { key: "min_performance_score", label: "Min. Skor Kinerja" },
        { key: "min_competency_score", label: "Min. Skor Kompetensi" },
        { key: "min_leadership_score", label: "Min. Skor Leadership" },
        { key: "min_attendance_pct", label: "Min. Kehadiran %" },
        { key: "must_pass_assessment", label: "Wajib Assessment Center", render: (r) => (r.must_pass_assessment ? "Ya" : "Tidak") },
        { key: "require_vacant_position", label: "Butuh Posisi Kosong", render: (r) => (r.require_vacant_position ? "Ya" : "Tidak") },
      ]}
    />
  );
}
