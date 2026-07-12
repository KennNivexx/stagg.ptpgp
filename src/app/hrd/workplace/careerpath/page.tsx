"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, GitBranch, ArrowRight, X } from "lucide-react";
import { getCareerPathGraph, addCareerPathEdge, deleteCareerPathEdge, type JalurJabatan } from "@/app/actions/career-path";
import { getMasterJabatan, type MasterJabatan } from "@/app/actions/positions";
import EmptyState from "@/components/EmptyState";

/**
 * Career Path: master jenjang antar-jabatan (directed graph, jabatan asal ->
 * jabatan tujuan) — beda dari halaman "Jalur Karir" di modul Pengembangan
 * Karir yang visualisasi read-only per departemen/level.
 */
export default function CareerPathPage() {
  const [edges, setEdges] = useState<JalurJabatan[]>([]);
  const [jabatans, setJabatans] = useState<MasterJabatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fKet, setFKet] = useState("");

  const fetchData = async () => {
    const [e, j] = await Promise.all([getCareerPathGraph(), getMasterJabatan()]);
    setEdges(e); setJabatans(j);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const showSuccess = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(""), 3000); };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    const fd = new FormData();
    fd.append("jabatan_dari_id", fFrom); fd.append("jabatan_ke_id", fTo); fd.append("keterangan", fKet);
    const res = await addCareerPathEdge(fd);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    setFFrom(""); setFTo(""); setFKet(""); setShowForm(false);
    showSuccess("Jalur karir ditambahkan.");
    await fetchData();
  };

  const handleDelete = async (id: string) => {
    setError("");
    const res = await deleteCareerPathEdge(id);
    if (res.error) { setError(res.error); return; }
    showSuccess("Jalur karir dihapus.");
    await fetchData();
  };

  // Group by asal jabatan so the list reads as a jenjang (A -> B, A -> C ...).
  const grouped = edges.reduce<Record<string, JalurJabatan[]>>((acc, e) => {
    (acc[e.jabatan_dari_name] ||= []).push(e);
    return acc;
  }, {});

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Career Path</h1>
          <p className="text-sm text-gray-500">Jenjang jabatan resmi (jabatan asal &rarr; jabatan tujuan) sebagai acuan promosi/mutasi — master data, bukan riwayat karyawan.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 px-4 py-2.5 bg-[#CC0000] hover:bg-[#aa0000] text-white text-sm font-bold rounded-xl transition-colors">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? "Batal" : "Tambah Jalur"}
        </button>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jabatan Asal *</label>
              <select required value={fFrom} onChange={e => setFFrom(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none">
                <option value="">Pilih Jabatan</option>
                {jabatans.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jabatan Tujuan *</label>
              <select required value={fTo} onChange={e => setFTo(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm bg-white focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none">
                <option value="">Pilih Jabatan</option>
                {jabatans.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Keterangan</label>
              <input value={fKet} onChange={e => setFKet(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Menyimpan..." : "Simpan Jalur"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {edges.length === 0 ? (
          <EmptyState icon={GitBranch} title="Belum ada jalur karir." description="Tambahkan jalur pertama untuk mulai memetakan jenjang jabatan." />
        ) : (
          <div className="divide-y divide-slate-50">
            {Object.entries(grouped).map(([from, list]) => (
              <div key={from} className="p-5">
                <p className="text-xs font-extrabold text-slate-800 mb-2">{from}</p>
                <div className="flex flex-col gap-2">
                  {list.map(e => (
                    <div key={e.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2.5">
                      <ArrowRight size={14} className="text-[#CC0000] shrink-0" />
                      <span className="text-sm font-semibold text-slate-700 flex-1">{e.jabatan_ke_name}</span>
                      {e.keterangan && <span className="text-xs text-slate-400">{e.keterangan}</span>}
                      <button onClick={() => handleDelete(e.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
