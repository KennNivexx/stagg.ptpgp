"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Pencil, Trash2, Mail, Phone, Filter, UserPlus, Building2, FileText, ArrowRightLeft } from "lucide-react";
import { getEmployees, deleteEmployee } from "@/app/actions/hrd";

type Employee = Record<string, unknown>;

export default function HRDEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchEmployees = () => {
    setLoading(true);
    setError("");
    getEmployees(statusFilter || undefined)
      .then((data) => {
        setEmployees(data as Employee[]);
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal memuat data karyawan.");
        setLoading(false);
      });
  };

  useEffect(() => {
    let cancelled = false;
    getEmployees(statusFilter || undefined)
      .then((data) => {
        if (!cancelled) {
          setEmployees(data as Employee[]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Gagal memuat data karyawan.");
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [statusFilter]);

  const handleDelete = async (empId: string, empName: string) => {
    if (!window.confirm(`Yakin ingin menghapus "${empName}"? Data tidak dapat dikembalikan.`)) return;
    try {
      const res = await deleteEmployee(empId);
      if (res.error) {
        setError(res.error);
      } else {
        setError("");
        fetchEmployees();
      }
    } catch {
      setError("Gagal menghapus karyawan.");
    }
  };

  const getStatusBadge = (status: string) => {
    const base = "px-2.5 py-1 rounded-lg text-xs font-bold";
    if (status === "Tetap") return `${base} bg-emerald-50 text-emerald-700`;
    if (status === "Kontrak") return `${base} bg-amber-50 text-amber-700`;
    if (status === "Magang") return `${base} bg-purple-50 text-purple-700`;
    return `${base} bg-slate-100 text-slate-600`;
  };

  const quickActions = [
    { icon: UserPlus, label: "Tambah Karyawan", href: "/hrd/employees/new", color: "bg-blue-50 text-blue-600" },
    { icon: Building2, label: "Struktur Organisasi", href: "/hrd/workplace/structure", color: "bg-emerald-50 text-emerald-600" },
    { icon: FileText, label: "Kontrak Kerja", href: "/hrd/infrastructure/contracts", color: "bg-amber-50 text-amber-600" },
    { icon: ArrowRightLeft, label: "Mutasi & Promosi", href: "/hrd/career/promotions", color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Data Karyawan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola informasi dan data seluruh karyawan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:border-slate-200 transition-all group"
          >
            <div className={`p-2.5 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
              <action.icon size={20} />
            </div>
            <span className="text-sm font-bold text-slate-700">{action.label}</span>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          >
            <option value="">Semua Status</option>
            <option value="Tetap">Tetap</option>
            <option value="Kontrak">Kontrak</option>
            <option value="Magang">Magang</option>
          </select>
          {statusFilter && (
            <button onClick={() => setStatusFilter("")} className="text-xs text-[#CC0000] hover:underline">
              Hapus filter
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
            Tetap: {employees.filter((e) => e.status === "Tetap").length}
          </div>
          <div className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
            Kontrak: {employees.filter((e) => e.status === "Kontrak").length}
          </div>
          <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">
            Magang: {employees.filter((e) => e.status === "Magang").length}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 border border-red-100 rounded-sm text-sm font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
            <p className="text-sm text-gray-500">Memuat data karyawan...</p>
          </div>
        </div>
      ) : !employees || employees.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <div className="text-5xl mb-4 opacity-30">👥</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            {statusFilter ? "Tidak ada karyawan dengan filter ini" : "Belum ada data karyawan"}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {statusFilter ? "Ubah filter status atau tambahkan karyawan baru." : "Klik Tambah Karyawan untuk menambahkan data pertama"}
          </p>
          <Link href="/hrd/employees/new" className="bg-[#CC0000] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
            + Tambah Karyawan
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kontak</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Departemen</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jabatan</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Gabung</th>
                  <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.map((emp) => (
                  <tr key={emp.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{emp.full_name as string}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-600 flex items-center gap-1"><Mail size={11} /> {emp.email as string}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Phone size={11} /> {emp.phone as string || "-"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
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
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/hrd/employees/${emp.id}/edit`}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(emp.id as string, emp.full_name as string)}
                          className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-xs text-slate-500">Total: <span className="font-bold text-slate-800">{employees.length}</span> karyawan</p>
            {statusFilter && (
              <p className="text-xs text-slate-400">Difilter: {statusFilter}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
