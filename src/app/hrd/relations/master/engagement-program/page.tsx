import { getEngagementPrograms } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function EngagementProgramPage() {
  const rows = await getEngagementPrograms();
  return (
    <MasterDataTable
      title="Engagement Program"
      description="Katalog program keterlibatan karyawan — town hall, gathering, awards, dan lainnya."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Engagement Program."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama Program" },
        { key: "start_date", label: "Mulai" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
