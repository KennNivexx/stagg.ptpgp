import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import KPIClient from "./KPIClient";

export default async function HRDKPI() {
  await requireRole("hrd", "superadmin", "department_manager");
  const { data: evaluations } = await supabaseAdmin
    .from("evaluasi_kpi")
    .select("*, karyawan!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, department, position")
    .neq("email", "__settings__@ptpgp.co.id")
    .order("full_name")
    .limit(100);

  const withScore = (evaluations || []).filter((e: Record<string, unknown>) => e.score != null);
  const avgScore = withScore.length > 0
    ? withScore.reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.score) || 0), 0) / withScore.length
    : 0;

  return (
    <KPIClient
      evaluations={(evaluations || []) as Parameters<typeof KPIClient>[0]["evaluations"]}
      employees={(employees || []) as Parameters<typeof KPIClient>[0]["employees"]}
      avgScore={avgScore}
    />
  );
}
