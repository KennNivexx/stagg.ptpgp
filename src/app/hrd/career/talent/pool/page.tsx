import { getTalentPool } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  karyawan?: { full_name?: string; department?: string; position?: string } | null;
  target?: { name?: string } | null;
};

export default async function TalentPoolPage() {
  const rows = (await getTalentPool()) as Row[];
  return (
    <MasterDataTable
      title="Talent Pool"
      description="Karyawan yang dipersiapkan sebagai kandidat pengembangan karier."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada karyawan di Talent Pool."
      columns={[
        { key: "name", label: "Karyawan", render: (r) => (r as Row).karyawan?.full_name || "-" },
        { key: "department", label: "Departemen", render: (r) => (r as Row).karyawan?.department || "-" },
        { key: "current", label: "Posisi Saat Ini", render: (r) => (r as Row).karyawan?.position || "-" },
        { key: "target", label: "Posisi Target", render: (r) => (r as Row).target?.name || "-" },
        { key: "status", label: "Status" },
        { key: "entered_at", label: "Sejak" },
      ]}
    />
  );
}
