import { getCaseCategories } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CaseCategoryPage() {
  const rows = await getCaseCategories();
  return (
    <MasterDataTable
      title="Complaint & Case Category"
      description="Kategori kasus hubungan karyawan beserta tingkat keparahan dan SLA penyelesaian."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Case Category."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "severity", label: "Tingkat Keparahan" },
        { key: "sla_days", label: "SLA (hari)" },
      ]}
    />
  );
}
