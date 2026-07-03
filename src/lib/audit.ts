import { supabaseAdmin } from "@/lib/supabase";

export type AuditAction =
  | "employee.create"
  | "employee.update"
  | "employee.delete"
  | "employee.status_change"
  | "employee.password_reset"
  | "job.create"
  | "job.status_change"
  | "application.update"
  | "applicant.convert"
  | "leave.status_change"
  | "org.add_unit"
  | "org.add_department"
  | "org.update_unit"
  | "org.delete_unit"
  | "org.move_unit"
  | "settings.save"
  | "position.add"
  | "position.update"
  | "position.delete"
  | "jobdesc.save"
  | "jobdesc.delete"
  | "jobspec.save"
  | "jobspec.delete"
  | "headcount.update"
  | "headcount.sync"
  | "request.add"
  | "request.status_change"
  | "request.delete"
  | "attendance.clock_in"
  | "attendance.clock_out"
  | "leave.submit"
  | "leave.status_change"
  | "face.register"
  | "face.remove"
  | "face.change_request"
  | "face.verify";

export async function auditLog(params: {
  action: AuditAction;
  targetId?: string;
  targetName?: string;
  performedBy: { id: string; role: string; name: string; email: string };
  detail?: string;
}) {
  const { action, targetId, targetName, performedBy, detail } = params;

  try {
    const { error } = await supabaseAdmin
      .from("audit_logs")
      .insert([
        {
          action,
          target_id: targetId || null,
          target_name: targetName || null,
          performed_by_id: performedBy.id,
          performed_by_role: performedBy.role,
          performed_by_name: performedBy.name,
          performed_by_email: performedBy.email,
          detail: detail || null,
        },
      ]);
    if (error) {
      console.error("[audit] Failed to write audit log:", error.message);
    }
  } catch (err) {
    console.error("[audit] Unexpected audit log error:", (err as Error).message);
  }
}
