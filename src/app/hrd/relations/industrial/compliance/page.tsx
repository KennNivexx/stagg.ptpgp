import { getIndustrialCompliance } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function IndustrialCompliancePage() {
  const rows = await getIndustrialCompliance();
  return (
    <MasterDataTable
      title="Industrial Compliance"
      description="Status kepatuhan terhadap regulasi ketenagakerjaan."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada data Industrial Compliance."
      columns={[
        { key: "regulation_name", label: "Regulasi" },
        { key: "compliance_status", label: "Status", render: (r) => (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${r.compliance_status === "Compliant" ? "bg-slate-800 text-white" : r.compliance_status === "Non-Compliant" ? "bg-red-50 text-pgp-red" : "bg-slate-100 text-slate-600"}`}>{String(r.compliance_status)}</span>
        ) },
        { key: "due_date", label: "Jatuh Tempo" },
      ]}
    />
  );
}
