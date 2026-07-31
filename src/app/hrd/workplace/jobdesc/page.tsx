import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import JobDescClient from "./JobDescClient";

export const dynamic = "force-dynamic";

export default async function DeskripsiPekerjaan() {
  await requireRole("hrd", "superadmin");
  const { data: departments } = await supabaseAdmin.from("departemen").select("name").order("name");
  const deptList = (departments || []).map((d: Record<string, unknown>) => d.name as string);

  const { data: employees } = await supabaseAdmin.from("karyawan").select("position").neq("status", "Inactive");
  const positions = [...new Set((employees || []).map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];

  return <JobDescClient departments={deptList} positions={positions} />;
}
