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

  if (error) return [];
  return data || [];
}

export async function getSkills() {
  await requireRole("department_manager", "superadmin", "hrd", "director", "employee");

  const { data, error } = await supabaseAdmin
    .from("skills")
    .select("*")
    .order("category")
    .order("name");

  if (error) return [];
  return data || [];
}

export async function getEmployeeSkills(employeeIds: string[]) {
  if (!employeeIds.length) return [];

  await requireRole("department_manager", "superadmin", "hrd");

  const { data, error } = await supabaseAdmin
    .from("employee_skills")
    .select("*")
    .in("employee_id", employeeIds);

  if (error) return [];
  return data || [];
}

export async function getPositionSkills() {
  await requireRole("department_manager", "superadmin", "hrd", "director", "employee");

  const { data, error } = await supabaseAdmin
    .from("position_skills")
    .select("*");

  if (error) return [];
  return (data || []).filter((r) => !r.position_code.startsWith("_dept_"));
}

export async function assessEmployee(
  employeeId: string,
  skills: { skill_id: string; current_level: number }[]
) {
  const assessor = await requireRole("department_manager", "superadmin", "hrd");

  if (assessor.role === "department_manager") {
    const EMAIL_TO_DEPT: Record<string, string> = {
      "hrga@ptpgp.co.id": "HR & GA",
      "finance@ptpgp.co.id": "Finance",
      "operational@ptpgp.co.id": "Operational Division",
      "procurement@ptpgp.co.id": "Procurement Division",
      "projectappraisal@ptpgp.co.id": "Project Appraisal",
      "mr@ptpgp.co.id": "Management Representative",
      "hse@ptpgp.co.id": "Health, Safety & Environment",
    };
    const managerDept = EMAIL_TO_DEPT[assessor.email] || "";

    const { data: targetEmp } = await supabaseAdmin.from("employees").select("department").eq("id", employeeId).maybeSingle();
    const targetDept = (targetEmp as { department?: string } | null)?.department;
    
    if (!managerDept || !targetDept || managerDept !== targetDept) {
      return { error: "Akses ditolak: karyawan berada di luar departemen Anda." };
    }
  }

  const now = new Date().toISOString();
  const skillIds = skills.map(s => s.skill_id);

  // Batch: fetch all existing employee skills in ONE query
  const { data: existingSkills } = await supabaseAdmin
    .from("employee_skills")
    .select("id, skill_id")
    .eq("employee_id", employeeId)
    .in("skill_id", skillIds);

  const existingMap = new Map<string, string>();
  for (const es of (existingSkills || [])) {
    existingMap.set((es as Record<string, string>).skill_id, (es as Record<string, string>).id);
  }

  // Batch: upsert all skills
  for (const sk of skills) {
    const existingId = existingMap.get(sk.skill_id);
    if (existingId) {
      await supabaseAdmin
        .from("employee_skills")
        .update({ current_level: sk.current_level, assessed_by: assessor.email, updated_at: now })
        .eq("id", existingId);
    } else {
      await supabaseAdmin.from("employee_skills").insert({
        id: "es-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        employee_id: employeeId,
        skill_id: sk.skill_id,
        current_level: sk.current_level,
        assessed_by: assessor.email,
        updated_at: now,
      });
    }
  }

  // Auto-enroll in training when skill gap >= 2 — batch queries
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

    if (posSkills && posSkills.length > 0) {
      // Identify skills with gap >= 2
      const gapSkillIds: string[] = [];
      for (const sk of skills) {
        const req = (posSkills as { skill_id: string; required_level: number }[]).find(p => p.skill_id === sk.skill_id);
        if (req && req.required_level - sk.current_level >= 2) {
          gapSkillIds.push(sk.skill_id);
        }
      }

      if (gapSkillIds.length > 0) {
        // Batch: fetch all relevant trainings
        const { data: trainings } = await supabaseAdmin
          .from("trainings")
          .select("id, skill_id")
          .in("skill_id", gapSkillIds)
          .in("status", ["Planned", "Ongoing"]);

        if (trainings && trainings.length > 0) {
          const trainingIds = (trainings as { id: string; skill_id: string }[]).map(t => t.id);
          // Batch: check existing enrollments
          const { data: existingEnrollments } = await supabaseAdmin
            .from("training_enrollments")
            .select("training_id")
            .eq("employee_id", employeeId)
            .in("training_id", trainingIds);

          const enrolledSet = new Set((existingEnrollments || []).map((e: Record<string, unknown>) => e.training_id as string));

          // Insert new enrollments
          for (const t of (trainings as { id: string }[])) {
            if (!enrolledSet.has(t.id)) {
              await supabaseAdmin.from("training_enrollments").insert({
                id: "te-" + crypto.randomUUID(),
                training_id: t.id,
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
  revalidatePath("/hrd/competency/assessment");
  revalidatePath("/hrd/competency/skillmatrix");
  revalidatePath("/hrd/competency/gap");
  return { success: true };
}

const suid = () => "sk-" + crypto.randomUUID();

export async function saveSkill(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const name = (formData.get("name") as string || "").trim();
  const category = (formData.get("category") as string || "").trim();
  // null = berlaku semua dept; string = hanya departemen tertentu
  const department = (formData.get("department") as string || "").trim() || null;

  if (!name || !category) return { error: "Nama dan kategori skill wajib diisi." };

  const now = new Date().toISOString();
  if (id) {
    const { error } = await supabaseAdmin.from("skills").update({ name, category, department, updated_at: now }).eq("id", id);
    if (error) return { error: "Gagal mengupdate skill." };
  } else {
    const { error } = await supabaseAdmin.from("skills").insert({
      id: suid(), name, category, department, created_at: now, updated_at: now,
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

// ─── Dept skill list — stored as position_skills with position_code = "_dept_DEPTNAME" ───
export async function getDeptSkillList(dept: string): Promise<string[]> {
  await requireRole("department_manager", "hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("position_skills")
    .select("skill_id")
    .eq("position_code", "_dept_" + dept);
  return ((data || []) as { skill_id: string }[]).map((r) => r.skill_id);
}

export async function saveDeptSkillList(dept: string, skillIds: string[]) {
  const user = await requireRole("department_manager", "hrd", "superadmin");

  if (user.role === "department_manager") {
    const EMAIL_TO_DEPT: Record<string, string> = {
      "hrga@ptpgp.co.id": "HR & GA",
      "finance@ptpgp.co.id": "Finance",
      "operational@ptpgp.co.id": "Operational Division",
      "procurement@ptpgp.co.id": "Procurement Division",
      "projectappraisal@ptpgp.co.id": "Project Appraisal",
      "mr@ptpgp.co.id": "Management Representative",
      "hse@ptpgp.co.id": "Health, Safety & Environment",
    };
    const managerDept = EMAIL_TO_DEPT[user.email] || "";
    if (!managerDept || managerDept !== dept) {
      return { error: "Akses ditolak: hanya bisa mengatur departemen sendiri." };
    }
  }

  const prefix = "_dept_" + dept;
  await supabaseAdmin.from("position_skills").delete().eq("position_code", prefix);
  if (skillIds.length > 0) {
    await supabaseAdmin.from("position_skills").insert(
      skillIds.map((id) => ({ position_code: prefix, skill_id: id, required_level: 0 }))
    );
  }
  revalidatePath("/hrd/competency/library");
  revalidatePath("/department/competency");
  return { success: true };
}

export async function removeSkillFromPosition(positionCode: string, skillId: string) {
  await requireRole("hrd", "superadmin");

  if (!positionCode || !skillId) return { error: "Data tidak lengkap." };

  const { error } = await supabaseAdmin
    .from("position_skills")
    .delete()
    .eq("position_code", positionCode)
    .eq("skill_id", skillId);

  if (error) return { error: "Gagal menghapus skill dari jabatan." };

  revalidatePath("/hrd/competency/library");
  return { success: true };
}
