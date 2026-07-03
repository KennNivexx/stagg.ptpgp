import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import RequestsClient from "./RequestsClient";

export default async function PermintaanTenagaKerja() {
  const session = await requireRole("hrd", "superadmin", "director", "department_manager");

  const { data: departments } = await supabaseAdmin.from("departments").select("name").order("name");
  const deptList = (departments || []).map((d: Record<string, unknown>) => d.name as string);

  const { data: employees } = await supabaseAdmin.from("employees").select("position").neq("status", "Inactive");
  const positions = [...new Set((employees || []).map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];

  return (
    <RequestsClient
      departments={deptList}
      positions={positions}
      userRole={session.role}
      userName={session.name}
    />
  );
}
