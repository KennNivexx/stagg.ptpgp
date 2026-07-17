import { getCasesInStage } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  subject?: { full_name?: string; department?: string } | null;
  case_categories?: { name?: string; severity?: string } | null;
};

export default async function CorrectiveActionPage() {
  const rows = (await getCasesInStage("Corrective Action")) as Row[];
  return (
    <MasterDataTable
      title="Corrective Action"
      description="Kasus yang memerlukan tindakan perbaikan/disipliner."
      backHref="/hrd/relations"
      rows={rows}
      emptyLabel="Tidak ada kasus dalam tahap Corrective Action."
      columns={[
        { key: "case_type", label: "Jenis" },
        { key: "title", label: "Judul" },
        { key: "subject", label: "Terkait", render: (r) => (r as Row).subject?.full_name || "-" },
        { key: "severity", label: "Keparahan", render: (r) => (r as Row).case_categories?.severity || "-" },
      ]}
    />
  );
}
