import { getLeadershipFrameworks } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function LeadershipFrameworkPage() {
  const rows = await getLeadershipFrameworks();
  return (
    <MasterDataTable
      title="Leadership Framework"
      description="Kerangka kompetensi kepemimpinan yang menjadi acuan penilaian leadership score."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Leadership Framework."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "description", label: "Keterangan" },
      ]}
    />
  );
}
