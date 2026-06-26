"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Award, Trash2, Edit3, X, AlertTriangle } from "lucide-react";
import { getJobDescs, saveJobDesc, deleteJobDesc } from "@/app/actions/jobdesc";

interface JobDesc {
  id: string; position: string; department: string;
  responsibilities: string[]; requirements: string[];
}

interface Props { departments: string[]; positions: string[]; }

export default function JobDescClient({ departments, positions }: Props) {
  const [data, setData] = useState<JobDesc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<JobDesc | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [fPos, setFPos] = useState("");
  const [fDept, setFDept] = useState("");
  const [fResp, setFResp] = useState("");
  const [fReq, setFReq] = useState("");
  const [fErr, setFErr] = useState("");
  const [fLoading, setFLoading] = useState(false);

  useEffect(() => { getJobDescs().then(setData).finally(() => setLoading(false)); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openAdd = () => { setFPos(""); setFDept(""); setFResp(""); setFReq(""); setFErr(""); setModal("add"); setSelected(null); };
  const openEdit = (d: JobDesc) => { setSelected(d); setFPos(d.position); setFDept(d.department); setFResp(d.responsibilities.join("\n")); setFReq(d.requirements.join("\n")); setFErr(""); setModal("edit"); };
  const closeM = () => setModal(null);

  const doSave = async () => {
    if (!fPos.trim()) { setFErr("Posisi wajib diisi."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    if (selected) fd.append("id", selected.id);
    fd.append("position", fPos.trim());
    fd.append("department", fDept);
    fd.append("responsibilities", fResp);
    fd.append("requirements", fReq);
    const r = await saveJobDesc(fd);
    setFLoading(false);
    if (r.error) { showToast(r.error); setFErr(r.error); return; }
    showToast("Deskripsi pekerjaan disimpan.");
    closeM();
    getJobDescs().then(setData);
  };

  const doDelete = async (id: string) => {
    const result = await deleteJobDesc(id);
    if (result?.error) { showToast(result.error); return; }
    getJobDescs().then(setData);
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
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Deskripsi Pekerjaan</h1>
          <p className="text-sm text-gray-500">Kelola deskripsi pekerjaan, tanggung jawab, dan persyaratan untuk setiap posisi.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
          <Plus size={14} /> Tambah Deskripsi
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Jabatan", value: positions.length, icon: <Award size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Deskripsi Tersimpan", value: data.length, icon: <FileText size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Belum Didokumentasi", value: Math.max(positions.length - data.length, 0), icon: <AlertTriangle size={18} />, color: "bg-amber-50 text-amber-600" },
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
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center"><FileText size={40} className="mx-auto text-slate-300 mb-4" /><p className="text-sm text-slate-500">Belum ada deskripsi pekerjaan.</p></div>
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
                  {d.department && <span className="text-[10px] text-slate-400 mt-0.5">{d.department}</span>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(d)} className="p-1 rounded hover:bg-sky-100 text-sky-600"><Edit3 size={14} /></button>
                  <button onClick={() => doDelete(d.id)} className="p-1 rounded hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              {d.responsibilities.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggung Jawab</p>
                  <ul className="space-y-0.5">
                    {d.responsibilities.slice(0, 4).map((r, i) => <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-slate-300">•</span>{r}</li>)}
                    {d.responsibilities.length > 4 && <li className="text-[10px] text-slate-400">+{d.responsibilities.length - 4} lainnya</li>}
                  </ul>
                </div>
              )}
              {d.requirements.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Persyaratan</p>
                  <ul className="space-y-0.5">
                    {d.requirements.slice(0, 3).map((r, i) => <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-slate-300">•</span>{r}</li>)}
                    {d.requirements.length > 3 && <li className="text-[10px] text-slate-400">+{d.requirements.length - 3} lainnya</li>}
                  </ul>
                </div>
              )}
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
                <h3 className="text-white font-bold text-sm">{modal === "add" ? "Tambah Deskripsi" : `Edit: ${selected?.position}`}</h3>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Tanggung Jawab (1 per baris)</label>
                <textarea value={fResp} onChange={e => setFResp(e.target.value)} rows={4}
                  placeholder="Melakukan pencatatan keuangan harian&#10;Menyusun laporan keuangan bulanan"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Persyaratan (1 per baris)</label>
                <textarea value={fReq} onChange={e => setFReq(e.target.value)} rows={4}
                  placeholder="S1 Akuntansi&#10;Minimal 2 tahun pengalaman"
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
