import { getCareerLevels } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CareerLevelPage() {
  const rows = await getCareerLevels();
  return (
    <MasterDataTable
      title="Career Level"
      description="Standar jenjang karier organisasi, dari Intern hingga Director."
      backHref="/hrd/career"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Career Level."
      columns={[
        { key: "urutan", label: "Urutan" },
        { key: "code", label: "Kode" },
        { key: "name", label: "Jenjang" },
      ]}
    />
  );
}
