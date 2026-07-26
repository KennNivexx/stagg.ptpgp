"use client";

import { useState } from "react";
import Link from "next/link";
import { FileSpreadsheet, Eye, UserCircle2 } from "lucide-react";

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

// Mirrors the hasRealAddress/profile-completeness pattern in src/app/hrd/page.tsx:
// checks whether the employee has filled in their own KTP/KK data via
// /employee/profile. HRD cannot edit these fields here, only observe them.
const isPersonalDataComplete = (e: Emp) =>
  !!e.nik && !!e.emergency_phone && !!e.marital_status && !!e.ktp_address;

const fmtDate = (v: unknown) => v ? new Date(v as string).toLocaleDateString("id-ID") : "-";

export default function EmployeeTable({ employees }: { employees: Emp[] }) {
  const [exporting, setExporting] = useState(false);

  const rowData = (emp: Emp) => ({
    "NIK": (emp.nik as string) || "-",
    "Nama": (emp.full_name as string) || "-",
    "Email": (emp.email as string) || "-",
    "Departemen": (emp.department as string) || "-",
    "Jabatan": (emp.position as string) || "-",
    "Status": (emp.status as string) || "-",
    "Tgl Masuk": fmtDate(emp.join_date),
    "Agama": religionOptions[emp.religion as string] || (emp.religion as string) || "-",
    "Status Pernikahan": maritalOptions[emp.marital_status as string] || (emp.marital_status as string) || "-",
    "Nama Pasangan": (emp.spouse_name as string) || "-",
    "Jumlah Anak": emp.children_count != null ? String(emp.children_count) : "-",
    "Pendidikan Terakhir": educationOptions[emp.last_education as string] || (emp.last_education as string) || "-",
    "Kontak Darurat Nama": (emp.emergency_name as string) || "-",
    "Kontak Darurat Telepon": (emp.emergency_phone as string) || "-",
    "Alamat KTP": (emp.ktp_address as string) || "-",
  });

  const handleExportExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const rows = employees.map(rowData);
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = Object.keys(rows[0] || {}).map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Karyawan");
      const stamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `Data-Karyawan-${stamp}.xlsx`);
    } catch (e) {
      console.error("[employees] export excel error:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-semibold">
          <Eye size={13} className="shrink-0" />
          Data pribadi &amp; keluarga bersifat lihat-saja &mdash; diisi mandiri oleh karyawan lewat akunnya.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={14} /> {exporting ? "Mengekspor..." : "Export Excel"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">NIK</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Kode Jabatan</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Nama</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Email</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Departemen</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Jabatan</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Tgl Masuk</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Data Pribadi</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Agama</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status Pernikahan</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Nama Pasangan</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Jumlah Anak</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Pendidikan Terakhir</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Kontak Darurat Nama</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Kontak Darurat Telepon</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Alamat KTP</th>
              <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">360°</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.map((emp) => (
              <tr key={emp.id as string} className="hover:bg-slate-50/30 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-xs font-mono font-bold text-slate-600">{(emp.nik as string) || "-"}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-xs font-mono font-bold text-slate-500">{(emp.kode_jabatan as string) || (emp.kode as string) || "-"}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {(emp.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <p className="font-bold text-slate-800">{emp.full_name as string}</p>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{emp.email as string || "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={getDeptBadge(emp.department as string || "")}>
                    {emp.department as string || "-"}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-slate-700 font-medium whitespace-nowrap">{emp.position as string || "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(emp.status as string)}>
                    {emp.status as string || "-"}
                  </span>
                </td>
                <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">{fmtDate(emp.join_date)}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {isPersonalDataComplete(emp) ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700">Lengkap</span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700">Belum Lengkap</span>
                  )}
                </td>
                <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{religionOptions[emp.religion as string] || (emp.religion as string) || "-"}</td>
                <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{maritalOptions[emp.marital_status as string] || (emp.marital_status as string) || "-"}</td>
                <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{(emp.spouse_name as string) || "-"}</td>
                <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{emp.children_count != null ? String(emp.children_count) : "-"}</td>
                <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{educationOptions[emp.last_education as string] || (emp.last_education as string) || "-"}</td>
                <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{(emp.emergency_name as string) || "-"}</td>
                <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{(emp.emergency_phone as string) || "-"}</td>
                <td className="px-4 py-4 text-xs text-slate-600 max-w-[240px] truncate" title={(emp.ktp_address as string) || "-"}>{(emp.ktp_address as string) || "-"}</td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Link href={`/hrd/infrastructure/employees/${emp.id}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition-colors w-fit">
                    <UserCircle2 size={13} /> Profil
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
        <p className="text-xs text-slate-500">
          Total: <span className="font-bold text-slate-800">{employees.length}</span> karyawan
        </p>
      </div>
    </div>
  );
}
