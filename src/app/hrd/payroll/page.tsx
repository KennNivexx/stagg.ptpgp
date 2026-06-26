import { supabaseAdmin } from "@/lib/supabase";
import PayrollClient from "./PayrollClient";

export default async function HRDPayroll() {
  const [{ data: payrolls }, { data: employees }, { count: totalEmployees }] = await Promise.all([
    supabaseAdmin.from("payroll").select("*, employees!inner(full_name, department, position)").order("year", { ascending: false }).order("month", { ascending: false }).limit(50),
    supabaseAdmin.from("employees").select("id, full_name, department, position").neq("status", "Resigned").order("full_name"),
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }),
  ]);

  return (
    <PayrollClient
      payrolls={(payrolls || []) as Record<string, unknown>[]}
      employees={(employees || []) as { id: string; full_name: string; department: string; position: string }[]}
      totalEmployees={totalEmployees || 0}
    />
  );
}
