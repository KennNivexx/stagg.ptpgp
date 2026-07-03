"use client";

import { useState, useEffect } from "react";
import { getHiringDecisions } from "@/app/actions/recruitment";
import { UserCheck, UserX, Star, Users, Mail, Phone } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

type AppEntry = Record<string, unknown> & { job: { position: string; department: string } | null };

function formatDate(d: unknown) {
  if (!d) return "-";
  return new Date(d as string).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(v: unknown) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return "Rp " + n.toLocaleString("id-ID");
}

function TestSummary({ app }: { app: AppEntry }) {
  const tulis = app.test_tulis_result as Record<string, unknown> | null;
  const psikotes = app.test_psikotes_result as Record<string, unknown> | null;
  if (!tulis && !psikotes) return <span className="text-slate-300">-</span>;
  return (
    <div className="flex flex-col gap-1">
      {tulis && (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold w-fit ${(tulis.passed as boolean) ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          Tulis: {tulis.score as number}% {(tulis.passed as boolean) ? "(Lulus)" : "(Tidak Lulus)"}
        </span>
      )}
      {psikotes && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold w-fit bg-purple-50 text-purple-700">
          Psikotes: {psikotes.overall as number}%
        </span>
      )}
    </div>
  );
}

export default function KeputusanHiring() {
  const [data, setData] = useState<{ diterima: AppEntry[]; ditolak: AppEntry[]; talentPool: AppEntry[] }>({
    diterima: [], ditolak: [], talentPool: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"diterima" | "ditolak" | "talentpool">("diterima");

  useEffect(() => {
    getHiringDecisions().then(res => {
      setData(res as { diterima: AppEntry[]; ditolak: AppEntry[]; talentPool: AppEntry[] });
      setLoading(false);
    });
  }, []);

  const tabs = [
    { key: "diterima" as const, label: "Diterima", count: data.diterima.length, icon: UserCheck, color: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700" },
    { key: "ditolak" as const, label: "Ditolak", count: data.ditolak.length, icon: UserX, color: "text-red-700", badge: "bg-red-50 text-red-700" },
    { key: "talentpool" as const, label: "Talent Pool", count: data.talentPool.length, icon: Star, color: "text-amber-700", badge: "bg-amber-50 text-amber-700" },
  ];

  const activeList = activeTab === "diterima" ? data.diterima : activeTab === "ditolak" ? data.ditolak : data.talentPool;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Keputusan Hiring</h1>
        <p className="text-sm text-gray-500 mt-1">Rekap hasil akhir rekrutmen — kandidat diterima, ditolak, dan disimpan ke Talent Pool.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Diterima", value: data.diterima.length, icon: UserCheck, color: "bg-emerald-50 text-emerald-600" },
          { label: "Ditolak", value: data.ditolak.length, icon: UserX, color: "bg-red-50 text-red-600" },
          { label: "Talent Pool", value: data.talentPool.length, icon: Star, color: "bg-amber-50 text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
              <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === tab.key ? `bg-white shadow-sm ${tab.color}` : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <tab.icon size={12} /> {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto" />
        </div>
      ) : activeList.length === 0 ? (
        <EmptyState
          icon={activeTab === "diterima" ? UserCheck : activeTab === "ditolak" ? UserX : Star}
          title={
            activeTab === "diterima" ? "Belum ada kandidat yang diterima."
              : activeTab === "ditolak" ? "Belum ada kandidat yang ditolak (di luar Talent Pool)."
              : "Talent Pool masih kosong. Tambahkan dari halaman Pipeline setelah menolak kandidat yang sudah interview."
          }
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Nama &amp; Kontak</th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Posisi</th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Tanggal Lamar</th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Hasil Tes</th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Ekspektasi Gaji</th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Gaji Ditawarkan</th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Gaji Final</th>
                  {activeTab === "talentpool" && <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Catatan Talent Pool</th>}
                  <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Status Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {activeList.map(app => (
                  <tr key={app.id as string} className="hover:bg-slate-50/30 align-top">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-[10px] text-white shrink-0 ${
                          activeTab === "diterima" ? "bg-gradient-to-br from-emerald-500 to-emerald-700"
                            : activeTab === "talentpool" ? "bg-gradient-to-br from-amber-400 to-amber-600"
                            : "bg-gradient-to-br from-red-400 to-red-600"
                        }`}>
                          {(app.full_name as string)?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs whitespace-nowrap">{app.full_name as string}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-0.5"><Mail size={9} /> {app.email as string}</p>
                          {!!app.phone && <p className="text-[10px] text-slate-400 flex items-center gap-0.5"><Phone size={9} /> {app.phone as string}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs font-bold text-slate-700 whitespace-nowrap">{app.job?.position || "-"}</p>
                      {app.job?.department && <p className="text-[10px] text-slate-400">{app.job.department}</p>}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(app.applied_at)}
                    </td>
                    <td className="px-4 py-4">
                      <TestSummary app={app} />
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{formatCurrency(app.salary_expectation)}</td>
                    <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">{formatCurrency(app.offered_salary)}</td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-800 whitespace-nowrap">{formatCurrency(app.final_salary)}</td>
                    {activeTab === "talentpool" && (
                      <td className="px-4 py-4 text-xs text-slate-500 max-w-[220px]">
                        {(app.talent_pool_notes as string) || "-"}
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                        activeTab === "diterima" ? "bg-emerald-50 text-emerald-700"
                          : activeTab === "talentpool" ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
                      }`}>
                        {activeTab === "diterima" ? "Diterima" : activeTab === "talentpool" ? "Talent Pool" : "Ditolak"}
                      </span>
                      {activeTab === "talentpool" && (
                        <Link href="/hrd/recruitment/talentpool" className="block mt-1.5 text-[10px] font-bold text-amber-600 hover:underline">
                          Kelola di Talent Pool →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Total: <span className="font-bold text-slate-800">{activeList.length}</span> kandidat
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <p className="text-xs text-blue-700 flex items-center gap-2">
          <Users size={13} />
          <span>Keputusan (Interview / Rekrut / Tolak) dibuat di halaman <Link href="/hrd/recruitment/pipeline" className="font-bold underline">Pipeline Kandidat</Link>. Halaman ini hanya menampilkan rekap hasil akhir.</span>
        </p>
      </div>
    </div>
  );
}
