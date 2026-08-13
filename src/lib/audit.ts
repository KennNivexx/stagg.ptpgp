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
  | "face.verify"
  | "account.purge_resigned"
  | "account.purge_rejected_applicant"
  | "orgsk.create"
  | "orgsk.update"
  | "orgsk.submit"
  | "orgsk.approve"
  | "orgsk.archive"
  | "jabatan.create"
  | "jabatan.update"
  | "jabatan.delete"
  | "grade.save"
  | "grade.delete"
  | "formasi.create"
  | "formasi.update"
  | "formasi.delete"
  | "formasi.assign"
  | "formasi.unassign"
  | "careerpath.save"
  | "careerpath.delete"
  | "ga.asset.create"
  | "ga.asset.update"
  | "ga.asset.repair_request"
  | "ga.asset.repair_decision"
  | "ga.peralatan.create"
  | "ga.peralatan.fpb_create"
  | "ga.peralatan.fpb_return"
  | "ga.peralatan.fpb_extend"
  | "ga.infrastruktur.create"
  | "ga.infrastruktur.maintenance_request"
  | "ga.infrastruktur.maintenance_update"
  | "ga.housekeeping.checklist_submit"
  | "ga.housekeeping.audit5r_submit"
  | "ga.housekeeping.nc_create"
  | "ga.housekeeping.nc_update"
  | "meeting.room_booking_status"
  | "meeting.notulen_approve"
  | "promotion.submit"
  | "promotion.approve"
  | "payroll.generate"
  | "payroll.edit"
  | "payroll.status_change"
  | "payroll.paid"
  | "kasbon.request"
  | "kasbon.approve"
  | "kasbon.reject"
  | "warning.issue"
  | "resignation.submit"
  | "hiring.approval_decision"
  | "offer.status_change"
  | "career.approval_decision"
  | "career.transaction_submit"
  | "case.status_change"
  | "case.pic_assign"
  | "er.approval_decision"
  | "training.certificate_issue"
  | "training.enrollment_result"
  | "kpi.status_change";

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
      .from("log_audit")
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
