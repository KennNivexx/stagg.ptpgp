import { supabaseAdmin } from "@/lib/supabase";
import { Shield, Lock, Eye, Edit, Trash2, Plus } from "lucide-react";

export default async function RolePermission() {
  const roles = [
    { name: "Superadmin", color: "bg-red-50 text-red-700", desc: "Akses penuh ke semua modul dan pengaturan sistem" },
    { name: "HRD", color: "bg-blue-50 text-blue-700", desc: "Akses penuh modul HRD, rekrutmen, dan karyawan" },
    { name: "Manager", color: "bg-amber-50 text-amber-700", desc: "Akses tim sendiri, approval, dan laporan tim" },
    { name: "Karyawan", color: "bg-emerald-50 text-emerald-700", desc: "Akses profil pribadi, absensi, dan pengajuan" },
  ];

  const modules = [
    "Dashboard",
    "Karyawan",
    "Rekrutmen",
    "Absensi",
    "Cuti",
    "Payroll",
    "KPI & Feedback",
    "Pelatihan",
    "Suksesi",
    "Hubungan Industrial",
    "Manajemen Perubahan",
    "Laporan",
    "Pengaturan",
    "Audit Log",
  ];

  const permissionMatrix = [
    // Superadmin: all access
    modules.map(() => true),
    // HRD: all access
    modules.map(() => true),
    // Manager: limited access
    [true, true, false, true, true, false, true, false, false, false, false, false, false, false],
    // Karyawan: minimal access
    [true, false, false, true, true, false, false, false, false, false, false, false, false, false],
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Role & Permission</h1>
        <p className="text-sm text-gray-500">Atur peran pengguna dan hak akses ke setiap modul sistem.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <div key={role.name} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${role.color} rounded-xl`}><Shield size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Role</p>
                <p className="text-sm font-extrabold text-slate-800">{role.name}</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-3">{role.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Matriks Permission</h3>
            <p className="text-xs text-slate-400 mt-0.5">Hak akses setiap role ke modul sistem</p>
          </div>
          <button className="px-3 py-1.5 text-xs font-bold text-[#CC0000] border border-[#CC0000] rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1">
            <Plus size={12} /> Tambah Role
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Modul</th>
                {roles.map((role) => (
                  <th key={role.name} className="text-center px-4 py-4 text-xs font-bold text-slate-500 uppercase">{role.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modules.map((mod, modIdx) => (
                <tr key={mod} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-3.5 text-xs font-bold text-slate-800">{mod}</td>
                  {roles.map((_, roleIdx) => {
                    const hasAccess = permissionMatrix[roleIdx][modIdx];
                    return (
                      <td key={roleIdx} className="text-center px-4 py-3.5">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded ${hasAccess ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-400"}`}>
                          {hasAccess ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Edit Permission Role</h3>
          <p className="text-xs text-slate-400 mt-0.5">Ubah hak akses modul untuk role tertentu</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="max-w-md">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Role</label>
            <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
              {roles.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {modules.map((mod) => (
              <label key={mod} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                <input type="checkbox" className="accent-[#CC0000] w-3.5 h-3.5" defaultChecked />
                <span className="text-xs text-slate-700">{mod}</span>
              </label>
            ))}
          </div>
          <button className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
            Simpan Permission
          </button>
        </div>
      </div>
    </div>
  );
}
