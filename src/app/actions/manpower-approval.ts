"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { updateRequestStatus } from "@/app/actions/requests";
import { resolveManagerDepartment } from "@/lib/dept-resolve";

/**
 * Manpower Request Approval Workflow — genuinely configurable (read from
 * manpower_approval_workflow, not hardcoded), matching the spec's own words:
 * "Approval Workflow bersifat dinamis dan dapat disesuaikan dengan struktur
 * organisasi masing-masing perusahaan." The default 4 steps map the spec's
 * named positions (Dept Head/Division Head/HRBP/HR Manager/Finance/Director/
 * CEO) onto roles that actually exist in this app — confirmed with the
 * client that those titles don't have separate accounts here. If the org
 * chart grows real Division Head/HRBP accounts later, HRD can add steps to
 * manpower_approval_workflow without a code change.
 */

interface WorkflowStepConfig { step_number: number; step_label: string; approver_role: string; approver_department: string | null }
interface ApprovalStep {
  step_number: number; step_label: string; approver_role: string; approver_department: string | null;
  status: string; approved_by: string | null; approved_at: string | null; notes: string | null;
}

export async function initManpowerApproval(requestId: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { data: existing } = await supabaseAdmin.from("manpower_approval_steps").select("id").eq("request_id", requestId).limit(1);
  if (existing && existing.length > 0) return { error: "Approval workflow untuk permintaan ini sudah dimulai." };

  const { data: config } = await supabaseAdmin.from("manpower_approval_workflow")
    .select("step_number, step_label, approver_role, approver_department").eq("is_active", true).order("step_number");
  const steps = (config || []) as WorkflowStepConfig[];
  if (steps.length === 0) return { error: "Approval Workflow belum dikonfigurasi. Hubungi Superadmin." };

  const { error } = await supabaseAdmin.from("manpower_approval_steps").insert(
    steps.map(s => ({
      id: "map-" + crypto.randomUUID(), request_id: requestId,
      step_number: s.step_number, step_label: s.step_label,
      approver_role: s.approver_role, approver_department: s.approver_department,
      status: "Pending",
    }))
  );
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260805001_manpower_approval_workflow.sql terlebih dahulu." };
  if (error) return { error: "Gagal memulai approval workflow." };

  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function getManpowerApprovalStatus(requestId: string): Promise<ApprovalStep[]> {
  await requireRole("hrd", "superadmin", "director", "department_manager");
  const { data } = await supabaseAdmin.from("manpower_approval_steps")
    .select("step_number, step_label, approver_role, approver_department, status, approved_by, approved_at, notes")
    .eq("request_id", requestId).order("step_number");
  return (data || []) as ApprovalStep[];
}

export async function getApprovalWorkflowConfig() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("manpower_approval_workflow").select("*").order("step_number");
  return data || [];
}

export async function decideManpowerApprovalStep(
  requestId: string, stepNumber: number, approved: boolean, notes?: string
): Promise<{ error: string } | { success: true }> {
  const { data: stepRow } = await supabaseAdmin.from("manpower_approval_steps")
    .select("approver_role, approver_department, status").eq("request_id", requestId).eq("step_number", stepNumber).maybeSingle();
  const step = stepRow as { approver_role: string; approver_department: string | null; status: string } | null;
  if (!step) return { error: "Tahap approval tidak ditemukan." };
  if (step.status !== "Pending") return { error: `Tahap ini sudah diputuskan sebelumnya (${step.status}).` };

  // Steps must be approved in order.
  const { data: earlierSteps } = await supabaseAdmin.from("manpower_approval_steps")
    .select("step_number, status").eq("request_id", requestId).lt("step_number", stepNumber);
  const blocked = (earlierSteps || []).find(s => s.status !== "Approved" && s.status !== "Skipped");
  if (blocked) return { error: `Tahap sebelumnya (langkah ${blocked.step_number}) belum disetujui.` };

  const user = await requireRole("hrd", "superadmin", "director", "department_manager");

  // Resolve who's actually allowed to act on this step. `approver_department`
  // scopes department_manager to a SPECIFIC department's head (e.g. Finance)
  // — otherwise department_manager means "head of the REQUESTING department".
  if (step.approver_role !== "superadmin" && user.role !== "superadmin") {
    if (step.approver_role !== user.role) {
      return { error: `Hanya role "${step.approver_role}" yang dapat memutuskan tahap "${step.approver_department ? step.approver_department + " " : ""}${step.approver_role}".` };
    }
    if (user.role === "department_manager") {
      const { data: reqRow } = await supabaseAdmin.from("permintaan_sdm").select("department").eq("id", requestId).maybeSingle();
      const requestDept = (reqRow as { department?: string } | null)?.department;
      const requiredDept = step.approver_department || requestDept;
      const myDept = await resolveManagerDepartment(user.email);
      if (!myDept || myDept !== requiredDept) {
        return { error: `Tahap ini butuh persetujuan Kepala Departemen ${requiredDept}, bukan ${myDept || "departemen Anda"}.` };
      }
    }
  }

  if (!approved && !(notes || "").trim()) return { error: "Alasan penolakan wajib diisi." };

  await supabaseAdmin.from("manpower_approval_steps").update({
    status: approved ? "Approved" : "Rejected",
    approved_by: user.name || user.email, approved_at: new Date().toISOString(),
    notes: notes || null,
  }).eq("request_id", requestId).eq("step_number", stepNumber);

  if (!approved) {
    // updateRequestStatus requires "hrd"/"superadmin"/"director" for
    // rejection — department_manager (a valid rejector at step 1) isn't in
    // that list, so reject the underlying request directly here instead of
    // routing through updateRequestStatus for this specific transition.
    await supabaseAdmin.from("permintaan_sdm").update({
      status: "Ditolak", rejection_reason: (notes || "").trim(), updated_at: new Date().toISOString(),
    }).eq("id", requestId);
    revalidatePath("/hrd/workforce/requests");
    return { success: true };
  }

  // Was this the last active step? If so, this approval finalizes the
  // request — reuse updateRequestStatus so headcount increment + vacancy
  // auto-creation (existing, tested logic) still fires exactly once.
  const { data: allSteps } = await supabaseAdmin.from("manpower_approval_steps")
    .select("step_number, status").eq("request_id", requestId).order("step_number", { ascending: false }).limit(1);
  const lastStep = (allSteps || [])[0] as { step_number: number } | undefined;
  if (lastStep && lastStep.step_number === stepNumber) {
    const finalizeRes = await updateRequestStatus(requestId, "Disetujui");
    if ("error" in finalizeRes) return finalizeRes;
  }

  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}
