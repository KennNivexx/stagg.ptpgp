import { auditLog } from "@/lib/audit";
import { updateLeaveStatus } from "@/app/actions/leaves";
import { reviewKoreksi, reviewLembur } from "@/app/actions/workforce-time";
import { generatePayslip, generateBatchPayroll, updatePayrollStatus, batchUpdatePayrollStatus } from "@/app/actions/admin";
import { decideHiringApprovalStep, sendOfferLetter } from "@/app/actions/recruitment-hiring";

/**
 * The ONLY place allowed to call the real mutating actions behind the HRD
 * Copilot's write tools. Never imported by anything that handles raw LLM
 * tool-call output — src/lib/hrd-copilot-tools.ts's propose-handlers only
 * ever return an AWAITING_USER_CONFIRMATION payload, never call these
 * directly. This function is reached only from the deterministic
 * confirm-match code path in src/app/actions/hrd-copilot.ts, after the user
 * has explicitly confirmed (button click or a short, unambiguous Indonesian
 * affirmative) — the LLM itself can never trigger a call here.
 *
 * `args` is whatever the client echoed back from the last
 * AWAITING_USER_CONFIRMATION proposal — never trusted as the sole authority:
 * every underlying action re-derives/re-checks current DB state (status
 * still "Pending", sequential payroll/hiring-step transitions, etc.) before
 * mutating, so a stale or replayed confirmation can't double-apply.
 */
export async function executeConfirmedWriteAction(
  toolName: string,
  args: Record<string, string>,
  actor: { id: string; role: string; name: string; email: string }
): Promise<{ success: true; message: string } | { error: string }> {
  const description = args.description || "Tindakan";
  const result = await runWriteAction(toolName, args);

  if ("error" in result) {
    return { error: `❌ Gagal: ${result.error}` };
  }

  await auditLog({
    action: "ai_assistant.write_action",
    targetId: args.id || args.employee_id || args.application_id || undefined,
    targetName: description,
    performedBy: actor,
    detail: `[AI Assistant] ${description}. (tool: ${toolName})`,
  });

  return { success: true, message: `✅ Selesai: ${description}.${result.extra ? ` ${result.extra}` : ""}` };
}

/** Narrows any `{error: string} | {...}` action result without relying on
 * TS to infer a clean discriminated union from actions whose return types
 * aren't explicitly annotated at the source. */
function errorOf(res: unknown): string | null {
  const e = (res as { error?: unknown } | null)?.error;
  return typeof e === "string" ? e : null;
}

async function runWriteAction(
  toolName: string,
  args: Record<string, string>
): Promise<{ error: string } | { extra?: string }> {
  switch (toolName) {
    case "decide_leave_request": {
      const res = await updateLeaveStatus(args.id, args.status);
      const err = errorOf(res);
      return err ? { error: err } : {};
    }

    case "decide_overtime_request": {
      const res = await reviewLembur(args.id, args.approve === "true");
      const err = errorOf(res);
      return err ? { error: err } : {};
    }

    case "decide_absence_correction": {
      const res = await reviewKoreksi(args.id, args.approve === "true");
      const err = errorOf(res);
      return err ? { error: err } : {};
    }

    case "generate_payslip": {
      const fd = new FormData();
      fd.set("employee_id", args.employee_id);
      fd.set("month", args.month);
      fd.set("year", args.year);
      const res = await generatePayslip(fd);
      const err = errorOf(res);
      return err ? { error: err } : {};
    }

    case "generate_payroll_batch": {
      const fd = new FormData();
      fd.set("month", args.month);
      fd.set("year", args.year);
      const res = await generateBatchPayroll(fd);
      const err = errorOf(res);
      if (err) return { error: err };
      const r = res as { created: number; skipped: number; warnings?: string[] };
      return { extra: `(${r.created} dibuat, ${r.skipped} dilewati${r.warnings?.length ? `, ${r.warnings.length} peringatan` : ""})` };
    }

    case "decide_payroll_status": {
      const paymentMeta = args.payment_method
        ? { payment_method: args.payment_method, transfer_date: args.transfer_date || undefined, payment_reference: args.payment_reference || undefined, payment_notes: args.payment_notes || undefined }
        : undefined;
      if (args.scope === "batch") {
        const fd = new FormData();
        fd.set("month", args.month);
        fd.set("year", args.year);
        fd.set("status", args.target_status);
        const res = await batchUpdatePayrollStatus(fd, paymentMeta);
        const err = errorOf(res);
        if (err) return { error: err };
        const r = res as { updated: number };
        return { extra: `(${r.updated} baris diperbarui)` };
      }
      const res = await updatePayrollStatus(args.id, args.target_status, paymentMeta);
      const err = errorOf(res);
      return err ? { error: err } : {};
    }

    case "decide_hiring_step": {
      const res = await decideHiringApprovalStep(args.application_id, Number(args.step_number), args.decision === "Approved", args.notes || undefined);
      const err = errorOf(res);
      return err ? { error: err } : {};
    }

    case "send_offer_letter": {
      const res = await sendOfferLetter(args.application_id);
      const err = errorOf(res);
      if (err) return { error: err };
      const r = res as { warning?: string };
      return { extra: r.warning ? `(catatan: ${r.warning})` : undefined };
    }

    default:
      return { error: `Tool tidak dikenal: ${toolName}` };
  }
}
