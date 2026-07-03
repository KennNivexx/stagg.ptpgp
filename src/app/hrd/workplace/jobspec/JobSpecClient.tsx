"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Briefcase, Trash2, Edit3, X, GraduationCap, Wrench, ShieldCheck, AlertTriangle, Building2 } from "lucide-react";
import { getJobSpecs, saveJobSpec, deleteJobSpec, type JobSpec } from "@/app/actions/jobspec";
import EmptyState from "@/components/EmptyState";

interface Props { departments: string[]; positions: string[]; }

/** Growable list input: add/remove/edit items one at a time. */
function ListEditor({ label, items, setItems, placeholder }: {
  label: string; items: string[]; setItems: (v: string[]) => void; placeholder: string;
}) {
  const update = (i: number, v: string) => setItems(items.map((it, idx) => idx === i ? v : it));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, ""]);

  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{label}</label>
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-xs text-slate-400 italic mb-1">Belum ada butir. Klik &ldquo;Tambah&rdquo; untuk menambahkan.</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[10px] text-slate-300 font-mono w-4 shrink-0">{i + 1}.</span>
            <input
              type="text" value={item} onChange={e => update(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
            <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add}
        className="mt-2 flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg transition-colors">
        <Plus size={12} /> Tambah {label.toLowerCase()}
      </button>
    </div>
  );
}

export default function JobSpecClient({ departments, positions }: Props) {
  const [data, setData] = useState<JobSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<JobSpec | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [fTitle, setFTitle] = useState("");
  const [fPos, setFPos] = useState("");
  const [fDept, setFDept] = useState("");
  const [fEdu, setFEdu] = useState("");
  const [fExp, setFExp] = useState("");
  const [fSkills, setFSkills] = useState<string[]>([]);
  const [fCert, setFCert] = useState<string[]>([]);
  const [fErr, setFErr] = useState("");
  const [fLoading, setFLoading] = useState(false);

  useEffect(() => { getJobSpecs().then(setData).finally(() => setLoading(false)); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openAdd = () => { setFTitle(""); setFPos(""); setFDept(""); setFEdu(""); setFExp(""); setFSkills([]); setFCert([]); setFErr(""); setModal("add"); setSelected(null); };
  const openEdit = (d: JobSpec) => { setSelected(d); setFTitle(d.title || ""); setFPos(d.position); setFDept(d.department); setFEdu(d.education); setFExp(d.experience); setFSkills([...d.skills]); setFCert([...d.certifications]); setFErr(""); setModal("edit"); };
  const closeM = () => setModal(null);

  const doSave = async () => {
    if (!fDept.trim()) { setFErr("Departemen wajib dipilih."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    if (selected) fd.append("id", selected.id);
    fd.append("title", fTitle.trim());
    fd.append("position", fPos.trim());
    fd.append("department", fDept);
    fd.append("education", fEdu);
    fd.append("experience", fExp);
    fd.append("skills", JSON.stringify(fSkills.map(s => s.trim()).filter(Boolean)));
    fd.append("certifications", JSON.stringify(fCert.map(s => s.trim()).filter(Boolean)));
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
    return d.department.toLowerCase().includes(s) || (d.position || "").toLowerCase().includes(s) || (d.title || "").toLowerCase().includes(s);
  });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Spesifikasi Pekerjaan</h1>
          <p className="text-sm text-gray-500">Kelola spesifikasi, kualifikasi, pendidikan, dan keterampilan yang dibutuhkan per departemen. Satu departemen dapat memiliki beberapa spesifikasi.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
          <Plus size={14} /> Tambah Spesifikasi
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Departemen", value: departments.length, icon: <Building2 size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Spesifikasi Tersimpan", value: data.length, icon: <FileText size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Belum Terspesifikasi", value: Math.max(departments.length - new Set(data.map(d => d.department)).size, 0), icon: <AlertTriangle size={18} />, color: "bg-amber-50 text-amber-600" },
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
        <input type="text" placeholder="Cari departemen atau judul..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400/20" />
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" /><p className="text-sm text-slate-400">Memuat...</p></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Belum ada spesifikasi pekerjaan." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-blue-500 shrink-0" />
                      <h3 className="font-extrabold text-slate-800 truncate">{d.department}</h3>
                    </div>
                    {d.title && <p className="text-xs font-semibold text-sky-700 mt-1">{d.title}</p>}
                    {d.position && <span className="text-[10px] text-slate-400 block mt-0.5">Terkait posisi: {d.position}</span>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600"><Edit3 size={14} /></button>
                    <button onClick={() => doDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-3 flex-1">
                <div className="grid grid-cols-2 gap-2">
                  {d.education && (
                    <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                      <GraduationCap size={13} className="text-indigo-500 shrink-0" />
                      <span className="text-xs font-semibold text-indigo-700 truncate">{d.education}</span>
                    </div>
                  )}
                  {d.experience && (
                    <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2">
                      <Briefcase size={13} className="text-amber-500 shrink-0" />
                      <span className="text-xs font-semibold text-amber-700 truncate">{d.experience}</span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Wrench size={12} /> Keterampilan</p>
                  {d.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {d.skills.map((s, i) => (
                        <span key={i} className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">{s}</span>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-300 italic">Belum ada.</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ShieldCheck size={12} /> Sertifikasi</p>
                  {d.certifications.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {d.certifications.map((c, i) => (
                        <span key={i} className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">{c}</span>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-300 italic">Belum ada.</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[6vh]" onClick={closeM}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-900 px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                {modal === "add" ? <Plus size={18} className="text-emerald-400" /> : <Edit3 size={18} className="text-sky-400" />}
                <h3 className="text-white font-bold text-sm">{modal === "add" ? "Tambah Spesifikasi Pekerjaan" : `Edit: ${selected?.department}`}</h3>
              </div>
              <button onClick={closeM} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Judul Spesifikasi (opsional)</label>
                <input type="text" value={fTitle} onChange={e => setFTitle(e.target.value)}
                  placeholder="Cth: Kualifikasi Umum / Kualifikasi Senior"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
                <p className="text-[10px] text-slate-400 mt-1">Gunakan untuk membedakan beberapa spesifikasi pada departemen yang sama.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Departemen *</label>
                <select value={fDept} onChange={e => setFDept(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30">
                  <option value="">Pilih Departemen</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Posisi Terkait (opsional)</label>
                <select value={fPos} onChange={e => setFPos(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30">
                  <option value="">Tidak spesifik ke posisi tertentu</option>
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
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
              <ListEditor label="Keterampilan" items={fSkills} setItems={setFSkills} placeholder="Cth: Microsoft Excel" />
              <ListEditor label="Sertifikasi" items={fCert} setItems={setFCert} placeholder="Cth: Brevet A & B" />
              {fErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"><AlertTriangle size={14} className="text-red-500" /><p className="text-red-600 text-sm">{fErr}</p></div>}
              <div className="flex gap-3 pt-1">
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
