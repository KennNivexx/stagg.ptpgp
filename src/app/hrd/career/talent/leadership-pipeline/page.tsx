// Was reading career-development.ts's getLeadershipPipeline() (table
// talent_pools) — nothing in the app ever writes to it. The real succession
// data HRD enters is "Kandidat Suksesor" at /hrd/succession/candidates
// (succession.ts, table kandidat_suksesor), which records who's being
// groomed to succeed which employee's position — filtered here to the ones
// whose target position looks like Manager-and-above, same intent as the
// original page.
import { getSuccessionCandidates } from "@/app/actions/succession";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  employee?: { full_name?: string; department?: string; position?: string } | null;
  target_position?: { full_name?: string; position?: string } | null;
  readiness_override?: number | null;
};

const LEADERSHIP_KEYWORDS = ["Manager", "General Manager", "Direktur", "Kepala Divisi"];

export default async function LeadershipPipelinePage() {
  const allCandidates = (await getSuccessionCandidates()) as Row[];
  const rows = allCandidates.filter((r) => {
    const targetPos = r.target_position?.position || "";
    return LEADERSHIP_KEYWORDS.some((k) => targetPos.includes(k));
  });
  return (
    <MasterDataTable
      title="Leadership Pipeline"
      description="Kandidat suksesor yang mengarah ke posisi Manager ke atas."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada kandidat di Leadership Pipeline. Tambahkan lewat menu Kandidat Suksesor."
      columns={[
        { key: "name", label: "Karyawan", render: (r) => (r as Row).employee?.full_name || "-" },
        { key: "department", label: "Departemen", render: (r) => (r as Row).employee?.department || "-" },
        { key: "current", label: "Posisi Saat Ini", render: (r) => (r as Row).employee?.position || "-" },
        { key: "target", label: "Menggantikan", render: (r) => (r as Row).target_position?.full_name || "-" },
        { key: "target_position", label: "Posisi Target", render: (r) => (r as Row).target_position?.position || "-" },
        { key: "readiness_override", label: "Kesiapan", render: (r) => {
          const v = (r as Row).readiness_override;
          return v != null ? `${v}%` : "-";
        } },
      ]}
    />
  );
}
