import { supabaseAdmin } from "@/lib/supabase";
import MutationsClient from "./MutationsClient";

export default async function MutationsPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");

  let mutations: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("career_mutations")
    .select("*, employees(full_name, department, position)")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    mutations = data || [];
  }

  return (
    <MutationsClient
      employees={employees || []}
      departments={departments || []}
      initialMutations={mutations}
    />
  );
}
