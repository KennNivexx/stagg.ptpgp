import { supabaseAdmin } from "@/lib/supabase";
import { Users, Download, Search } from "lucide-react";
import Link from "next/link";
import EmployeeFilter from "./EmployeeFilter";

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

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-1 rounded-lg text-xs font-bold";
    if (status === "Tetap") return `${base} bg-emerald-50 text-emerald-700`;
    if (status === "Kontrak") return `${base} bg-amber-50 text-amber-700`;
    if (status === "Magang") return `${base} bg-purple-50 text-purple-700`;
    return `${base} bg-slate-100 text-slate-600`;
  };

  const getDeptBadge = (dept: string) => {
    const base = "px-2.5 py-1 rounded-lg text-xs font-semibold";
    const colors = [
      "bg-blue-50 text-blue-700",
      "bg-emerald-50 text-emerald-700",
      "bg-amber-50 text-amber-700",
      "bg-purple-50 text-purple-700",
      "bg-rose-50 text-rose-700",
      "bg-cyan-50 text-cyan-700",
    ];
    const idx = dept.charCodeAt(0) % colors.length;
    return `${base} ${colors[idx]}`;
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Data Induk Karyawan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data master seluruh karyawan perusahaan.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
            <Download size={14} />
            Ekspor
          </button>
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIK</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jabatan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Masuk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((emp: Record<string, unknown>) => (
                  <tr key={emp.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-slate-600">
                        NIK-{String(emp.id).substring(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <p className="font-bold text-slate-800">{emp.full_name as string}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{emp.email as string || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={getDeptBadge(emp.department as string || "")}>
                        {emp.department as string || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700 font-medium">{emp.position as string || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(emp.status as string)}>
                        {emp.status as string || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {emp.join_date ? new Date(emp.join_date as string).toLocaleDateString("id-ID") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Total: <span className="font-bold text-slate-800">{filtered.length}</span> karyawan
              {(deptFilter || statusFilter) && <span className="text-slate-400"> (difilter)</span>}
            </p>
            <p className="text-xs text-slate-400">Dari {employees.length} data</p>
          </div>
        </div>
      )}
    </div>
  );
}
