import { supabaseAdmin } from "@/lib/supabase";
import { DollarSign, Plus, Building, Briefcase } from "lucide-react";

export default async function SalaryPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(50);

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  const salaryData = [
    { id: 1, employee: "Budi Santoso", department: "Operasional", position: "Supervisor Gudang", basicSalary: 7500000, transport: 1000000, meal: 800000, housing: 1200000, position_: 1500000, total: 12000000 },
    { id: 2, employee: "Siti Rahayu", department: "Keuangan", position: "Staff Accounting", basicSalary: 5500000, transport: 700000, meal: 600000, housing: 800000, position_: 500000, total: 8100000 },
    { id: 3, employee: "Ahmad Fauzi", department: "Operasional", position: "Driver", basicSalary: 4800000, transport: 1200000, meal: 700000, housing: 600000, position_: 0, total: 7300000 },
    { id: 4, employee: "Dian Permata", department: "SDM", position: "HR Officer", basicSalary: 6000000, transport: 800000, meal: 600000, housing: 900000, position_: 800000, total: 9100000 },
    { id: 5, employee: "Rudi Hartono", department: "Operasional", position: "Manager Operasional", basicSalary: 12000000, transport: 2000000, meal: 1500000, housing: 2500000, position_: 3000000, total: 21000000 },
    { id: 6, employee: "Dewi Lestari", department: "IT", position: "IT Support", basicSalary: 6500000, transport: 800000, meal: 600000, housing: 900000, position_: 1000000, total: 9800000 },
  ];

  const positionTemplates = [
    { position: "Manager", basicSalary: 12000000, allowances: [2000000, 1500000, 2500000, 3000000], total: 21000000 },
    { position: "Supervisor", basicSalary: 7500000, allowances: [1000000, 800000, 1200000, 1500000], total: 12000000 },
    { position: "Staff", basicSalary: 5500000, allowances: [700000, 600000, 800000, 500000], total: 8100000 },
    { position: "Driver/Operator", basicSalary: 4800000, allowances: [1200000, 700000, 600000, 0], total: 7300000 },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Komponen Gaji</h1>
          <p className="text-sm text-gray-500">Struktur dan komponen gaji seluruh karyawan.</p>
        </div>
        <button className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Edit Komponen Gaji
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <DollarSign size={16} className="text-[#CC0000]" />
              Daftar Gaji Karyawan
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Rincian komponen gaji per karyawan</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gaji Pokok</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transport</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Makan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perumahan</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jabatan</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {salaryData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 text-[11px]">{s.employee}</p>
                      <p className="text-[9px] text-slate-400">{s.position} - {s.department}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-700">Rp {s.basicSalary.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">Rp {s.transport.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">Rp {s.meal.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">Rp {s.housing.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-[11px] text-slate-600">Rp {s.position_.toLocaleString("id-ID")}</td>
                    <td className="px-4 py-3 text-[11px] font-bold text-slate-800 text-right">Rp {s.total.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building size={16} className="text-[#CC0000]" />
                Template Gaji per Jabatan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Struktur gaji standar berdasarkan posisi</p>
            </div>

            <div className="divide-y divide-slate-50">
              {positionTemplates.map((pt, idx) => (
                <div key={idx} className="p-5 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-800">{pt.position}</h4>
                    <span className="text-sm font-extrabold text-[#CC0000]">Rp {pt.total.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gaji Pokok</span>
                      <span className="font-semibold text-slate-700">Rp {pt.basicSalary.toLocaleString("id-ID")}</span>
                    </div>
                    {["Transport", "Makan", "Perumahan", "Jabatan"].map((label, i) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-slate-400">Tunjangan {label}</span>
                        <span className="text-slate-600">Rp {pt.allowances[i].toLocaleString("id-ID")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Edit Komponen Gaji</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ubah struktur gaji karyawan</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan</label>
                <select className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Karyawan</option>
                  {employees?.map((e: Record<string, unknown>) => (
                    <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gaji Pokok</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunjangan Transport</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunjangan Makan</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tunjangan Perumahan</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
                </div>
              </div>
              <button className="w-full px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
                Simpan Komponen Gaji
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
