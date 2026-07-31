import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import ReportsClient from "./ReportsClient";

export const dynamic = "force-dynamic";

/** Fetches every kpi_evaluations row (not capped at a single page), so
 * reporting stats and the Excel export reflect the full dataset regardless
 * of how many evaluations exist. */
async function fetchAllKpiEvaluations(): Promise<Record<string, unknown>[]> {
  const pageSize = 1000;
  const all: Record<string, unknown>[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabaseAdmin
      .from("evaluasi_kpi")
      .select("*, karyawan!inner(full_name, department, position)")
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) {
      console.error("[performance/reports] fetchAllKpiEvaluations error:", error.message);
      break;
    }
    all.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

export default async function PerformanceReportsPage() {
  await requireRole("hrd", "superadmin");
  const rows = await fetchAllKpiEvaluations();

  const totalEval = rows.length;

  const scored = rows.filter((e) => e.score != null);
  const avgScore = scored.length > 0
    ? scored.reduce((sum, e) => sum + (Number(e.score) || 0), 0) / scored.length
    : 0;

  const completed = rows.filter((e) => e.status === "Approved" || e.status === "Reviewed").length;

  const uniqueEmployees = new Set(rows.map((e) => e.employee_id)).size;

  const deptAcc: Record<string, { count: number; total: number; employees: Set<string> }> = {};
  rows.forEach((ev) => {
    const emp = ev.karyawan as Record<string, string> | undefined;
    const dept = emp?.department || "Lainnya";
    if (!deptAcc[dept]) deptAcc[dept] = { count: 0, total: 0, employees: new Set() };
    deptAcc[dept].count++;
    deptAcc[dept].total += Number(ev.score) || 0;
    deptAcc[dept].employees.add(ev.employee_id as string);
  });

  const deptBreakdown = Object.entries(deptAcc).map(([dept, d]) => ({
    dept,
    count: d.count,
    avg: d.count > 0 ? Math.round((d.total / d.count) * 10) / 10 : 0,
    employeeCount: d.employees.size,
  }));

  return (
    <ReportsClient
      evaluations={rows}
      totalEval={totalEval}
      avgScore={avgScore}
      completed={completed}
      uniqueEmployees={uniqueEmployees}
      deptBreakdown={deptBreakdown}
    />
  );
}
