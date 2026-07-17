import { getCollectiveAgreements } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function PKBPage() {
  const rows = await getCollectiveAgreements();
  return (
    <MasterDataTable
      title="Perjanjian Kerja Bersama (PKB)"
      description="Perjanjian antara perusahaan dan serikat pekerja yang mengatur syarat dan kondisi kerja secara kolektif."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada PKB."
      columns={[
        { key: "code", label: "Kode" },
        { key: "title", label: "Judul" },
        { key: "period_start", label: "Mulai" },
        { key: "period_end", label: "Berakhir" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
