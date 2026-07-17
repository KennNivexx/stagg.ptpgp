import { getDisciplinaryCategories } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function DisciplinaryCategoryPage() {
  const rows = await getDisciplinaryCategories();
  return (
    <MasterDataTable
      title="Disciplinary Category"
      description="Klasifikasi pelanggaran disiplin dan sanksi yang berlaku sesuai Peraturan Perusahaan."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Disciplinary Category."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
        { key: "sp_level", label: "Level Sanksi" },
      ]}
    />
  );
}
