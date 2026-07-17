import { getCodeOfConducts } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CodeOfConductPage() {
  const rows = await getCodeOfConducts();
  return (
    <MasterDataTable
      title="Code of Conduct"
      description="Kode etik yang mendefinisikan standar perilaku dan integritas bagi seluruh karyawan."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Code of Conduct."
      columns={[
        { key: "code", label: "Kode" },
        { key: "title", label: "Judul" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
