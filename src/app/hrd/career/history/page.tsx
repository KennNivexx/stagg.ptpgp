import { getCareerHistory } from "@/app/actions/career-development";
import MasterDataTable from "@/components/hrd/MasterDataTable";

type Row = Record<string, unknown> & {
  type: "Promosi" | "Mutasi";
  karyawan?: { full_name?: string; department?: string } | null;
  from_position?: string; to_position?: string;
  from_department?: string; to_department?: string;
  status: string; created_at: string;
};

export default async function CareerHistoryPage() {
  const rows = (await getCareerHistory()) as Row[];
  return (
    <MasterDataTable
      title="Career History"
      description="Riwayat kronologis seluruh promosi dan mutasi karyawan."
      backHref="/hrd/career"
      rows={rows}
      emptyLabel="Belum ada riwayat karier."
      columns={[
        { key: "created_at", label: "Tanggal", render: (r) => new Date((r as Row).created_at).toLocaleDateString("id-ID") },
        { key: "type", label: "Jenis" },
        { key: "name", label: "Karyawan", render: (r) => (r as Row).karyawan?.full_name || "-" },
        { key: "change", label: "Perubahan", render: (r) => {
          const row = r as Row;
          return row.type === "Promosi"
            ? `${row.from_position || "-"} → ${row.to_position || "-"}`
            : `${row.from_department || "-"} → ${row.to_department || "-"}`;
        } },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
