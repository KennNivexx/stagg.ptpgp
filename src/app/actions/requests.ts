"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "req-" + crypto.randomUUID();

interface WorkforceRequest {
  id: string; department: string; position: string;
  quantity: number; reason: string; urgency: string; status: string;
  requested_by: string; created_at: string;
  grade_code?: string; job_desc?: string;
}

export async function getRequests(params?: { status?: string; department?: string }): Promise<WorkforceRequest[]> {
  await requireRole("hrd", "superadmin", "director", "department_manager");

  let query = supabaseAdmin.from("workforce_requests").select("*").order("created_at", { ascending: false });

  if (params?.status) {
    query = query.eq("status", params.status);
  }
  if (params?.department) {
    query = query.eq("department", params.department);
  }

  const { data } = await query;
  return (data as WorkforceRequest[]) || [];
}

export async function addRequest(formData: FormData) {
  await requireRole("department_manager", "superadmin");

  const department = (formData.get("department") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();
  const quantity = parseInt(formData.get("quantity") as string || "1");
  const urgency = (formData.get("urgency") as string || "Sedang").trim();
  const reason = (formData.get("reason") as string || "").trim();
  const requested_by = (formData.get("requested_by") as string || "").trim();
  const grade_code = (formData.get("grade_code") as string || "").trim() || null;
  const job_desc = (formData.get("job_desc") as string || "").trim() || null;

  if (!department || !position) return { error: "Departemen dan posisi wajib diisi." };

  const id = uid();
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("workforce_requests").insert({
    id, department, position, quantity, reason, urgency, status: "Pending",
    requested_by, grade_code, job_desc, created_at: now,
  });
  if (error) {
    console.error("[requests] addRequest error:", error.message);
    return { error: "Gagal memproses. Silakan coba lagi." };
  }

  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function updateRequestStatus(id: string, status: string) {
  // Only Director can approve (Setujui)
  if (status === "Disetujui") {
    await requireRole("director", "superadmin");
  } else {
    // HRD & Director can forward/reject
    await requireRole("hrd", "superadmin", "director");
  }

  // Guard against double-approval (double-click, network retry, etc.) — without
  // this check, re-approving an already-"Disetujui" request would increment
  // headcount a second time for the same request.
  if (status === "Disetujui") {
    const { data: existing } = await supabaseAdmin.from("workforce_requests").select("status").eq("id", id).maybeSingle();
    if ((existing as { status?: string } | null)?.status === "Disetujui") {
      return { error: "Permintaan ini sudah disetujui sebelumnya." };
    }
  }

  await supabaseAdmin.from("workforce_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);

  if (status === "Disetujui") {
    const { data: req } = await supabaseAdmin.from("workforce_requests").select("department, quantity").eq("id", id).maybeSingle();
    if (req) {
      const dept = req as { department: string; quantity: number };
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
          const { data: deptRow } = await supabaseAdmin.from("departments").select("id, headcount, name").eq("name", dept.department).maybeSingle();
          if (!deptRow) break;
          const row = deptRow as { id: string; headcount: number };
          const newHC = (row.headcount || 0) + dept.quantity;
          const { data: updated } = await supabaseAdmin
            .from("departments")
            .update({ headcount: newHC })
            .eq("id", row.id)
            .eq("headcount", row.headcount)
            .select("id");
          if (updated && updated.length > 0) break;
        }
      }
    }

    revalidatePath("/hrd/workforce/requests");
    revalidatePath("/hrd/workforce/headcount");
    return { success: true };
  }

  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function deleteRequest(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("workforce_requests").delete().eq("id", id);
  if (error) { console.error("[requests] deleteRequest error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}
