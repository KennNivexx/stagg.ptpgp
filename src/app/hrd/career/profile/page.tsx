import { getCareerProfiles } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  karyawan?: { full_name?: string; department?: string; position?: string } | null;
  career_streams?: { name?: string } | null;
  career_levels?: { name?: string } | null;
  target?: { name?: string } | null;
};

export default async function CareerProfilePage() {
  const rows = (await getCareerProfiles()) as Row[];
  return (
    <MasterDataTable
      title="Career Profile"
      description="Profil karier tiap karyawan, ditarik otomatis dari Employee 360°."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada Career Profile."
      columns={[
        { key: "name", label: "Karyawan", render: (r) => (r as Row).karyawan?.full_name || "-" },
        { key: "department", label: "Departemen", render: (r) => (r as Row).karyawan?.department || "-" },
        { key: "position", label: "Posisi Saat Ini", render: (r) => (r as Row).karyawan?.position || "-" },
        { key: "stream", label: "Career Stream", render: (r) => (r as Row).career_streams?.name || "-" },
        { key: "level", label: "Career Level", render: (r) => (r as Row).career_levels?.name || "-" },
        { key: "target", label: "Target Position", render: (r) => (r as Row).target?.name || "-" },
        { key: "last_assessment_date", label: "Asesmen Terakhir" },
      ]}
    />
  );
}
