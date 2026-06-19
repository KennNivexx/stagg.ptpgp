"use client";

import { useState } from "react";
import { X, IdCard, Heart, Users2, MapPin, GraduationCap, Siren } from "lucide-react";

type Emp = Record<string, unknown>;

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

const religionOptions: Record<string, string> = {
  "Islam": "Islam",
  "Kristen Protestan": "Kristen Protestan",
  "Kristen Katolik": "Kristen Katolik",
  "Hindu": "Hindu",
  "Buddha": "Buddha",
  "Konghucu": "Konghucu",
};

const educationOptions: Record<string, string> = {
  "SD": "SD", "SMP": "SMP", "SMA/SMK": "SMA/SMK",
  "D1": "D1", "D2": "D2", "D3": "D3", "D4": "D4",
  "S1": "S1", "S2": "S2", "S3": "S3",
};

const maritalOptions: Record<string, string> = {
  "Belum Menikah": "Belum Menikah",
  "Menikah": "Menikah",
  "Cerai Hidup": "Cerai Hidup",
  "Cerai Mati": "Cerai Mati",
};

export default function EmployeeTable({ employees }: { employees: Emp[] }) {
  const [selected, setSelected] = useState<Emp | null>(null);

  return (
    <>
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
              {employees.map((emp) => (
                <tr key={emp.id as string} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold text-slate-600">
                      NIK-{String(emp.id).substring(0, 8).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelected(emp)}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left group"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <p className="font-bold text-slate-800 group-hover:text-[#CC0000] transition-colors">
                        {emp.full_name as string}
                      </p>
                    </button>
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
            Total: <span className="font-bold text-slate-800">{employees.length}</span> karyawan
          </p>
          <p className="text-xs text-slate-400">Klik nama untuk detail</p>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {(selected.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{selected.full_name as string}</h3>
                  <p className="text-xs text-slate-500">{selected.position as string || "-"}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailRow icon={IdCard} label="NIK" value={(selected.nik as string) || "-"} />
                <DetailRow icon={Heart} label="Agama" value={religionOptions[selected.religion as string] || (selected.religion as string) || "-"} />
                <DetailRow icon={Users2} label="Status Pernikahan" value={maritalOptions[selected.marital_status as string] || (selected.marital_status as string) || "-"} />
                <DetailRow icon={Users2} label="Nama Pasangan" value={(selected.spouse_name as string) || "-"} />
                <DetailRow icon={Users2} label="Jumlah Anak" value={selected.children_count != null ? String(selected.children_count) : "-"} />
                <DetailRow icon={GraduationCap} label="Pendidikan Terakhir" value={educationOptions[selected.last_education as string] || (selected.last_education as string) || "-"} />
                <DetailRow icon={Siren} label="Kontak Darurat Nama" value={(selected.emergency_name as string) || "-"} />
                <DetailRow icon={Siren} label="Kontak Darurat Telepon" value={(selected.emergency_phone as string) || "-"} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat KTP</label>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-3 leading-relaxed">{(selected.ktp_address as string) || "-"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg shrink-0">
        <Icon size={14} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
