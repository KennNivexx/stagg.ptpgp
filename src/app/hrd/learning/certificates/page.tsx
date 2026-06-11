"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Award, Download, Search, Users, CheckCircle, Clock, FileText } from "lucide-react";

type Certificate = {
  id: string;
  employeeName: string;
  department: string;
  program: string;
  completionDate: string;
  status: string;
  certificateNumber: string;
};

const INITIAL_CERTIFICATES: Certificate[] = [
  { id: "1", employeeName: "", department: "", program: "Pelatihan Kepemimpinan Dasar", completionDate: "2026-06-20", status: "Diterbitkan", certificateNumber: "CERT-2026-001" },
  { id: "2", employeeName: "", department: "", program: "Workshop Keselamatan Kerja", completionDate: "2026-05-30", status: "Diterbitkan", certificateNumber: "CERT-2026-002" },
  { id: "3", employeeName: "", department: "", program: "Microsoft Excel Advanced", completionDate: "2026-05-15", status: "Diterbitkan", certificateNumber: "CERT-2026-003" },
  { id: "4", employeeName: "", department: "", program: "Service Excellence", completionDate: "2026-06-25", status: "Diterbitkan", certificateNumber: "CERT-2026-004" },
  { id: "5", employeeName: "", department: "", program: "Pelatihan ISO 9001", completionDate: "2026-04-10", status: "Diterbitkan", certificateNumber: "CERT-2026-005" },
  { id: "6", employeeName: "", department: "", program: "Effective Communication", completionDate: "2026-03-28", status: "Diterbitkan", certificateNumber: "CERT-2026-006" },
  { id: "7", employeeName: "", department: "", program: "Pelatihan Kepemimpinan Dasar - Batch 1", completionDate: "2026-06-10", status: "Menunggu", certificateNumber: "CERT-2026-007" },
  { id: "8", employeeName: "", department: "", program: "Workshop Keselamatan Kerja - Batch 2", completionDate: "2026-06-15", status: "Menunggu", certificateNumber: "CERT-2026-008" },
];

export default function Sertifikat() {
  const [certificates, setCertificates] = useState<Certificate[]>(INITIAL_CERTIFICATES);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; department: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    supabase
      .from("employees")
      .select("id, full_name, department")
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        const emps = ((data || []) as { id: string; full_name: string; department: string }[]);
        setEmployees(emps);
        setCertificates((prev) => prev.map((cert, i) => ({
          ...cert,
          employeeName: emps[i % emps.length]?.full_name || `Karyawan ${i + 1}`,
          department: emps[i % emps.length]?.department || "HRD",
        })));
      });
  }, []);

  const filtered = certificates.filter((c) => {
    if (searchQuery && !c.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) && !c.program.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (s: string) => {
    if (s === "Diterbitkan") return "bg-emerald-50 text-emerald-700";
    if (s === "Menunggu") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-500";
  };

  const issuedCount = certificates.filter((c) => c.status === "Diterbitkan").length;
  const pendingCount = certificates.filter((c) => c.status === "Menunggu").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Sertifikat</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola sertifikat pelatihan yang diterbitkan untuk karyawan.</p>
        </div>
        <button className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
          <Award size={14} /> Terbitkan Sertifikat
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Sertifikat</p>
              <p className="text-xl font-extrabold text-slate-800">{certificates.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Diterbitkan</p>
              <p className="text-xl font-extrabold text-emerald-700">{issuedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Clock size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu</p>
              <p className="text-xl font-extrabold text-amber-700">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari sertifikat..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs w-56 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
          />
        </div>
        <button onClick={() => setFilterStatus("")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${!filterStatus ? "bg-[#1A2530] text-white" : "bg-slate-100 text-slate-600"}`}>
          Semua
        </button>
        <button onClick={() => setFilterStatus("Diterbitkan")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterStatus === "Diterbitkan" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600"}`}>
          Diterbitkan
        </button>
        <button onClick={() => setFilterStatus("Menunggu")} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterStatus === "Menunggu" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-slate-100 text-slate-600"}`}>
          Menunggu
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Award size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Tidak ada sertifikat ditemukan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">No. Sertifikat</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Karyawan</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Program</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tgl Selesai</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-slate-500 uppercase">Unduh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-600">{cert.certificateNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {cert.employeeName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-800">{cert.employeeName}</p>
                        <p className="text-[9px] text-slate-400">{cert.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-700 font-medium">{cert.program}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(cert.completionDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(cert.status)}`}>{cert.status}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#CC0000] transition-colors" title="Unduh Sertifikat">
                      <Download size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Total: <span className="font-bold text-slate-800">{filtered.length}</span> sertifikat
              {filterStatus && <span className="text-slate-400 ml-2">(status: {filterStatus})</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
