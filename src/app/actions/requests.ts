"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);

interface WorkforceRequest {
  id: string; department: string; position: string;
  quantity: number; reason: string; urgency: string; status: string;
  requested_by: string; created_at: string;
}

export async function getRequests(): Promise<WorkforceRequest[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("workforce_requests").select("*").order("created_at", { ascending: false });
  return (data as WorkforceRequest[]) || [];
}

export async function addRequest(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const department = (formData.get("department") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();
  const quantity = parseInt(formData.get("quantity") as string || "1");
  const urgency = (formData.get("urgency") as string || "Sedang").trim();
  const reason = (formData.get("reason") as string || "").trim();
  const requested_by = (formData.get("requested_by") as string || "").trim();

  if (!department || !position) return { error: "Departemen dan posisi wajib diisi." };

  const id = uid();
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("workforce_requests").insert({
    id, department, position, quantity, reason, urgency, status: "Pending", requested_by, created_at: now,
  });
  if (error) {
    console.error("addRequest error:", error);
    return { error: `Gagal: ${error.message || "Silakan coba lagi."}` };
  }

  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}

export async function updateRequestStatus(id: string, status: string) {
  await requireRole("hrd", "superadmin");

  await supabaseAdmin.from("workforce_requests").update({ status, updated_at: new Date().toISOString() }).eq("id", id);

  if (status === "Disetujui") {
    const { data: req } = await supabaseAdmin.from("workforce_requests").select("department, quantity").eq("id", id).maybeSingle();
    if (req) {
      const dept = req as { department: string; quantity: number };
      const { data: deptRow } = await supabaseAdmin.from("departments").select("id, headcount, name").eq("name", dept.department).maybeSingle();
      if (deptRow) {
        const row = deptRow as { id: string; headcount: number };
        const newHC = (row.headcount || 0) + dept.quantity;
        await supabaseAdmin.from("departments").update({ headcount: newHC }).eq("id", row.id);
      }
    }
  }

  revalidatePath("/hrd/workforce/requests");
  revalidatePath("/hrd/workforce/headcount");
  return { success: true };
}

export async function deleteRequest(id: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("workforce_requests").delete().eq("id", id);
  revalidatePath("/hrd/workforce/requests");
  return { success: true };
}
