"use client";

import { useState } from "react";
import {
  FileText, Award, ClipboardList, ListChecks, GraduationCap, Briefcase,
  Wrench, ShieldCheck, Building2,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";

interface JobDesc {
  id: string; title: string; position: string; department: string;
  responsibilities: string[]; requirements: string[];
}
interface JobSpec {
  id: string; title: string; position: string; department: string;
  education: string; experience: string; skills: string[]; certifications: string[];
}

interface Props { jobDescs: JobDesc[]; jobSpecs: JobSpec[]; }

export default function JobDescJobSpecClient({ jobDescs, jobSpecs }: Props) {
  const [tab, setTab] = useState<"desc" | "spec">("desc");

  return (
    <div className="space-y-6">
      <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl self-start shadow-sm">
        {(["desc", "spec"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-emerald-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "desc" ? <>Deskripsi Kerja ({jobDescs.length})</> : <>Spesifikasi Kerja ({jobSpecs.length})</>}
          </button>
        ))}
      </div>

      {tab === "desc" && (
        jobDescs.length === 0 ? (
          <EmptyState icon={FileText} title="Belum ada deskripsi pekerjaan di departemen ini." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jobDescs.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-amber-500 shrink-0" />
                    <h3 className="font-extrabold text-slate-800">{d.position}</h3>
                  </div>
                  {d.title && <p className="text-xs font-semibold text-emerald-700 mt-1">{d.title}</p>}
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
        )
      )}

      {tab === "spec" && (
        jobSpecs.length === 0 ? (
          <EmptyState icon={FileText} title="Belum ada spesifikasi pekerjaan di departemen ini." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {jobSpecs.map(d => (
              <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-blue-500 shrink-0" />
                    <h3 className="font-extrabold text-slate-800">{d.department}</h3>
                  </div>
                  {d.title && <p className="text-xs font-semibold text-emerald-700 mt-1">{d.title}</p>}
                  {d.position && <span className="text-[10px] text-slate-400 block mt-0.5">Terkait posisi: {d.position}</span>}
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
        )
      )}
    </div>
  );
}
