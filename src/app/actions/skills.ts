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
  const assessor = await requireRole("department_manager", "superadmin", "hrd");

  // A department_manager may only assess employees within their OWN department.
  // hrd/superadmin are company-wide and bypass this scope check.
  if (assessor.role === "department_manager") {
    const [{ data: managerEmp }, { data: targetEmp }] = await Promise.all([
      supabaseAdmin.from("employees").select("department").eq("email", assessor.email).maybeSingle(),
      supabaseAdmin.from("employees").select("department").eq("id", employeeId).maybeSingle(),
    ]);
    const managerDept = (managerEmp as { department?: string } | null)?.department;
    const targetDept = (targetEmp as { department?: string } | null)?.department;
    if (!managerDept || !targetDept || managerDept !== targetDept) {
      throw new Error("Akses ditolak: karyawan berada di luar departemen Anda.");
    }
  }

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
        .update({ current_level: sk.current_level, assessed_by: assessor.email, updated_at: now })
        .eq("id", (existing as { id: string }).id);
    } else {
      await supabaseAdmin.from("employee_skills").insert({
        id: "es-" + crypto.randomUUID(),
        employee_id: employeeId,
        skill_id: sk.skill_id,
        current_level: sk.current_level,
        assessed_by: assessor.email,
        updated_at: now,
      });
    }
  }

  // Auto-enroll in training when skill gap >= 2 (required - current >= 2)
  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("position")
    .eq("id", employeeId)
    .maybeSingle();

  if (employee) {
    const posCode = (employee as { position: string }).position;
    const { data: posSkills } = await supabaseAdmin
      .from("position_skills")
      .select("skill_id, required_level")
      .eq("position_code", posCode);

    if (posSkills) {
      for (const sk of skills) {
        const req = (posSkills as { skill_id: string; required_level: number }[]).find(p => p.skill_id === sk.skill_id);
        if (req && req.required_level - sk.current_level >= 2) {
          // Find active training for this skill
          const { data: trainings } = await supabaseAdmin
            .from("trainings")
            .select("id")
            .eq("skill_id", sk.skill_id)
            .in("status", ["Planned", "Ongoing"])
            .limit(1);

          if (trainings && trainings.length > 0) {
            const trainingId = (trainings[0] as { id: string }).id;
            // Check if already enrolled
            const { data: enrolled } = await supabaseAdmin
              .from("training_enrollments")
              .select("id")
              .eq("training_id", trainingId)
              .eq("employee_id", employeeId)
              .maybeSingle();

            if (!enrolled) {
              await supabaseAdmin.from("training_enrollments").insert({
                id: "te-" + crypto.randomUUID(),
                training_id: trainingId,
                employee_id: employeeId,
                status: "Enrolled",
                enrolled_at: now,
              });
            }
          }
        }
      }
    }
  }

  revalidatePath("/department/competency");
  revalidatePath("/hrd/learning");
  return { success: true };
}

const suid = () => "sk-" + crypto.randomUUID();

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

  const position_code = (formData.get("position_code") as string || "").trim();
  const skill_id = (formData.get("skill_id") as string || "").trim();
  const required_level = parseInt(formData.get("required_level") as string || "0");

  if (!position_code || !skill_id) return { error: "Posisi dan skill wajib diisi." };

  const { data: existing } = await supabaseAdmin
    .from("position_skills")
    .select("position_code")
    .eq("position_code", position_code)
    .eq("skill_id", skill_id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabaseAdmin.from("position_skills")
      .update({ required_level })
      .eq("position_code", position_code)
      .eq("skill_id", skill_id);
    if (error) return { error: "Gagal mengupdate level." };
  } else {
    const { error } = await supabaseAdmin.from("position_skills").insert({
      position_code, skill_id, required_level,
    });
    if (error) return { error: "Gagal menambah required level." };
  }

  revalidatePath("/hrd/competency/library");
  return { success: true };
}
