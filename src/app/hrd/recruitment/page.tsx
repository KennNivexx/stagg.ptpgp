import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { Briefcase, MapPin, Clock, Users, FileText, BarChart3 } from "lucide-react";

export default async function HRDRecruitment() {
  const [{ data: jobs, error }, { count: activeJobCount }, { count: applicantCount }] = await Promise.all([
    supabaseAdmin.from("jobs").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("jobs").select("*", { count: "exact", head: true }).eq("status", "Open"),
    supabaseAdmin.from("applications").select("*", { count: "exact", head: true }),
  ]);

  const quickCards = [
    {
      icon: Briefcase,
      label: "Lowongan Aktif",
      value: activeJobCount || 0,
      href: "#jobs",
      color: "bg-blue-50 text-blue-600",
    },
    {
      icon: Users,
      label: "Pelamar",
      value: applicantCount || 0,
      href: "/hrd/recruitment/applicants",
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: BarChart3,
      label: "Pipeline Rekrutmen",
      value: null,
      href: "/hrd/recruitment/pipeline",
      color: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530]">Rekrutmen</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola lowongan pekerjaan dan lamaran masuk.</p>
        </div>
        <Link href="/hrd/recruitment/new" className="bg-[#CC0000] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
          + Buat Lowongan Baru
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-slate-200 transition-all group"
          >
            <div className={`p-3 ${card.color} rounded-xl group-hover:scale-110 transition-transform`}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">{card.label}</p>
              <p className="text-xl font-extrabold text-slate-800">
                {card.value !== null ? card.value : "\u00A0"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div id="jobs">
        <h2 className="text-base font-extrabold text-slate-800 mb-4">Daftar Lowongan</h2>

        {error ? (
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center text-red-600">
            Gagal memuat data: {error.message}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <div className="text-5xl mb-4 opacity-30">📋</div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Belum ada lowongan</h3>
            <p className="text-sm text-slate-500 mb-6">Buat lowongan pertama untuk mulai menerima lamaran</p>
            <Link href="/hrd/recruitment/new" className="bg-[#CC0000] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center gap-2">
              + Buat Lowongan Pertama
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job: Record<string, unknown>) => (
              <div key={job.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-bold text-slate-800">{job.title as string}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        job.status === "Open" ? "bg-emerald-50 text-emerald-700" :
                        job.status === "Closed" ? "bg-red-50 text-red-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {job.status as string || "Open"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Briefcase size={12} /> {job.department as string || "-"}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {job.location as string || "-"}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {job.type as string || "-"}</span>
                      {!!job.deadline && (
                        <span className="flex items-center gap-1 text-red-500 font-semibold">
                          <Clock size={12} /> Deadline: {new Date(job.deadline as string).toLocaleDateString("id-ID")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2">{job.description as string}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/hrd/recruitment/${job.id}/applicants`}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Users size={12} /> Pelamar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
