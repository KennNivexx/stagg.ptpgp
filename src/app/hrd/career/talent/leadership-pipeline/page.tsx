import { getLeadershipPipeline } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  karyawan?: { full_name?: string; department?: string; position?: string } | null;
  target?: { name?: string; level?: string } | null;
};

export default async function LeadershipPipelinePage() {
  const rows = (await getLeadershipPipeline()) as Row[];
  return (
    <MasterDataTable
      title="Leadership Pipeline"
      description="Kandidat Talent Pool yang mengarah ke posisi Manager ke atas."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada kandidat di Leadership Pipeline."
      columns={[
        { key: "name", label: "Karyawan", render: (r) => (r as Row).karyawan?.full_name || "-" },
        { key: "department", label: "Departemen", render: (r) => (r as Row).karyawan?.department || "-" },
        { key: "current", label: "Posisi Saat Ini", render: (r) => (r as Row).karyawan?.position || "-" },
        { key: "target", label: "Posisi Target", render: (r) => (r as Row).target?.name || "-" },
        { key: "level", label: "Jenjang Target", render: (r) => (r as Row).target?.level || "-" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
