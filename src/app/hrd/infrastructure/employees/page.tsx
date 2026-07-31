import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { Users, Search } from "lucide-react";
import Link from "next/link";
import EmployeeFilter from "./EmployeeFilter";
import EmployeeTable from "./EmployeeTable";
import EmptyState from "@/components/EmptyState";

export default async function DataIndukKaryawan({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string; status?: string; q?: string }>;
}) {
  await requireRole("hrd", "superadmin");
  const params = await searchParams;
  const deptFilter = params.dept || "";
  const statusFilter = params.status || "";
  const query = params.q || "";

  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, email, nik, kode, kode_jabatan, department, position, status, join_date, phone, address, agama, last_education, marital_status, spouse_name, children_count, emergency_name, emergency_phone, ktp_address, npwp, bpjs_tk, bpjs_kes")
    .neq("status", "Inactive")
    .order("full_name", { ascending: true });

  const { data: departments } = await supabaseAdmin
    .from("departemen")
    .select("name")
    .order("name", { ascending: true });

  const deptList = departments?.map((d: { name: string }) => d.name) || [];
  const statusList = ["Tetap", "Kontrak", "Magang"];

  let filtered = employees || [];
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter((e: Record<string, unknown>) =>
      ((e.full_name as string) || "").toLowerCase().includes(q) ||
      ((e.nik as string) || "").toLowerCase().includes(q) ||
      ((e.kode_jabatan as string) || "").toLowerCase().includes(q) ||
      ((e.department as string) || "").toLowerCase().includes(q) ||
      ((e.position as string) || "").toLowerCase().includes(q)
    );
  }
  if (deptFilter) {
    filtered = filtered.filter((e: Record<string, unknown>) => e.department === deptFilter);
  }
  if (statusFilter) {
    filtered = filtered.filter((e: Record<string, unknown>) => e.status === statusFilter);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Data Induk Karyawan</h1>
          <p className="text-sm text-gray-500 mt-1">Lihat data master seluruh karyawan perusahaan.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/hrd/employees/new"
            className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2"
          >
            + Tambah Karyawan
          </Link>
        </div>
      </div>

      <EmployeeFilter
        deptFilter={deptFilter}
        statusFilter={statusFilter}
        query={query}
        deptList={deptList}
        statusList={statusList}
        activeCounts={{
          tetap: (employees || []).filter((e: Record<string, unknown>) => e.status === "Tetap").length,
          kontrak: (employees || []).filter((e: Record<string, unknown>) => e.status === "Kontrak").length,
          magang: (employees || []).filter((e: Record<string, unknown>) => e.status === "Magang").length,
        }}
      />

      {!employees || employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada data karyawan"
          description="Tambahkan karyawan pertama untuk memulai pengelolaan data HR."
          action={{ label: "+ Tambah Karyawan", href: "/hrd/employees/new" }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Tidak ada hasil"
          description="Tidak ada karyawan yang sesuai dengan filter yang dipilih."
          action={{ label: "Hapus semua filter", href: "?" }}
        />
      ) : (
        <EmployeeTable employees={filtered} />
      )}
    </div>
  );
}
