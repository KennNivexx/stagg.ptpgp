"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Pencil, UserPlus } from "lucide-react";
import { createAdminUser } from "@/app/actions/admin";

type Employee = Record<string, unknown>;

interface Props {
  employees: Employee[];
  roles: string[];
}

export default function UsersClient({ employees, roles }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function handleCreateUser() {
    if (!formRef.current) return;
    setLoading(true); setMsg(null);
    const result = await createAdminUser(new FormData(formRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" }); return; }
    setMsg({ type: "success", text: "User berhasil dibuat!" });
    formRef.current.reset();
    setShowForm(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="w-0" />
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <UserPlus size={14} /> {showForm ? "Tutup Form" : "Tambah User"}
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-medium ${msg.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar User</h3>
            <p className="text-xs text-slate-400 mt-0.5">Semua akun pengguna sistem</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {["Nama", "Email", "Role", "Status", "Aksi"].map((h) => (
                    <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${h === "Aksi" ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(employees || []).map((emp) => (
                  <tr key={emp.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <p className="text-xs font-bold text-slate-800">{emp.full_name as string}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">{(emp.email as string) || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">Karyawan</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${emp.status === "Resigned" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {emp.status === "Resigned" ? "Nonaktif" : "Aktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => alert(`Edit Role untuk: ${emp.full_name as string}\n(Fitur manajemen role akan menampilkan dialog konfirmasi)`)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Edit Role">
                          <Shield size={14} />
                        </button>
                        <button onClick={() => alert(`Edit profil: ${emp.full_name as string}\nGunakan menu Karyawan > Detail untuk mengedit lengkap.`)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors" title="Edit">
                          <Pencil size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Tambah User Baru</h3>
            </div>
            <form ref={formRef} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Lengkap</label>
                <input name="name" type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Masukkan nama..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email</label>
                <input name="email" type="email" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="email@perusahaan.com" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Role</label>
                <select name="role" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                  {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Password</label>
                <input name="password" type="password" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Minimal 8 karakter" />
              </div>
              <button type="button" onClick={handleCreateUser} disabled={loading}
                className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors disabled:opacity-60">
                {loading ? "Menyimpan..." : "Buat User"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
