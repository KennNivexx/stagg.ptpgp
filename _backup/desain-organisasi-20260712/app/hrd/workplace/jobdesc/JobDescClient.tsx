"use client";

import { useState, useEffect } from "react";
import { FileText, Plus, Award, Trash2, Edit3, X, AlertTriangle, ListChecks, ClipboardList } from "lucide-react";
import { getJobDescs, saveJobDesc, deleteJobDesc, type JobDesc } from "@/app/actions/jobdesc";
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

export default function JobDescClient({ departments, positions }: Props) {
  const [data, setData] = useState<JobDesc[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [selected, setSelected] = useState<JobDesc | null>(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const [fTitle, setFTitle] = useState("");
  const [fPos, setFPos] = useState("");
  const [fDept, setFDept] = useState("");
  const [fKode, setFKode] = useState("");
  const [fResp, setFResp] = useState<string[]>([]);
  const [fReq, setFReq] = useState<string[]>([]);
  const [fErr, setFErr] = useState("");
  const [fLoading, setFLoading] = useState(false);

  useEffect(() => { getJobDescs().then(setData).finally(() => setLoading(false)); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const openAdd = () => { setFTitle(""); setFPos(""); setFDept(""); setFKode(""); setFResp([]); setFReq([]); setFErr(""); setModal("add"); setSelected(null); };
  const openEdit = (d: JobDesc) => { setSelected(d); setFTitle(d.title || ""); setFPos(d.position); setFDept(d.department); setFKode(d.kode || ""); setFResp([...d.responsibilities]); setFReq([...d.requirements]); setFErr(""); setModal("edit"); };
  const closeM = () => setModal(null);

  const doSave = async () => {
    if (!fPos.trim()) { setFErr("Posisi wajib diisi."); return; }
    if (!fKode.trim()) { setFErr("Kode perusahaan wajib diisi."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    if (selected) fd.append("id", selected.id);
    fd.append("title", fTitle.trim());
    fd.append("position", fPos.trim());
    fd.append("department", fDept);
    fd.append("kode", fKode.trim());
    fd.append("responsibilities", JSON.stringify(fResp.map(s => s.trim()).filter(Boolean)));
    fd.append("requirements", JSON.stringify(fReq.map(s => s.trim()).filter(Boolean)));
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
    return d.position.toLowerCase().includes(s) || d.department.toLowerCase().includes(s) || (d.title || "").toLowerCase().includes(s);
  });

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">{toast}</div>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Deskripsi Pekerjaan</h1>
          <p className="text-sm text-gray-500">Kelola deskripsi pekerjaan, tanggung jawab, dan persyaratan untuk setiap posisi. Satu posisi dapat memiliki beberapa deskripsi pekerjaan.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
          <Plus size={14} /> Tambah Deskripsi
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Jabatan", value: positions.length, icon: <Award size={18} />, color: "bg-blue-50 text-blue-600" },
          { label: "Deskripsi Tersimpan", value: data.length, icon: <FileText size={18} />, color: "bg-emerald-50 text-emerald-600" },
          { label: "Belum Didokumentasi", value: Math.max(positions.length - new Set(data.map(d => d.position)).size, 0), icon: <AlertTriangle size={18} />, color: "bg-amber-50 text-amber-600" },
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
        <input type="text" placeholder="Cari posisi, departemen, atau judul..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-4 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400/20" />
      </div>

      {loading ? (
        <div className="p-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" /><p className="text-sm text-slate-400">Memuat...</p></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileText} title="Belum ada deskripsi pekerjaan." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden group flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Award size={14} className="text-amber-500 shrink-0" />
                      <h3 className="font-extrabold text-slate-800 truncate">{d.position}</h3>
                    </div>
                    {d.title && <p className="text-xs font-semibold text-sky-700 mt-1">{d.title}</p>}
                    {d.department && <span className="text-[10px] text-slate-400 block mt-0.5">{d.department}</span>}
                    {d.kode && <code className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 font-mono inline-block mt-1">{d.kode}</code>}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600"><Edit3 size={14} /></button>
                    <button onClick={() => doDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4 flex-1">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ClipboardList size={12} /> Tanggung Jawab</p>
                  {d.responsibilities.length > 0 ? (
                    <ul className="space-y-1.5">
                      {d.responsibilities.map((r, i) => (
                        <li key={i} className="text-xs text-slate-600 flex gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-300 font-bold shrink-0">{i + 1}.</span>{r}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-slate-300 italic">Belum ada.</p>}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5"><ListChecks size={12} /> Persyaratan</p>
                  {d.requirements.length > 0 ? (
                    <ul className="space-y-1.5">
                      {d.requirements.map((r, i) => (
                        <li key={i} className="text-xs text-slate-600 flex gap-2 bg-slate-50 rounded-lg px-3 py-2">
                          <span className="text-slate-300 font-bold shrink-0">{i + 1}.</span>{r}
                        </li>
                      ))}
                    </ul>
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
                <h3 className="text-white font-bold text-sm">{modal === "add" ? "Tambah Deskripsi Pekerjaan" : `Edit: ${selected?.position}`}</h3>
              </div>
              <button onClick={closeM} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"><X size={14} className="text-white" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Judul Deskripsi (opsional)</label>
                <input type="text" value={fTitle} onChange={e => setFTitle(e.target.value)}
                  placeholder="Cth: Versi 2026 / Shift Pagi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
                <p className="text-[10px] text-slate-400 mt-1">Gunakan untuk membedakan beberapa deskripsi pada posisi yang sama.</p>
              </div>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kode Perusahaan *</label>
                <input type="text" value={fKode} onChange={e => setFKode(e.target.value)}
                  placeholder="Cth: 1.1.2.1.1.0.0"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-sky-400/30" />
                <p className="text-[10px] text-slate-400 mt-1">Isi manual sesuai kode struktur organisasi agar deskripsi pekerjaan ini jelas terkait unit/posisi mana.</p>
              </div>
              <ListEditor label="Tanggung Jawab" items={fResp} setItems={setFResp} placeholder="Cth: Menyusun laporan keuangan bulanan" />
              <ListEditor label="Persyaratan" items={fReq} setItems={setFReq} placeholder="Cth: S1 Akuntansi, min. 2 tahun pengalaman" />
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
