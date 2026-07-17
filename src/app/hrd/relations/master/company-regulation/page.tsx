import { getCompanyRegulations } from "@/app/actions/employee-relations";
import MasterDataTable from "@/components/hrd/MasterDataTable";

export default async function CompanyRegulationPage() {
  const rows = await getCompanyRegulations();
  return (
    <MasterDataTable
      title="Company Regulation (PP)"
      description="Peraturan Perusahaan — hak, kewajiban, tata tertib, dan sanksi sesuai ketentuan ketenagakerjaan."
      backHref="/hrd/relations"
      rows={rows as Record<string, unknown>[]}
      emptyLabel="Belum ada Company Regulation."
      columns={[
        { key: "code", label: "Kode" },
        { key: "title", label: "Judul" },
        { key: "effective_date", label: "Berlaku Sejak" },
        { key: "valid_until", label: "Berlaku Hingga" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
