"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

// Headcount is auto-calculated. No manual edit allowed.
// Formula: current employees + approved workforce requests

export interface DeptHC {
  id: string; name: string; current: number; approved: number;
}

export async function getHeadcountData(): Promise<DeptHC[]> {
  await requireRole("hrd", "superadmin");

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, department, status")
    .neq("email", "__settings__@ptpgp.co.id");

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("id, name, headcount")
    .order("name");

  const deptList = (departments || []).length > 0
    ? (departments as Record<string, unknown>[]).map((d) => ({
        name: d.name as string,
        id: d.id as string,
        planned: Number(d.headcount) || 0,
      }))
    : [...new Set((employees || []).map((e: Record<string, unknown>) => e.department as string))]
        .filter(Boolean)
        .map((name) => ({ name, id: name, planned: 0 }));

  return deptList.map((dept) => {
    const current = (employees || []).filter((e: Record<string, unknown>) =>
      e.department === dept.name && e.status !== "Inactive"
    ).length;
    return {
      id: dept.id,
      name: dept.name,
      current,
      // No fallback to `current` — a department that hasn't been synced yet
      // (headcount still 0) should show as 0/"belum diatur", not a misleading
      // full quota.
      approved: dept.planned > 0 ? dept.planned : 0,
    };
  }).sort((a, b) => b.current - a.current || a.name.localeCompare(b.name));
}

export async function syncAllHeadcounts() {
  await requireRole("hrd", "superadmin");
  
  const { data: employees } = await supabaseAdmin.from("employees").select("department").neq("status", "Inactive");
  const { data: departments } = await supabaseAdmin.from("departments").select("id, name");
  const { data: approvedRequests } = await supabaseAdmin.from("workforce_requests").select("department, quantity").eq("status", "Disetujui");

  if (!departments) return { error: "No departments" };

  const counts: Record<string, number> = {};
  for (const e of (employees || [])) {
    const d = e.department as string;
    if (d) counts[d] = (counts[d] || 0) + 1;
  }

  // Add approved request quantities
  for (const r of (approvedRequests || [])) {
    const d = r.department as string;
    if (d) counts[d] = (counts[d] || 0) + (Number(r.quantity) || 0);
  }

  for (const dept of departments) {
    const count = counts[dept.name] || 0;
    await supabaseAdmin.from("departments").update({ headcount: count }).eq("id", dept.id);
  }

  revalidatePath("/hrd/workforce/headcount");
  return { success: true };
}
