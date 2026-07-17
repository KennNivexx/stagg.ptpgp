import { getLabourUnions } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & { karyawan?: { full_name?: string } | null };

export default async function LabourUnionPage() {
  const rows = (await getLabourUnions()) as Row[];
  return (
    <MasterDataTable
      title="Labour Union"
      description="Serikat pekerja yang terdaftar di perusahaan."
      backHref="/hrd/relations"
      rows={rows}
      emptyLabel="Belum ada Labour Union terdaftar."
      columns={[
        { key: "name", label: "Nama Serikat" },
        { key: "chairman", label: "Ketua", render: (r) => (r as Row).karyawan?.full_name || "-" },
        { key: "member_count", label: "Jumlah Anggota" },
        { key: "registered_date", label: "Terdaftar Sejak" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
