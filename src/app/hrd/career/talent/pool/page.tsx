// Was reading career-development.ts's getTalentPool(), which pulls from
// talent_pools — a table nothing in the app ever writes to. The real data
// entry point is "Pool Suksesi" at /hrd/succession/talentpool
// (succession.ts's addToTalentPool/getTalentPoolEntries, table
// pool_suksesi), so this page never reflected anything HRD actually
// entered. Same live data, this view's own layout kept.
import { getTalentPoolEntries } from "@/app/actions/succession";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  employee?: { full_name?: string; department?: string; position?: string } | null;
  potential_rating?: string | null;
  created_at?: string | null;
};

export default async function TalentPoolPage() {
  const rows = (await getTalentPoolEntries()) as Row[];
  return (
    <MasterDataTable
      title="Talent Pool"
      description="Karyawan yang dipersiapkan sebagai kandidat pengembangan karier."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada karyawan di Talent Pool. Tambahkan lewat menu Pool Suksesi."
      columns={[
        { key: "name", label: "Karyawan", render: (r) => (r as Row).employee?.full_name || "-" },
        { key: "department", label: "Departemen", render: (r) => (r as Row).employee?.department || "-" },
        { key: "current", label: "Posisi Saat Ini", render: (r) => (r as Row).employee?.position || "-" },
        { key: "potential_rating", label: "Rating Potensi" },
        { key: "created_at", label: "Sejak" },
      ]}
    />
  );
}
