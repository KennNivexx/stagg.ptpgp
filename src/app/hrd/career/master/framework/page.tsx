import { getCareerFrameworks } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CareerFrameworkPage() {
  const rows = await getCareerFrameworks();
  return (
    <MasterDataTable
      title="Career Framework"
      description="Konfigurasi utama sistem karier — versi, status, dan tanggal berlaku."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Career Framework."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "version", label: "Versi" },
        { key: "status", label: "Status" },
        { key: "effective_date", label: "Berlaku Sejak" },
      ]}
    />
  );
}
