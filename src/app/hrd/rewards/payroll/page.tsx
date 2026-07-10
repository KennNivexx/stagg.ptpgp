import { supabaseAdmin } from "@/lib/supabase";
import PayrollClient from "../../payroll/PayrollClient";

export default async function PayrollPage() {
  const [{ data: payrolls }, { data: employees }, { count: totalEmployees }] = await Promise.all([
    supabaseAdmin.from("penggajian").select("*, karyawan!inner(full_name, department, position)").order("year", { ascending: false }).order("month", { ascending: false }).limit(50),
    supabaseAdmin.from("karyawan").select("id, full_name, department, position").neq("status", "Resigned").order("full_name"),
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }),
  ]);

  return (
    <PayrollClient
      payrolls={(payrolls || []) as Record<string, unknown>[]}
      employees={(employees || []) as { id: string; full_name: string; department: string; position: string }[]}
      totalEmployees={totalEmployees || 0}
    />
  );
}
