import { getCommunicationCategories } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CommCategoryPage() {
  const rows = await getCommunicationCategories();
  return (
    <MasterDataTable
      title="Communication Category"
      description="Klasifikasi pengumuman, memo, berita, dan surat edaran."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Communication Category."
      columns={[
        { key: "code", label: "Kode" },
        { key: "name", label: "Nama" },
      ]}
    />
  );
}
