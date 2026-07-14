"use client";

import { useState, useEffect } from "react";
import { Link2, Trash2, FileText, FolderOpen, BookOpen, Video } from "lucide-react";
import { getKnowledgeMappingBoard, getSkillsForMapping, mapKnowledgeToSkill, removeKnowledgeMapping, type KnowledgeBoardItem } from "@/app/actions/knowledge";
import EmptyState from "@/components/EmptyState";

const TYPE_ICON: Record<string, React.ReactNode> = {
  sop: <FileText size={13} />, kebijakan: <FolderOpen size={13} />, artikel: <BookOpen size={13} />, video: <Video size={13} />,
};
const TYPE_LABEL: Record<string, string> = { sop: "SOP", kebijakan: "Kebijakan", artikel: "Artikel", video: "Video" };

export default function KnowledgeMappingPage() {
  const [items, setItems] = useState<KnowledgeBoardItem[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<Record<string, string>>({});
  const [wajib, setWajib] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = async () => {
    const [board, sk] = await Promise.all([getKnowledgeMappingBoard(), getSkillsForMapping()]);
    setItems(board); setSkills(sk); setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  const showSuccess = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const key = (item: KnowledgeBoardItem) => `${item.content_type}:${item.content_id}`;

  const handleMap = async (item: KnowledgeBoardItem) => {
    const skillId = selectedSkill[key(item)];
    if (!skillId) return;
    setSaving(key(item)); setError("");
    const res = await mapKnowledgeToSkill(item.content_type, item.content_id, skillId, !!wajib[key(item)]);
    setSaving(null);
    if (res.error) { setError(res.error); return; }
    showSuccess("Mapping tersimpan.");
    await fetchData();
  };

  const handleRemove = async (mappingId: string) => {
    await removeKnowledgeMapping(mappingId);
    showSuccess("Mapping dihapus.");
    await fetchData();
  };

  const filtered = filter === "all" ? items : items.filter(i => i.content_type === filter);

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Mapping Kompetensi</h1>
        <p className="text-sm text-gray-500">Petakan tiap SOP/kebijakan/artikel/video ke kompetensi terkait — cukup sekali, materi akan otomatis muncul di Employee 360° karyawan dengan jabatan yang butuh kompetensi itu.</p>
      </div>

      {success && <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      <div className="flex gap-1.5 flex-wrap">
        {["all", "sop", "kebijakan", "artikel", "video"].map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${filter === t ? "bg-[#CC0000] text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
            {t === "all" ? "Semua" : TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Link2} title="Belum ada konten." />
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(item => (
              <div key={key(item)} className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                      {TYPE_ICON[item.content_type]} {TYPE_LABEL[item.content_type]}
                    </span>
                    <p className="text-sm font-bold text-slate-800">{item.title}</p>
                    <span className="text-[10px] text-slate-400">{item.status}</span>
                  </div>
                </div>

                {item.mapped_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.mapped_skills.map(ms => (
                      <span key={ms.mapping_id} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-bold">
                        {ms.skill_name} {ms.wajib && <span className="text-red-600">*wajib</span>}
                        <button onClick={() => handleRemove(ms.mapping_id)} className="hover:text-red-600"><Trash2 size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <select value={selectedSkill[key(item)] || ""} onChange={e => setSelectedSkill(prev => ({ ...prev, [key(item)]: e.target.value }))}
                    className="border border-gray-200 p-2 rounded-lg text-xs bg-white">
                    <option value="">Pilih kompetensi...</option>
                    {skills.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input type="checkbox" checked={!!wajib[key(item)]} onChange={e => setWajib(prev => ({ ...prev, [key(item)]: e.target.checked }))} className="accent-[#CC0000]" />
                    Wajib
                  </label>
                  <button onClick={() => handleMap(item)} disabled={saving === key(item) || !selectedSkill[key(item)]}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50">
                    {saving === key(item) ? "Menyimpan..." : "Tambah Mapping"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
