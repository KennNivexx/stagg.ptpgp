"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Award, Briefcase, Trash2, Edit3, X, GraduationCap, Wrench, ShieldCheck, AlertTriangle } from "lucide-react";
import { getJobSpecs, saveJobSpec, deleteJobSpec } from "@/app/actions/jobspec";

interface JobSpec {
  id: string; position: string; department: string;
  education: string; experience: string; skills: string[]; certifications: string[];
}

interface Props { departments: string[]; positions: string[]; }

export default function JobSpecClient({ departments, positions }: Props) {
  const [data, setData] = useState<JobSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<JobSpec | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [fPos, setFPos] = useState("");
  const [fDept, setFDept] = useState("");
  const [fEdu, setFEdu] = useState("");
  const [fExp, setFExp] = useState("");
  const [fSkills, setFSkills] = useState("");
  const [fCert, setFCert] = useState("");
  const [fErr, setFErr] = useState("");
  const [fLoading, setFLoading] = useState(false);

  useEffect(() => { getJobSpecs().then(setData).finally(() => setLoading(false)); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openAdd = () => { setFPos(""); setFDept(""); setFEdu(""); setFExp(""); setFSkills(""); setFCert(""); setFErr(""); setModal("add"); setSelected(null); };
  const openEdit = (d: JobSpec) => { setSelected(d); setFPos(d.position); setFDept(d.department); setFEdu(d.education); setFExp(d.experience); setFSkills(d.skills.join("\n")); setFCert(d.certifications.join("\n")); setFErr(""); setModal("edit"); };
  const closeM = () => setModal(null);

  const doSave = async () => {
    if (!fPos.trim()) { setFErr("Posisi wajib diisi."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    if (selected) fd.append("id", selected.id);
    fd.append("position", fPos.trim());
    fd.append("department", fDept);
    fd.append("education", fEdu);
    fd.append("experience", fExp);
    fd.append("skills", fSkills);
    fd.append("certifications", fCert);
    const r = await saveJobSpec(fd);
    setFLoading(false);
    if (r.error) { showToast(r.error); setFErr(r.error); return; }
    showToast("Spesifikasi pekerjaan disimpan.");
    closeM();
    getJobSpecs().then(setData);
  };

  const doDelete = async (id: string) => {
    const result = await deleteJobSpec(id);
    if (result?.error) { showToast(result.error); return; }
    getJobSpecs().then(setData);
    showToast("Dihapus.");
  };

  const filtered = data.filter(d => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return d.position.toLowerCase().includes(s) || d.department.toLowerCase().includes(s);
  });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Spesifikasi Pekerjaan</h1>
          <p className="text-sm text-gray-500">Kelola spesifikasi, kualifikasi, pendidikan, dan keterampilan yang dibutuhkan per posisi.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
          <Plus size={14} /> Tambah Spesifikasi
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Jabatan", value: positions.length, icon: <Award size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Spesifikasi Tersimpan", value: data.length, icon: <FileText size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Belum Terspesifikasi", value: Math.max(positions.length - data.length, 0), icon: <AlertTriangle size={18} />, color: "bg-amber-50 text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p><p className="text-xl font-extrabold text-slate-800">{s.value}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative max-w-sm">
        <input type="text" placeholder="Cari posisi..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400/20" />
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" /><p className="text-sm text-slate-400">Memuat...</p></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><FileText size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-sm text-slate-500">Belum ada spesifikasi pekerjaan.</p></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-amber-500" />
                    <h3 className="font-extrabold text-slate-800">{d.position}</h3>
                  </div>
                  {d.department && <span className="text-[10px] text-slate-400">{d.department}</span>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(d)} className="p-1 rounded hover:bg-sky-100 text-sky-600"><Edit3 size={14} /></button>
                  <button onClick={() => doDelete(d.id)} className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {d.education && <div className="flex items-center gap-2"><GraduationCap size={12} className="text-indigo-500 shrink-0" /><span className="text-slate-600">{d.education}</span></div>}
                {d.experience && <div className="flex items-center gap-2"><Briefcase size={12} className="text-amber-500 shrink-0" /><span className="text-slate-600">{d.experience}</span></div>}
                {d.skills.length > 0 && <div className="flex items-start gap-2"><Wrench size={12} className="text-blue-500 shrink-0 mt-0.5" /><span className="text-slate-600">{d.skills.slice(0, 4).join(", ")}{d.skills.length > 4 ? " ..." : ""}</span></div>}
                {d.certifications.length > 0 && <div className="flex items-start gap-2"><ShieldCheck size={12} className="text-emerald-500 shrink-0 mt-0.5" /><span className="text-slate-600">{d.certifications.slice(0, 3).join(", ")}{d.certifications.length > 3 ? " ..." : ""}</span></div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[8vh]" onClick={closeM}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {modal === "add" ? <Plus size={18} className="text-emerald-400" /> : <Edit3 size={18} className="text-sky-400" />}
                <h3 className="text-white font-bold text-sm">{modal === "add" ? "Tambah Spesifikasi" : `Edit: ${selected?.position}`}</h3>
              </div>
              <button onClick={closeM} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Posisi *</label>
                <select value={fPos} onChange={e => setFPos(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30">
                  <option value="">Pilih Posisi</option>
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Departemen</label>
                <select value={fDept} onChange={e => setFDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30">
                  <option value="">Pilih Departemen</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pendidikan</label>
                <select value={fEdu} onChange={e => setFEdu(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30">
                  <option value="">Pilih Pendidikan</option>
                  <option>SMA/SMK</option><option>D3</option><option>S1</option><option>S2</option><option>S3</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pengalaman</label>
                <input value={fExp} onChange={e => setFExp(e.target.value)} placeholder="Min. 2 tahun"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Keterampilan (1 per baris)</label>
                <textarea value={fSkills} onChange={e => setFSkills(e.target.value)} rows={3}
                  placeholder="Microsoft Excel&#10;Software Akuntansi&#10;Analisis Keuangan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Sertifikasi (1 per baris)</label>
                <textarea value={fCert} onChange={e => setFCert(e.target.value)} rows={3}
                  placeholder="Brevet A & B&#10;Sertifikasi ISO"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
              </div>
              {fErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"><AlertTriangle size={14} className="text-red-500" /><p className="text-red-600 text-sm">{fErr}</p></div>}
              <div className="flex gap-3">
                <button onClick={closeM} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold">Batal</button>
                <button onClick={doSave} disabled={fLoading} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold">{fLoading ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
