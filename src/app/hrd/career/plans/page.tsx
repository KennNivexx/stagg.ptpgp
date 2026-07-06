import { supabaseAdmin } from "@/lib/supabase";
import PlansClient from "./PlansClient";

export default async function CareerPlansPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  let plans: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("development_plans")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    const rows = data || [];
    const employeeIds = Array.from(new Set(rows.map((p) => p.employee_id as string).filter(Boolean)));
    const { data: rowEmployees } = employeeIds.length
      ? await supabaseAdmin.from("employees").select("id, full_name, department, position").in("id", employeeIds)
      : { data: [] as typeof employees };
    const employeeMap = new Map((rowEmployees || []).map((e) => [e.id, e]));
    plans = rows.map((p) => ({ ...p, employees: employeeMap.get(p.employee_id as string) || null }));
  }

  return (
    <PlansClient
      employees={employees || []}
      initialPlans={plans}
    />
  );
}
