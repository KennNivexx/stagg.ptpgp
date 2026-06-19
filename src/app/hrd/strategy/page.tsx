import { supabaseAdmin } from "@/lib/supabase";
import {
  Users, Building2, Briefcase, TrendingUp, Target,
  BarChart3, Workflow, Lightbulb
} from "lucide-react";

export default async function HRDStrategy() {
  const [
    { count: totalEmployees },
    { count: totalDepartments },
    { count: activeJobs },
    { count: totalEvaluations },
  ] = await Promise.all([
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("departments").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("job_postings").select("*", { count: "exact", head: true }).eq("status", "Open"),
    supabaseAdmin.from("kpi_evaluations").select("*", { count: "exact", head: true }),
  ]);

  const strategicCards = [
    {
      title: "Workforce Analysis",
      description: "Analisis komposisi tenaga kerja, tren demografi, dan proyeksi kebutuhan SDM untuk mendukung pertumbuhan bisnis.",
      icon: <BarChart3 size={22} />,
      color: "blue",
      stats: `${(totalEmployees || 0)} karyawan di ${(totalDepartments || 0)} departemen`,
    },
    {
      title: "Organizational Design",
      description: "Perancangan struktur organisasi yang optimal, mendefinisikan peran, tanggung jawab, dan hierarki pelaporan.",
      icon: <Workflow size={22} />,
      color: "emerald",
      stats: `${(totalDepartments || 0)} unit organisasi aktif`,
    },
    {
      title: "Strategic Initiatives",
      description: "Inisiatif strategis SDM jangka panjang termasuk transformasi digital, budaya perusahaan, dan employer branding.",
      icon: <Lightbulb size={22} />,
      color: "amber",
      stats: `${(totalEvaluations || 0)} inisiatif evaluasi KPI`,
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Human Resource Strategy</h1>
        <p className="text-sm text-gray-500">Perencanaan strategis SDM selaras dengan visi perusahaan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalEmployees || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Building2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Departemen</p>
              <p className="text-xl font-extrabold text-slate-800">{totalDepartments || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><Briefcase size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Lowongan Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{activeJobs || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-slate-900 text-white rounded-lg"><Target size={16} /></div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">Strategic Planning</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pilar perencanaan strategis sumber daya manusia</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategicCards.map((card) => {
            const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
              blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100" },
              emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100" },
              amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-100" },
            };
            const c = colorClasses[card.color] || colorClasses.blue;
            return (
              <div key={card.title} className={`p-5 rounded-xl border ${c.border} ${c.bg} hover:shadow-sm transition-all`}>
                <div className={`mb-3 ${c.text}`}>{card.icon}</div>
                <h4 className="font-bold text-slate-800 text-sm mb-2">{card.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{card.description}</p>
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={12} className={c.text} />
                  <span className="text-[10px] font-bold text-slate-700">{card.stats}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
