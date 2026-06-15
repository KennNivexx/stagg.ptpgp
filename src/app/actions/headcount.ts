"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function updateHeadcount(departmentId: string, headcount: number) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("departments").update({ headcount }).eq("id", departmentId);
  revalidatePath("/hrd/workforce/headcount");
  return { success: true };
}

export async function syncAllHeadcounts() {
  await requireRole("hrd", "superadmin");
  const { data: employees } = await supabaseAdmin.from("employees").select("department").neq("status", "Inactive");
  const { data: departments } = await supabaseAdmin.from("departments").select("id, name");

  if (!departments) return { error: "No departments" };

  const counts: Record<string, number> = {};
  for (const e of (employees || [])) {
    const d = e.department as string;
    if (d) counts[d] = (counts[d] || 0) + 1;
  }

  for (const dept of departments) {
    const count = counts[dept.name] || 0;
    await supabaseAdmin.from("departments").update({ headcount: count }).eq("id", dept.id);
  }

  revalidatePath("/hrd/workforce/headcount");
  return { success: true };
}
