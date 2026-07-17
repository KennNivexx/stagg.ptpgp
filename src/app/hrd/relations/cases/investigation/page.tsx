import { getCasesInStage } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  subject?: { full_name?: string; department?: string } | null;
  case_categories?: { name?: string; severity?: string } | null;
};

export default async function InvestigationPage() {
  const rows = (await getCasesInStage("Investigation")) as Row[];
  return (
    <MasterDataTable
      title="Investigation"
      description="Kasus yang sedang dalam tahap investigasi."
      backHref="/hrd/relations"
      rows={rows}
      emptyLabel="Tidak ada kasus dalam tahap investigasi."
      columns={[
        { key: "case_type", label: "Jenis" },
        { key: "title", label: "Judul" },
        { key: "subject", label: "Terkait", render: (r) => (r as Row).subject?.full_name || "-" },
        { key: "severity", label: "Keparahan", render: (r) => (r as Row).case_categories?.severity || "-" },
        { key: "sla_due_date", label: "SLA" },
      ]}
    />
  );
}
