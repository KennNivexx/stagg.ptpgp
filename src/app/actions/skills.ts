"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function getDeptEmployees(deptName: string) {
  await requireRole("department_manager", "superadmin", "hrd");

  const { data, error } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .eq("department", deptName)
    .neq("status", "Inactive")
    .order("full_name");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getSkills() {
  await requireRole("department_manager", "superadmin", "hrd", "director", "employee");

  const { data, error } = await supabaseAdmin
    .from("skills")
    .select("*")
    .order("category")
    .order("name");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getEmployeeSkills(employeeIds: string[]) {
  if (!employeeIds.length) return [];

  await requireRole("department_manager", "superadmin", "hrd");

  const { data, error } = await supabaseAdmin
    .from("employee_skills")
    .select("*")
    .in("employee_id", employeeIds);

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPositionSkills() {
  await requireRole("department_manager", "superadmin", "hrd", "director", "employee");

  const { data, error } = await supabaseAdmin
    .from("position_skills")
    .select("*");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function assessEmployee(
  employeeId: string,
  skills: { skill_id: string; current_level: number }[]
) {
  await requireRole("department_manager", "superadmin", "hrd");

  const now = new Date().toISOString();

  for (const sk of skills) {
    const { data: existing } = await supabaseAdmin
      .from("employee_skills")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("skill_id", sk.skill_id)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("employee_skills")
        .update({ current_level: sk.current_level, updated_at: now })
        .eq("id", (existing as { id: string }).id);
    } else {
      await supabaseAdmin.from("employee_skills").insert({
        employee_id: employeeId,
        skill_id: sk.skill_id,
        current_level: sk.current_level,
        created_at: now,
        updated_at: now,
      });
    }
  }

  revalidatePath("/department/competency");
  return { success: true };
}

const suid = () => "sk-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

export async function saveSkill(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const name = (formData.get("name") as string || "").trim();
  const category = (formData.get("category") as string || "").trim();

  if (!name || !category) return { error: "Nama dan kategori skill wajib diisi." };

  const now = new Date().toISOString();
  if (id) {
    const { error } = await supabaseAdmin.from("skills").update({ name, category, updated_at: now }).eq("id", id);
    if (error) return { error: "Gagal mengupdate skill." };
  } else {
    const { error } = await supabaseAdmin.from("skills").insert({
      id: suid(), name, category, created_at: now, updated_at: now,
    });
    if (error) return { error: "Gagal menambah skill." };
  }

  revalidatePath("/hrd/competency/library");
  return { success: true };
}

export async function deleteSkill(id: string) {
  await requireRole("hrd", "superadmin");

  if (!id) return { error: "ID skill wajib diisi." };

  await supabaseAdmin.from("position_skills").delete().eq("skill_id", id);
  await supabaseAdmin.from("employee_skills").delete().eq("skill_id", id);
  const { error } = await supabaseAdmin.from("skills").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus skill." };

  revalidatePath("/hrd/competency/library");
  return { success: true };
}

export async function saveRequiredLevel(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const position = (formData.get("position") as string || "").trim();
  const skill_id = (formData.get("skill_id") as string || "").trim();
  const required_level = parseInt(formData.get("required_level") as string || "0");

  if (!position || !skill_id) return { error: "Posisi dan skill wajib diisi." };

  const { data: existing } = await supabaseAdmin
    .from("position_skills")
    .select("id")
    .eq("position", position)
    .eq("skill_id", skill_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin.from("position_skills")
      .update({ required_level })
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: "Gagal mengupdate level." };
  } else {
    const { error } = await supabaseAdmin.from("position_skills").insert({
      id: "ps-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      position, skill_id, required_level,
    });
    if (error) return { error: "Gagal menambah required level." };
  }

  revalidatePath("/hrd/competency/library");
  return { success: true };
}
