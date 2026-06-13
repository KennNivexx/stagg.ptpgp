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
  | "org.update_unit"
  | "org.delete_unit"
  | "org.move_unit"
  | "settings.save";

export async function auditLog(params: {
  action: AuditAction;
  targetId?: string;
  targetName?: string;
  performedBy: { id: string; role: string; name: string; email: string };
  detail?: string;
}) {
  const { action, targetId, targetName, performedBy, detail } = params;

  supabaseAdmin
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
    ])
    .then(({ error }: { error: Error | null }) => {
      if (error) console.error("[audit] Failed to write audit log:", error.message);
    });
}
