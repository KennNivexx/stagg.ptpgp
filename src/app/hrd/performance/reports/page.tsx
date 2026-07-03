import { supabaseAdmin } from "@/lib/supabase";
import ReportsClient from "./ReportsClient";

export default async function PerformanceReportsPage() {
  const { data: evaluations } = await supabaseAdmin
    .from("kpi_evaluations")
    .select("*, employees!inner(full_name, department, position)")
    .limit(100);

  const rows = (evaluations || []) as Record<string, unknown>[];

  const totalEval = rows.length;

  const scored = rows.filter((e) => e.score != null);
  const avgScore = scored.length > 0
    ? scored.reduce((sum, e) => sum + (Number(e.score) || 0), 0) / scored.length
    : 0;

  const completed = rows.filter((e) => e.status === "Approved" || e.status === "Reviewed").length;

  const uniqueEmployees = new Set(rows.map((e) => e.employee_id)).size;

  const deptAcc: Record<string, { count: number; total: number; employees: Set<string> }> = {};
  rows.forEach((ev) => {
    const emp = ev.employees as Record<string, string> | undefined;
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
