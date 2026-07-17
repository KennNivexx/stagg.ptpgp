import { getTalentReviews } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  karyawan?: { full_name?: string; department?: string; position?: string } | null;
  talent_classifications?: { name?: string; color_code?: string } | null;
};

export default async function TalentReviewPage() {
  const rows = (await getTalentReviews()) as Row[];
  return (
    <MasterDataTable
      title="Talent Review"
      description="Penilaian gabungan kinerja dan potensi, ditarik otomatis dari modul lain."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada Talent Review."
      columns={[
        { key: "period", label: "Periode" },
        { key: "name", label: "Karyawan", render: (r) => (r as Row).karyawan?.full_name || "-" },
        { key: "department", label: "Departemen", render: (r) => (r as Row).karyawan?.department || "-" },
        { key: "performance_score", label: "Skor Kinerja" },
        { key: "potential_score", label: "Skor Potensi" },
        { key: "classification", label: "Klasifikasi", render: (r) => {
          const c = (r as Row).talent_classifications;
          return c ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color_code || "#94a3b8" }} />
              {c.name}
            </span>
          ) : "-";
        } },
      ]}
    />
  );
}
