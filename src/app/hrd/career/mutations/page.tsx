import { supabaseAdmin } from "@/lib/supabase";
import MutationsClient from "./MutationsClient";

export default async function MutationsPage() {
  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, kode, department, position")
    .neq("email", "superadmin@ptpgp.co.id")
    .limit(100);

  const { data: departments } = await supabaseAdmin
    .from("departemen")
    .select("name")
    .order("name");

  let mutations: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("mutasi_karir")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    const rows = data || [];
    const employeeIds = Array.from(new Set(rows.map((m) => m.employee_id as string).filter(Boolean)));
    const { data: rowEmployees } = employeeIds.length
      ? await supabaseAdmin.from("karyawan").select("id, full_name, department, position").in("id", employeeIds)
      : { data: [] as typeof employees };
    const employeeMap = new Map((rowEmployees || []).map((e) => [e.id, e]));
    mutations = rows.map((m) => ({ ...m, employees: employeeMap.get(m.employee_id as string) || null }));
  }

  return (
    <MutationsClient
      employees={employees || []}
      departments={departments || []}
      initialMutations={mutations}
    />
  );
}
