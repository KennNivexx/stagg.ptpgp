"use client";

import { useState, useEffect, useMemo } from "react";
import { Award, Search, CheckCircle, Clock, FileText, X, Save, AlertTriangle } from "lucide-react";
import { getTrainings, getTrainingCertificates, issueCertificate } from "@/app/actions/trainings";
import { getEmployees } from "@/app/actions/hrd";
import EmptyState from "@/components/EmptyState";

type Training = { id: string; title: string };
type EmployeeLite = { id: string; full_name: string; department: string };
type Certificate = {
  id: string;
  training_id: string;
  employee_id: string;
  certificate_number: string;
  completion_date: string | null;
  status: string;
  created_at: string;
};

export default function Sertifikat() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ training_id: "", employee_id: "", certificate_number: "", completion_date: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  const showToast = (type: "error" | "success", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [t, e, c] = await Promise.all([getTrainings(), getEmployees(), getTrainingCertificates()]);
      setTrainings((t as Record<string, unknown>[]).map((x) => ({ id: x.id as string, title: x.title as string })));
      setEmployees((e as Record<string, unknown>[]).map((x) => ({ id: x.id as string, full_name: x.full_name as string, department: x.department as string })));
      setCertificates(c as Certificate[]);
    } catch {
      showToast("error", "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const trainingMap = useMemo(() => {
    const map: Record<string, string> = {};
    trainings.forEach((t) => { map[t.id] = t.title; });
    return map;
  }, [trainings]);

  const employeeMap = useMemo(() => {
    const map: Record<string, EmployeeLite> = {};
    employees.forEach((e) => { map[e.id] = e; });
    return map;
  }, [employees]);

  const filtered = certificates.filter((c) => {
    const empName = employeeMap[c.employee_id]?.full_name || "";
    const programName = trainingMap[c.training_id] || "";
    if (searchQuery && !empName.toLowerCase().includes(searchQuery.toLowerCase()) && !programName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData();
    fd.append("training_id", formData.training_id);
    fd.append("employee_id", formData.employee_id);
    fd.append("certificate_number", formData.certificate_number);
    fd.append("completion_date", formData.completion_date);
    const r = await issueCertificate(fd);
    setSaving(false);
    if (r?.error) { showToast("error", r.error); return; }
    showToast("success", "Sertifikat berhasil diterbitkan.");
    setShowForm(false);
    setFormData({ training_id: "", employee_id: "", certificate_number: "", completion_date: "" });
    loadData();
  };

  const getStatusColor = (s: string) => {
    if (s === "Diterbitkan") return "bg-emerald-50 text-emerald-700";
    if (s === "Menunggu") return "bg-amber-50 text-amber-700";
    return "bg-slate-100 text-slate-500";
  };

  const issuedCount = certificates.filter((c) => c.status === "Diterbitkan").length;
  const pendingCount = certificates.filter((c) => c.status === "Menunggu").length;

  return (
    <div className="p-6 lg:p-8">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-bold ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2"><X size={14} /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Sertifikat</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola sertifikat pelatihan yang diterbitkan untuk karyawan.</p>
        </div>
        <button
          onClick={() => { setFormData({ training_id: "", employee_id: "", certificate_number: "", completion_date: new Date().toISOString().split("T")[0] }); setShowForm(true); }}
          disabled={trainings.length === 0}
          className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Award size={14} /> Terbitkan Sertifikat
        </button>
      </div>

      {!loading && trainings.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
          Belum ada program training. Buat program training terlebih dahulu di halaman <b>Training</b> sebelum menerbitkan sertifikat.
        </div>
      )}

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

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Terbitkan Sertifikat</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Program Pelatihan</label>
                <select required value={formData.training_id} onChange={(e) => setFormData({ ...formData, training_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Program</option>
                  {trainings.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Karyawan</label>
                <select required value={formData.employee_id} onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm">
                  <option value="">Pilih Karyawan</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} — {e.department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Sertifikat</label>
                <input required value={formData.certificate_number} onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" placeholder="Contoh: CERT-2026-001" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai</label>
                <input type="date" required value={formData.completion_date} onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50">
                <Save size={14} /> {saving ? "Menerbitkan..." : "Terbitkan"}
              </button>
            </form>
          </div>
        </div>
      )}

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

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Award} title="Tidak ada sertifikat ditemukan." description="Terbitkan sertifikat pertama untuk karyawan yang telah menyelesaikan pelatihan." />
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((cert) => {
                const emp = employeeMap[cert.employee_id];
                return (
                  <tr key={cert.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-bold text-slate-600">{cert.certificate_number}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {emp?.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-800">{emp?.full_name || "Karyawan tidak ditemukan"}</p>
                          <p className="text-[9px] text-slate-400">{emp?.department || "-"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-700 font-medium">{trainingMap[cert.training_id] || "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {cert.completion_date ? new Date(cert.completion_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStatusColor(cert.status)}`}>{cert.status}</span>
                    </td>
                  </tr>
                );
              })}
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
