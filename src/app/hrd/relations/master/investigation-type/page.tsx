import { getInvestigationTypes } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function InvestigationTypePage() {
  const rows = await getInvestigationTypes();
  return (
    <MasterDataTable
      title="Investigation Type"
      description="Jenis investigasi yang digunakan dalam proses penyelesaian kasus."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Investigation Type."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "description", label: "Keterangan" },
      ]}
    />
  );
}
