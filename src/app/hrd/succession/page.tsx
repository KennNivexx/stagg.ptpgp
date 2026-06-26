import { supabaseAdmin } from "@/lib/supabase";
import { Users, UserCheck, Shield, AlertTriangle, Crown, Plus } from "lucide-react";
import Link from "next/link";

export default async function HRDSuccession() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position, status")
    .neq("status", "Resigned");

  const empList = (employees || []) as Array<Record<string, string>>;

  const byDept: Record<string, number> = {};
  empList.forEach((e) => {
    if (e.department) byDept[e.department] = (byDept[e.department] || 0) + 1;
  });

  const { data: kpiData } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("employee_id, score, employees!inner(department)")
    .order("created_at", { ascending: false });

  const kpiScores: Record<string, number[]> = {};
  ((kpiData || []) as Array<Record<string, unknown>>).forEach((k) => {
    const emp = k.employees as Record<string, string> | undefined;
    const dept = emp?.department || "";
    if (!kpiScores[dept]) kpiScores[dept] = [];
    if (kpiScores[dept].length < 5) kpiScores[dept].push(Number(k.score) || 0);
  });

  const positions = Object.entries(byDept)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([dept, count]) => {
      const scores = kpiScores[dept] || [];
      const avgScore = scores.length > 0
        ? scores.reduce((s, n) => s + n, 0) / scores.length
        : 0;
      const readiness = avgScore > 0 ? Math.min(Math.round(avgScore), 100) : Math.min(count * 12, 90);
      const risk = readiness >= 75 ? "Low" : readiness >= 50 ? "Medium" : "High";
      return { dept, count, readiness, risk };
    });

  const totalCandidates = empList.length;
  const avgReadiness = positions.length > 0
    ? Math.round(positions.reduce((s, p) => s + p.readiness, 0) / positions.length)
    : 0;
  const atRisk = positions.filter((p) => p.risk !== "Low").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Succession Planning</h1>
          <p className="text-sm text-gray-500">Perencanaan suksesi berdasarkan data karyawan dan evaluasi kinerja</p>
        </div>
        <Link href="/hrd/succession/candidates"
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Plus size={14} /> Kelola Kandidat
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Crown size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Divisi Dipantau</p>
              <p className="text-xl font-extrabold text-slate-800">{positions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><UserCheck size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Karyawan</p>
              <p className="text-xl font-extrabold text-slate-800">{totalCandidates}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Shield size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Avg Readiness</p>
              <p className="text-xl font-extrabold text-slate-800">{avgReadiness}%</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Divisi Berisiko</p>
              <p className="text-xl font-extrabold text-slate-800">{atRisk}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Succession Overview per Divisi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Readiness dihitung dari rata-rata skor KPI terbaru per divisi</p>
        </div>

        {positions.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-sm text-slate-500">Belum ada data karyawan.</p>
            <p className="text-xs text-slate-400 mt-1">Tambahkan karyawan di menu Data Karyawan untuk melihat succession planning.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {positions.map((pos) => {
              const barColor = pos.readiness >= 75 ? "bg-emerald-500" : pos.readiness >= 50 ? "bg-amber-500" : "bg-red-500";
              const bgColor = pos.readiness >= 75 ? "bg-emerald-50 text-emerald-600" : pos.readiness >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600";
              return (
                <div key={pos.dept} className="p-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-xl ${bgColor} shrink-0`}>
                        <Users size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 text-sm">{pos.dept}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pos.risk === "Low" ? "bg-emerald-50 text-emerald-700" :
                            pos.risk === "Medium" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                          }`}>
                            Risk: {pos.risk}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-slate-400">Readiness:</span>
                          <div className="flex-1 max-w-[200px] h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pos.readiness}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-700">{pos.readiness}%</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          <span className="font-bold text-slate-600">{pos.count}</span> karyawan aktif di divisi ini
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {positions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-800">Catatan Metodologi</p>
            <p className="text-xs text-blue-700 mt-0.5">
              Readiness dihitung dari rata-rata skor KPI terbaru karyawan per divisi. Untuk succession planning yang lebih akurat,
              tambahkan data kandidat spesifik di menu <Link href="/hrd/succession/candidates" className="font-bold underline">Kandidat Suksesi</Link>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
