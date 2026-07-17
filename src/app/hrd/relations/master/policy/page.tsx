import { getErPolicies } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function ERPolicyPage() {
  const rows = await getErPolicies();
  return (
    <MasterDataTable
      title="Employee Relation Policy"
      description="Kebijakan hubungan karyawan — SLA penyelesaian kasus, standar investigasi, dan prosedur mediasi."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Employee Relation Policy."
      columns={[
        { key: "code", label: "Kode" },
        { key: "title", label: "Judul" },
        { key: "status", label: "Status" },
        { key: "effective_date", label: "Berlaku Sejak" },
      ]}
    />
  );
}
