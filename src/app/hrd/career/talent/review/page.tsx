// Was reading career-development.ts's getTalentReviews() (table
// talent_reviews) — nothing in the app ever writes to it. The real
// equivalent assessment HRD actually fills in is "Penilaian Kesiapan" at
// /hrd/succession/readiness (succession.ts's saveReadinessAssessment/
// getReadinessAssessments, table penilaian_kesiapan_suksesi), so this page
// never showed real data. Same live data, this view's own layout kept.
import { getReadinessAssessments } from "@/app/actions/succession";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  karyawan?: { full_name?: string; department?: string; position?: string } | null;
  year?: number;
  total_score?: number;
};

export default async function TalentReviewPage() {
  const rows = (await getReadinessAssessments()) as Row[];
  return (
    <MasterDataTable
      title="Talent Review"
      description="Penilaian kesiapan suksesi — kepemimpinan, keahlian teknis, pengalaman, kinerja, dan potensi."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada Talent Review. Tambahkan lewat menu Penilaian Kesiapan."
      columns={[
        { key: "year", label: "Tahun" },
        { key: "name", label: "Karyawan", render: (r) => (r as Row).karyawan?.full_name || "-" },
        { key: "department", label: "Departemen", render: (r) => (r as Row).karyawan?.department || "-" },
        { key: "total_score", label: "Skor Kesiapan", render: (r) => {
          const score = Number((r as Row).total_score) || 0;
          return (
            <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${score >= 80 ? "bg-emerald-50 text-emerald-700" : score >= 60 ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
              {score}
            </span>
          );
        } },
      ]}
    />
  );
}
