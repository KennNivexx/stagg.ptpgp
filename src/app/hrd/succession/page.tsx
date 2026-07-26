import { supabaseAdmin } from "@/lib/supabase";
import { Users, UserCheck, Shield, AlertTriangle, Crown, Plus } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { getLatestReadinessByEmployee } from "@/app/actions/succession";

export default async function HRDSuccession() {
  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, department, position, status")
    .neq("status", "Resigned");

  const empList = (employees || []) as Array<Record<string, string>>;

  const { data: kpiData } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("employee_id, score")
    .order("created_at", { ascending: false });

  const kpiByEmployee: Record<string, number[]> = {};
  ((kpiData || []) as Array<Record<string, unknown>>).forEach((k) => {
    const eid = k.employee_id as string;
    if (!kpiByEmployee[eid]) kpiByEmployee[eid] = [];
    if (kpiByEmployee[eid].length < 5) kpiByEmployee[eid].push(Number(k.score) || 0);
  });

  const readinessAssessments = await getLatestReadinessByEmployee();

  // Per-employee readiness: prefer a real succession assessment, else fall
  // back to the employee's average KPI score, else null (no fabricated number).
  const employeeReadiness: Record<string, number | null> = {};
  empList.forEach((e) => {
    if (e.id in readinessAssessments) {
      employeeReadiness[e.id] = readinessAssessments[e.id];
    } else if (kpiByEmployee[e.id]?.length > 0) {
      const scores = kpiByEmployee[e.id];
      employeeReadiness[e.id] = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
    } else {
      employeeReadiness[e.id] = null;
    }
  });

  const byDept: Record<string, string[]> = {};
  empList.forEach((e) => {
    if (e.department) {
      if (!byDept[e.department]) byDept[e.department] = [];
      byDept[e.department].push(e.id);
    }
  });

  const positions = Object.entries(byDept)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6)
    .map(([dept, empIds]) => {
      const withData = empIds.map((id) => employeeReadiness[id]).filter((v): v is number => v !== null);
      const hasData = withData.length > 0;
      const readiness = hasData ? Math.round(withData.reduce((s, n) => s + n, 0) / withData.length) : null;
      const risk = readiness === null ? null : readiness >= 75 ? "Low" : readiness >= 50 ? "Medium" : "High";
      return { dept, count: empIds.length, readiness, risk };
    });

  const totalCandidates = empList.length;
  const positionsWithData = positions.filter((p) => p.readiness !== null);
  const avgReadiness = positionsWithData.length > 0
    ? Math.round(positionsWithData.reduce((s, p) => s + (p.readiness as number), 0) / positionsWithData.length)
    : null;
  const atRisk = positions.filter((p) => p.risk === "Medium" || p.risk === "High").length;

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
              <p className="text-xl font-extrabold text-slate-800">{avgReadiness === null ? "-" : `${avgReadiness}%`}</p>
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
          <p className="text-xs text-slate-400 mt-0.5">Readiness diutamakan dari Penilaian Kesiapan suksesi, jika belum ada dipakai rata-rata skor KPI karyawan</p>
        </div>

        {positions.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Belum ada data karyawan."
            description="Tambahkan karyawan di menu Data Karyawan untuk melihat succession planning."
            action={{ label: "Tambah Karyawan", href: "/hrd/employees/new" }}
          />
        ) : (
          <div className="divide-y divide-slate-50">
            {positions.map((pos) => {
              const hasData = pos.readiness !== null;
              const barColor = !hasData ? "bg-slate-300" : pos.readiness! >= 75 ? "bg-emerald-500" : pos.readiness! >= 50 ? "bg-amber-500" : "bg-red-500";
              const bgColor = !hasData ? "bg-slate-50 text-slate-400" : pos.readiness! >= 75 ? "bg-emerald-50 text-emerald-600" : pos.readiness! >= 50 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600";
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
                          {pos.risk && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pos.risk === "Low" ? "bg-emerald-50 text-emerald-700" :
                              pos.risk === "Medium" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                            }`}>
                              Risk: {pos.risk}
                            </span>
                          )}
                        </div>
                        {hasData ? (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] text-slate-400">Readiness:</span>
                            <div className="flex-1 max-w-[200px] h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pos.readiness}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700">{pos.readiness}%</span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 italic mb-2">Data KPI belum tersedia</p>
                        )}
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
              Readiness per divisi dihitung dari rata-rata readiness karyawan: diutamakan dari Penilaian Kesiapan suksesi bila tersedia,
              jika belum dinilai dipakai rata-rata skor KPI karyawan. Divisi tanpa data KPI maupun penilaian kesiapan ditampilkan sebagai belum tersedia, bukan angka perkiraan.
              Untuk succession planning yang lebih akurat, tambahkan data kandidat spesifik di menu <Link href="/hrd/succession/candidates" className="font-bold underline">Kandidat Suksesi</Link>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
