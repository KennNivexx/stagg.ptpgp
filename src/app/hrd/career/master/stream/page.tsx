import { getCareerStreams } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CareerStreamPage() {
  const rows = await getCareerStreams();
  return (
    <MasterDataTable
      title="Career Stream"
      description="Jalur pengembangan karier berdasarkan karakteristik pekerjaan."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Career Stream."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "description", label: "Keterangan" },
      ]}
    />
  );
}
