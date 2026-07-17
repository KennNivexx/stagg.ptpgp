import { getRotationPolicies } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function RotationPolicyPage() {
  const rows = await getRotationPolicies();
  return (
    <MasterDataTable
      title="Rotation Policy"
      description="Batas masa jabatan maksimum sebelum wajib dirotasi."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Rotation Policy."
      columns={[
        { key: "max_tenure_months", label: "Maks. Masa Jabatan (bulan)" },
        { key: "mandatory_for_talent", label: "Wajib untuk Talent", render: (r) => (r.mandatory_for_talent ? "Ya" : "Tidak") },
      ]}
    />
  );
}
