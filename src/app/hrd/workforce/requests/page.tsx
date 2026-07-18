import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import RequestsClient from "./RequestsClient";
import { getRequestTypeOptions, getRequestReasonOptions } from "@/app/actions/manpower-validation";

export default async function PermintaanTenagaKerja() {
  const session = await requireRole("hrd", "superadmin", "director", "department_manager");

  const { data: departments } = await supabaseAdmin.from("departemen").select("name").order("name");
  const deptList = (departments || []).map((d: Record<string, unknown>) => d.name as string);

  const { data: employees } = await supabaseAdmin.from("karyawan").select("position").neq("status", "Inactive");
  const positions = [...new Set((employees || []).map((e: Record<string, unknown>) => e.position as string).filter(Boolean))];

  const [requestTypes, requestReasons] = await Promise.all([
    getRequestTypeOptions(),
    getRequestReasonOptions(),
  ]);

  return (
    <RequestsClient
      departments={deptList}
      positions={positions}
      userRole={session.role}
      userName={session.name}
      requestTypes={requestTypes}
      requestReasons={requestReasons}
    />
  );
}
