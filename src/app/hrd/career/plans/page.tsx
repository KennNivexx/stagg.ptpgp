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
    .select("*, employees(full_name, department, position)")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    plans = data || [];
  }

  return (
    <PlansClient
      employees={employees || []}
      initialPlans={plans}
    />
  );
}
