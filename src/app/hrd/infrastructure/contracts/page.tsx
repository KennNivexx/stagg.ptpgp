import { supabaseAdmin } from "@/lib/supabase";
import ContractsClient from "./ContractsClient";

export default async function ManajemenKontrakKerja() {
  const [empRes, ctrRes] = await Promise.all([
    supabaseAdmin
      .from("employees")
      .select("id, full_name, department, position, status, join_date, phone")
      .not("status", "eq", "Resigned")
      .order("full_name"),
    supabaseAdmin
      .from("employee_contracts")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <ContractsClient
      employees={(empRes.data || []) as Record<string, string>[]}
      contracts={(ctrRes.data || []) as Record<string, string>[]}
    />
  );
}
