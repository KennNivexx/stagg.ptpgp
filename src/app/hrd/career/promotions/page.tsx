import { supabaseAdmin } from "@/lib/supabase";
import PromotionsClient from "./PromotionsClient";

export default async function PromotionsPage() {
  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("id, full_name, kode, department, position")
    .neq("email", "superadmin@ptpgp.co.id")
    .limit(100);

  let promotions: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("promosi_karir")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    const rows = data || [];
    const employeeIds = Array.from(new Set(rows.map((p) => p.employee_id as string).filter(Boolean)));
    const { data: rowEmployees } = employeeIds.length
      ? await supabaseAdmin.from("karyawan").select("id, full_name, department, position").in("id", employeeIds)
      : { data: [] as typeof employees };
    const employeeMap = new Map((rowEmployees || []).map((e) => [e.id, e]));
    promotions = rows.map((p) => ({ ...p, employees: employeeMap.get(p.employee_id as string) || null }));
  }

  return (
    <PromotionsClient
      employees={employees || []}
      initialPromotions={promotions}
    />
  );
}
