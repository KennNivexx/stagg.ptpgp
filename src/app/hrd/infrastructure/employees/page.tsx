import { supabaseAdmin } from "@/lib/supabase";
import { Users, Download, Search } from "lucide-react";
import Link from "next/link";
import EmployeeFilter from "./EmployeeFilter";
import EmployeeTable from "./EmployeeTable";

export default async function DataIndukKaryawan({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string; status?: string }>;
}) {
  const params = await searchParams;
  const deptFilter = params.dept || "";
  const statusFilter = params.status || "";

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("*")
    .order("full_name", { ascending: true });

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name", { ascending: true });

  const deptList = departments?.map((d: { name: string }) => d.name) || [];
  const statusList = ["Tetap", "Kontrak", "Magang"];

  let filtered = employees || [];
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
          <p className="text-sm text-gray-500 mt-1">Kelola data master seluruh karyawan perusahaan.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-400 bg-slate-50 cursor-not-allowed inline-flex items-center gap-2" title="Segera tersedia">
            <Download size={14} />
            Ekspor
          </span>
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
        deptList={deptList}
        statusList={statusList}
        activeCounts={{
          tetap: (employees || []).filter((e: Record<string, unknown>) => e.status === "Tetap").length,
          kontrak: (employees || []).filter((e: Record<string, unknown>) => e.status === "Kontrak").length,
          magang: (employees || []).filter((e: Record<string, unknown>) => e.status === "Magang").length,
        }}
      />

      {!employees || employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Users size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Belum ada data karyawan</h3>
          <p className="text-sm text-slate-500 mb-6">Tambahkan karyawan pertama untuk memulai pengelolaan data HR.</p>
          <Link href="/hrd/employees/new" className="bg-[#CC0000] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
            + Tambah Karyawan
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Search size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Tidak ada hasil</h3>
          <p className="text-sm text-slate-500 mb-6">Tidak ada karyawan yang sesuai dengan filter yang dipilih.</p>
          <a href="?" className="text-sm font-bold text-[#CC0000] hover:underline">Hapus semua filter</a>
        </div>
      ) : (
        <EmployeeTable employees={filtered} />
      )}
    </div>
  );
}
