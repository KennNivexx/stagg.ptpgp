import { getExitReasons } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function ExitReasonPage() {
  const rows = await getExitReasons();
  return (
    <MasterDataTable
      title="Exit Reason"
      description="Alasan pemisahan hubungan kerja untuk exit interview dan analisis turnover."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Exit Reason."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "category", label: "Kategori" },
      ]}
    />
  );
}
