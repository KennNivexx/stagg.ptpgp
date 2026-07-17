import { getParticipationEntries } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & { karyawan?: { full_name?: string; department?: string } | null };

export default async function SatisfactionDashboardPage() {
  const rows = (await getParticipationEntries("Satisfaction Survey")) as Row[];
  const scores = rows.map((r) => r.score as number).filter((s) => s != null);
  const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-xl font-extrabold text-slate-900">Employee Satisfaction Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Skor kepuasan karyawan rata-rata: <span className="font-extrabold text-slate-800">{avg}</span> dari {scores.length} respons.</p>
      </div>
      <MasterDataTable
        bare title="" description="" backHref="/hrd/relations" rows={rows}
        emptyLabel="Belum ada Satisfaction Survey."
        columns={[
          { key: "karyawan", label: "Karyawan", render: (r) => (r as Row).karyawan?.full_name || "Anonim" },
          { key: "title", label: "Judul" },
          { key: "score", label: "Skor" },
        ]}
      />
    </div>
  );
}
