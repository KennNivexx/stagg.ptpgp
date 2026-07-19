"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { RECRUITMENT_STAGES } from "@/lib/workforce-constants";
import { runManpowerValidation } from "@/app/actions/manpower-validation";
import { insertVacancyWithNumber } from "@/lib/vacancy";

const uid = () => "req-" + crypto.randomUUID();
const historyId = () => "wrh-" + crypto.randomUUID();

export interface DocumentEntry { name: string; url: string; uploaded_at: string }

interface WorkforceRequest {
  id: string; department: string; position: string;
  quantity: number; reason: string; urgency: string; status: string;
  requested_by: string; created_at: string;
  grade_code?: string; job_desc?: string;
  request_type?: string; need_by_date?: string; rejection_reason?: string;
  site_location?: string; cost_center?: string;
  salary_range_min?: number; salary_range_max?: number;
  budget_recruitment?: number; budget_available?: boolean; budget_approved_by?: string;
  kpi_jabatan?: string; document_urls?: DocumentEntry[];
  finance_required?: boolean; finance_approved?: boolean;
  finance_approved_by?: string; finance_approved_at?: string;
  recruitment_stage?: string; cancel_reason?: string; required_license?: string;
}

export interface RequestHistoryEntry {
  id: string; request_id: string; action: string;
  actor_name: string | null; actor_role: string | null;
  from_status: string | null; to_status: string | null;
  note: string | null; created_at: string;
}

async function logHistory(entry: {
  requestId: string; action: string; actorName?: string; actorRole?: string;
  fromStatus?: string | null; toStatus?: string | null; note?: string | null;
}) {
  await supabaseAdmin.from("riwayat_permintaan_sdm").insert({
    id: historyId(),
    request_id: entry.requestId,
    action: entry.action,
    actor_name: entry.actorName || null,
    actor_role: entry.actorRole || null,
    from_status: entry.fromStatus || null,
    to_status: entry.toStatus || null,
    note: entry.note || null,
  });
}

async function notify(userEmail: string, title: string, message: string, link: string) {
  if (!userEmail) return;
  try {
    await supabaseAdmin.from("notifikasi").insert({
      id: "ntf-" + crypto.randomUUID(),
      user_email: userEmail,
      title,
      message,
      link,
    });
  } catch {
    // Notifikasi bersifat pelengkap — kegagalan insert tidak boleh menggagalkan alur utama.
  }
}

async function getRequestOwnerEmail(department: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("karyawan").select("email").eq("department", department).limit(1).maybeSingle();
  return (data as { email?: string } | null)?.email || null;
}

export async function getRequests(params?: { status?: string; department?: string }): Promise<WorkforceRequest[]> {
  await requireRole("hrd", "superadmin", "director", "department_manager");

  let query = supabaseAdmin.from("permintaan_sdm").select("*").order("created_at", { ascending: false });

  if (params?.status) {
    query = query.eq("status", params.status);
  }
  if (params?.department) {
    query = query.eq("department", params.department);
  }

  const { data } = await query;
  return (data as WorkforceRequest[]) || [];
}

export async function getRequestHistory(requestId: string): Promise<RequestHistoryEntry[]> {
  await requireRole("hrd", "superadmin", "director", "department_manager");
  const { data } = await supabaseAdmin
    .from("riwayat_permintaan_sdm")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return (data as RequestHistoryEntry[]) || [];
}

function readRequestFields(formData: FormData) {
  return {
    department: (formData.get("department") as string || "").trim(),
    position: (formData.get("position") as string || "").trim(),
    quantity: parseInt(formData.get("quantity") as string || "1"),
    urgency: (formData.get("urgency") as string || "Sedang").trim(),
    reason: (formData.get("reason") as string || "").trim(),
    grade_code: (formData.get("grade_code") as string || "").trim() || null,
    job_desc: (formData.get("job_desc") as string || "").trim() || null,
    request_type: (formData.get("request_type") as string || "").trim() || null,
    need_by_date: (formData.get("need_by_date") as string || "").trim() || null,
    site_location: (formData.get("site_location") as string || "").trim() || null,
    cost_center: (formData.get("cost_center") as string || "").trim() || null,
    salary_range_min: formData.get("salary_range_min") ? parseFloat(formData.get("salary_range_min") as string) : null,
    salary_range_max: formData.get("salary_range_max") ? parseFloat(formData.get("salary_range_max") as string) : null,
    budget_recruitment: formData.get("budget_recruitment") ? parseFloat(formData.get("budget_recruitment") as string) : null,
    budget_available: formData.get("budget_available") === "on" || formData.get("budget_available") === "true",
    budget_approved_by: (formData.get("budget_approved_by") as string || "").trim() || null,
    kpi_jabatan: (formData.get("kpi_jabatan") as string || "").trim() || null,
    required_license: (formData.get("required_license") as string || "").trim() || null,
    request_type_id: (formData.get("request_type_id") as string || "").trim() || null,
    reason_category_id: (formData.get("reason_category_id") as string || "").trim() || null,
    employment_type_id: (formData.get("employment_type_id") as string || "").trim() || null,
  };
}

export async function addRequest(formData: FormData, asDraft?: boolean): Promise<{ error: string } | { success: true; id: string }> {
  const user = await requireRole("department_manager", "hrd", "superadmin");
  const f = readRequestFields(formData);
  const requested_by = (formData.get("requested_by") as string || "").trim() || user.name || user.email;

  if (!asDraft && (!f.department || !f.position)) return { error: "Departemen dan posisi wajib diisi." };

  const id = uid();
  const now = new Date().toISOString();
  const status = asDraft ? "Draft" : "Pending";
  const { error } = await supabaseAdmin.from("permintaan_sdm").insert({
    id, ...f, requested_by, status, created_at: now,
  });
  if (error) {
    console.error("[requests] addRequest error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  await logHistory({
    requestId: id,
    action: asDraft ? "Disimpan sebagai Draft" : "Diajukan",
    actorName: user.name || user.email,
    actorRole: user.role,
    toStatus: status,
  });

  // Run the rule-based Validation Engine as soon as a real (non-draft)
  // request exists — HRD/Director should see Position/Org/Budget/Headcount/
  // Internal Mobility/Succession checks before deciding on approval.
  if (!asDraft) await runManpowerValidation(id);

  revalidatePath("/hrd/workforce/requests");
  revalidatePath("/department");
  return { success: true, id };
}

export async function editRequest(id: string, formData: FormData, resubmit?: boolean): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("department_manager", "hrd", "superadmin");

  const { data: current } = await supabaseAdmin.from("permintaan_sdm").select("status, department").eq("id", id).maybeSingle();
  const cur = current as { status?: string; department?: string } | null;
  if (!cur) return { error: "Permintaan tidak ditemukan." };
  if (!["Draft", "Ditolak"].includes(cur.status || "")) {
    return { error: "Hanya permintaan berstatus Draft atau Ditolak yang bisa direvisi." };
  }
  if (user.role === "department_manager") {
    const { data: emp } = await supabaseAdmin.from("karyawan").select("department").eq("email", user.email).maybeSingle();
    const myDept = (emp as { department?: string } | null)?.department;
    if (!myDept || myDept !== cur.department) return { error: "Akses ditolak: bukan departemen Anda." };
  }

  const f = readRequestFields(formData);
  if (!f.department || !f.position) return { error: "Departemen dan posisi wajib diisi." };

  const newStatus = resubmit ? "Pending" : "Draft";
  const { error } = await supabaseAdmin.from("permintaan_sdm").update({
    ...f, status: newStatus, rejection_reason: resubmit ? null : undefined, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: "Gagal memproses. Silakan coba lagi." };

  await logHistory({
    requestId: id,
    action: resubmit ? "Direvisi & Diajukan Ulang" : "Direvisi",
    actorName: user.name || user.email,
    actorRole: user.role,
    fromStatus: cur.status,
    toStatus: newStatus,
  });

  if (resubmit) await runManpowerValidation(id);

  revalidatePath("/hrd/workforce/requests");
  revalidatePath("/department");
  return { success: true };
}

export async function cloneRequest(id: string): Promise<{ error: string } | { success: true; id: string }> {
  const user = await requireRole("department_manager", "hrd", "superadmin");
  const { data } = await supabaseAdmin.from("permintaan_sdm").select("*").eq("id", id).maybeSingle();
  const src = data as WorkforceRequest | null;
  if (!src) return { error: "Permintaan tidak ditemukan." };

  const newId = uid();
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("permintaan_sdm").insert({
    id: newId, department: src.department, position: src.position, quantity: src.quantity,
    reason: src.reason, urgency: src.urgency, status: "Draft",
    requested_by: user.name || user.email, grade_code: src.grade_code, job_desc: src.job_desc,
    request_type: src.request_type, need_by_date: null, site_location: src.site_location,
    cost_center: src.cost_center, salary_range_min: src.salary_range_min, salary_range_max: src.salary_range_max,
    budget_recruitment: src.budget_recruitment, budget_available: false, kpi_jabatan: src.kpi_jabatan,
    created_at: now,
  });
  if (error) { console.error("[requests] cloneRequest error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }

  await logHistory({ requestId: newId, action: `Duplikat dari ${id}`, actorName: user.name || user.email, actorRole: user.role, toStatus: "Draft" });

  revalidatePath("/hrd/workforce/requests");
  revalidatePath("/department");
  return { success: true, id: newId };
}

export async function cancelRequest(id: string, reason: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("department_manager", "hrd", "superadmin");
  const { data: current } = await supabaseAdmin.from("permintaan_sdm").select("status").eq("id", id).maybeSingle();
  const status = (current as { status?: string } | null)?.status;
  if (!status || !["Draft", "Pending", "Menunggu Finance", "Direview Direktur"].includes(status)) {
    return { error: "Permintaan ini sudah tidak bisa dibatalkan." };
  }

  const { error } = await supabaseAdmin.from("permintaan_sdm").update({
    status: "Dibatalkan", cancel_reason: reason.trim() || null, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { error: "Gagal memproses. Silakan coba lagi." };

  await logHistory({ requestId: id, action: "Dibatalkan", actorName: user.name || user.email, actorRole: user.role, fromStatus: status, toStatus: "Dibatalkan", note: reason || undefined });

  revalidatePath("/hrd/workforce/requests");
  revalidatePath("/department");
  return { success: true };
}

export async function setFinanceRequired(id: string, required: boolean): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("permintaan_sdm").update({ finance_required: required }).eq("id", id);
  await logHistory({ requestId: id, action: required ? "Approval Finance diaktifkan" : "Approval Finance dinonaktifkan", actorName: user.name || user.email, actorRole: user.role });
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function approveFinance(id: string, approved: boolean, note?: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "director", "superadmin");
  if (!approved && !(note || "").trim()) return { error: "Alasan penolakan Finance wajib diisi." };

  if (approved) {
    await supabaseAdmin.from("permintaan_sdm").update({
      finance_approved: true, finance_approved_by: user.name || user.email, finance_approved_at: new Date().toISOString(),
    }).eq("id", id);
    await logHistory({ requestId: id, action: "Finance Disetujui", actorName: user.name || user.email, actorRole: user.role });
  } else {
    await supabaseAdmin.from("permintaan_sdm").update({
      status: "Ditolak", rejection_reason: (note || "").trim(), updated_at: new Date().toISOString(),
    }).eq("id", id);
    await logHistory({ requestId: id, action: "Ditolak oleh Finance", actorName: user.name || user.email, actorRole: user.role, toStatus: "Ditolak", note: (note || "").trim() });
  }
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function advanceRecruitmentStage(id: string, stage: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  if (!RECRUITMENT_STAGES.includes(stage)) return { error: "Tahap tidak dikenal." };

  await supabaseAdmin.from("permintaan_sdm").update({ recruitment_stage: stage, updated_at: new Date().toISOString() }).eq("id", id);
  await logHistory({ requestId: id, action: `Progres Rekrutmen: ${stage}`, actorName: user.name || user.email, actorRole: user.role });
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function addRequestDocument(id: string, doc: { name: string; url: string }): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("department_manager", "hrd", "superadmin");
  const { data } = await supabaseAdmin.from("permintaan_sdm").select("document_urls").eq("id", id).maybeSingle();
  const existing = ((data as { document_urls?: DocumentEntry[] } | null)?.document_urls) || [];
  const updated = [...existing, { name: doc.name, url: doc.url, uploaded_at: new Date().toISOString() }];

  const { error } = await supabaseAdmin.from("permintaan_sdm").update({ document_urls: updated }).eq("id", id);
  if (error) return { error: "Gagal mengunggah dokumen." };
  await logHistory({ requestId: id, action: `Dokumen diunggah: ${doc.name}`, actorName: user.name || user.email, actorRole: user.role });
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function removeRequestDocument(id: string, url: string): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("permintaan_sdm").select("document_urls").eq("id", id).maybeSingle();
  const existing = ((data as { document_urls?: DocumentEntry[] } | null)?.document_urls) || [];
  const updated = existing.filter(d => d.url !== url);

  await supabaseAdmin.from("permintaan_sdm").update({ document_urls: updated }).eq("id", id);
  await logHistory({ requestId: id, action: "Dokumen dihapus", actorName: user.name || user.email, actorRole: user.role });
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function updateRequestStatus(id: string, status: string, note?: string): Promise<{ error: string } | { success: true }> {
  // Only Director can approve (Setujui)
  const user = status === "Disetujui"
    ? await requireRole("director", "superadmin")
    : await requireRole("hrd", "superadmin", "director");

  if (status === "Ditolak" && !(note || "").trim()) {
    return { error: "Alasan penolakan wajib diisi." };
  }

  // Guard against double-approval (double-click, network retry, etc.) — without
  // this check, re-approving an already-"Disetujui" request would increment
  // headcount a second time for the same request.
  const { data: current } = await supabaseAdmin.from("permintaan_sdm").select("status, finance_required, finance_approved, department").eq("id", id).maybeSingle();
  const cur = current as { status?: string; finance_required?: boolean; finance_approved?: boolean; department?: string } | null;
  const previousStatus = cur?.status;
  if (status === "Disetujui" && previousStatus === "Disetujui") {
    return { error: "Permintaan ini sudah disetujui sebelumnya." };
  }
  if (status === "Disetujui" && cur?.finance_required && !cur?.finance_approved) {
    return { error: "Menunggu approval Finance Controller terlebih dahulu." };
  }

  const updatePayload: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === "Ditolak") updatePayload.rejection_reason = (note || "").trim();

  await supabaseAdmin.from("permintaan_sdm").update(updatePayload).eq("id", id);

  await logHistory({
    requestId: id,
    action: status === "Disetujui" ? "Disetujui" : status === "Ditolak" ? "Ditolak" : "Diteruskan",
    actorName: user.name || user.email,
    actorRole: user.role,
    fromStatus: previousStatus || null,
    toStatus: status,
    note: status === "Ditolak" ? (note || "").trim() : undefined,
  });

  if (cur?.department) {
    const ownerEmail = await getRequestOwnerEmail(cur.department);
    if (ownerEmail) {
      if (status === "Disetujui") await notify(ownerEmail, "Permintaan SDM Disetujui", `Permintaan untuk ${cur.department} telah disetujui.`, "/department");
      else if (status === "Ditolak") await notify(ownerEmail, "Permintaan SDM Ditolak", note ? `Alasan: ${note}` : "Permintaan ditolak.", "/department");
      else if (status === "Direview Direktur") await notify(ownerEmail, "Permintaan SDM Diteruskan", "Permintaan Anda sedang direview Direktur.", "/department");
    }
  }

  if (status === "Disetujui") {
    const { data: req } = await supabaseAdmin.from("permintaan_sdm")
      .select("department, quantity, position, request_type_id, job_desc").eq("id", id).maybeSingle();
    if (req) {
      const dept = req as { department: string; quantity: number; position: string; request_type_id: string | null; job_desc: string | null };
      // Atomic headcount increment via RPC or raw SQL increment
      const { error: hcError } = await supabaseAdmin.rpc("increment_headcount", {
        dept_name: dept.department,
        amount: dept.quantity,
      });
      if (hcError) {
        // Fallback: update directly if RPC not available. Read-then-write isn't
        // atomic, so guard against a lost update under concurrent approvals by
        // only writing if headcount still matches what we just read — if another
        // approval landed in between, retry once against the fresh value instead
        // of silently dropping one increment.
        for (let attempt = 0; attempt < 2; attempt++) {
          const { data: deptRow } = await supabaseAdmin.from("departemen").select("id, headcount, name").eq("name", dept.department).maybeSingle();
          if (!deptRow) break;
          const row = deptRow as { id: string; headcount: number };
          const newHC = (row.headcount || 0) + dept.quantity;
          const { data: updated } = await supabaseAdmin
            .from("departemen")
            .update({ headcount: newHC })
            .eq("id", row.id)
            .eq("headcount", row.headcount)
            .select("id");
          if (updated && updated.length > 0) break;
        }
      }

      // Post-approval automation: an approved request whose type is flagged
      // "triggers_recruitment" auto-creates the vacancy — no manual re-entry
      // into the Recruitment module needed. Guarded against re-running (e.g.
      // a retried request) by checking no vacancy already links this request.
      if (dept.request_type_id) {
        const { data: typeRow } = await supabaseAdmin.from("jenis_permintaan_sdm")
          .select("triggers_recruitment").eq("id", dept.request_type_id).maybeSingle();
        const triggers = (typeRow as { triggers_recruitment?: boolean } | null)?.triggers_recruitment;
        if (triggers) {
          const { data: existingVacancy } = await supabaseAdmin.from("lowongan_kerja")
            .select("id").eq("manpower_request_id", id).maybeSingle();
          if (!existingVacancy) {
            await insertVacancyWithNumber({
              id: "job-" + crypto.randomUUID(),
              title: dept.position, position: dept.position, department: dept.department,
              status: "Open", description: dept.job_desc || null,
              quantity: dept.quantity, quantity_filled: 0,
              manpower_request_id: id,
              created_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    revalidatePath("/hrd/workforce/requests");
    revalidatePath("/hrd/workforce/headcount");
    revalidatePath("/hrd/recruitment");
    return { success: true };
  }

  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function deleteRequest(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("permintaan_sdm").delete().eq("id", id);
  if (error) { console.error("[requests] deleteRequest error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function bulkImportRequests(rows: Array<{
  department: string; position: string; quantity?: number; urgency?: string;
  reason?: string; request_type?: string; need_by_date?: string;
}>): Promise<{ error: string } | { success: true; imported: number; failed: number }> {
  const user = await requireRole("hrd", "superadmin");
  let imported = 0, failed = 0;
  const now = new Date().toISOString();

  for (const row of rows) {
    const department = (row.department || "").trim();
    const position = (row.position || "").trim();
    if (!department || !position) { failed++; continue; }

    const id = uid();
    const { error } = await supabaseAdmin.from("permintaan_sdm").insert({
      id, department, position,
      quantity: row.quantity || 1,
      urgency: row.urgency || "Sedang",
      reason: row.reason || "",
      request_type: row.request_type || null,
      need_by_date: row.need_by_date || null,
      status: "Draft",
      requested_by: user.name || user.email,
      created_at: now,
    });
    if (error) { failed++; continue; }
    await logHistory({ requestId: id, action: "Diimpor dari Excel", actorName: user.name || user.email, actorRole: user.role, toStatus: "Draft" });
    imported++;
  }

  revalidatePath("/hrd/workforce/requests");
  return { success: true, imported, failed };
}
