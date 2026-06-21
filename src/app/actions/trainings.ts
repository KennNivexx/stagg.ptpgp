"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "tr-" + crypto.randomUUID();

export async function getTrainings() {
  await requireRole("hrd", "superadmin", "department_manager");

  const [{ data: trainings }, { data: enrollments }] = await Promise.all([
    supabaseAdmin.from("trainings").select("*").order("date_start", { ascending: false }),
    supabaseAdmin.from("training_enrollments").select("training_id"),
  ]);

  const countMap: Record<string, number> = {};
  for (const e of (enrollments || [])) {
    const tid = (e as Record<string, unknown>).training_id as string;
    countMap[tid] = (countMap[tid] || 0) + 1;
  }

  return (trainings || []).map((t: Record<string, unknown>) => ({
    ...t,
    enrollment_count: countMap[t.id as string] || 0,
  }));
}

export async function saveTraining(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const skill_id = (formData.get("skill_id") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const date_start = (formData.get("date_start") as string || "").trim();
  const date_end = (formData.get("date_end") as string || "").trim();
  const status = (formData.get("status") as string || "").trim();

  if (!title || !date_start || !date_end) return { error: "Judul, tanggal mulai, dan tanggal selesai wajib diisi." };
  const VALID_STATUSES = ["Planned", "Ongoing", "Completed", "Cancelled"];
  if (status && !VALID_STATUSES.includes(status)) {
    return { error: `Status tidak valid. Gunakan: ${VALID_STATUSES.join(", ")}.` };
  }
  if (new Date(date_end) < new Date(date_start)) return { error: "Tanggal selesai harus setelah tanggal mulai." };

  const now = new Date().toISOString();
  if (id) {
    const { error } = await supabaseAdmin.from("trainings").update({
      title, skill_id: skill_id || null, description, date_start, date_end, status, updated_at: now,
    }).eq("id", id);
    if (error) return { error: "Gagal mengupdate pelatihan." };
  } else {
    const { error } = await supabaseAdmin.from("trainings").insert({
      id: uid(), title, skill_id: skill_id || null, description, date_start, date_end, status, created_at: now, updated_at: now,
    });
    if (error) return { error: "Gagal menambah pelatihan." };
  }

  revalidatePath("/hrd/learning");
  return { success: true };
}

export async function deleteTraining(id: string) {
  await requireRole("hrd", "superadmin");

  if (!id) return { error: "ID pelatihan wajib diisi." };

  await supabaseAdmin.from("training_enrollments").delete().eq("training_id", id);
  const { error } = await supabaseAdmin.from("trainings").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus pelatihan." };

  revalidatePath("/hrd/learning");
  return { success: true };
}

export async function getTrainingEnrollments(trainingId: string) {
  await requireRole("hrd", "superadmin", "department_manager");

  const { data, error } = await supabaseAdmin
    .from("training_enrollments")
    .select("*, employees!inner(full_name, email, department, position)")
    .eq("training_id", trainingId)
    .order("created_at", { ascending: true });

  if (error) return [];

  return (data || []).map((e: Record<string, unknown>) => {
    const emp = (e.employees as Record<string, unknown>) || {};
    return {
      id: e.id,
      training_id: e.training_id,
      employee_id: e.employee_id,
      employee_name: emp.full_name || e.employee_name || "",
      employee_email: emp.email || e.employee_email || "",
      employee_department: emp.department || e.employee_department || "",
      employee_position: emp.position || e.employee_position || "",
      status: e.status,
      created_at: e.created_at,
    };
  });
}

export async function removeEnrollment(id: string) {
  await requireRole("hrd", "superadmin");

  if (!id) return { error: "ID enrollment wajib diisi." };

  const { error } = await supabaseAdmin.from("training_enrollments").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus peserta." };

  revalidatePath("/hrd/learning");
  return { success: true };
}

export async function requestTrainingEnrollment(employeeId: string, trainingId: string) {
  const user = await requireRole("employee", "hrd", "superadmin");

  if (!employeeId || !trainingId) return { error: "Data tidak lengkap." };

  // Employee can only enroll themselves
  if (user.role === "employee" && user.id !== employeeId) {
    return { error: "Akses ditolak." };
  }

  // Check training exists and is open
  const { data: training } = await supabaseAdmin
    .from("trainings")
    .select("id, status")
    .eq("id", trainingId)
    .maybeSingle();

  if (!training) return { error: "Pelatihan tidak ditemukan." };
  if (!["Planned", "Ongoing"].includes((training as { id: string; status: string }).status)) {
    return { error: "Pelatihan tidak menerima pendaftaran." };
  }

  // Check not already enrolled
  const { data: existing } = await supabaseAdmin
    .from("training_enrollments")
    .select("id")
    .eq("training_id", trainingId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (existing) return { error: "Anda sudah terdaftar di pelatihan ini." };

  const { error } = await supabaseAdmin.from("training_enrollments").insert({
    id: "te-" + crypto.randomUUID(),
    training_id: trainingId,
    employee_id: employeeId,
    status: "Enrolled",
    enrolled_at: new Date().toISOString(),
  });

  if (error) return { error: "Gagal mendaftar pelatihan." };

  revalidatePath("/employee/training");
  revalidatePath("/hrd/learning");
  return { success: true };
}

export async function getDeptTrainings(deptName: string) {
  await requireRole("department_manager", "superadmin");

  const { data: jobSpecs } = await supabaseAdmin
    .from("job_specifications")
    .select("skills")
    .eq("department", deptName);

  const skillNames: Set<string> = new Set();
  if (jobSpecs) {
    for (const js of jobSpecs) {
      const skills = (js as Record<string, unknown>).skills;
      if (Array.isArray(skills)) {
        for (const s of skills) skillNames.add(String(s).trim());
      }
    }
  }

  let query = supabaseAdmin.from("trainings").select("*").order("date_start", { ascending: false });

  if (skillNames.size > 0) {
    const { data: skills } = await supabaseAdmin
      .from("skills")
      .select("id")
      .in("name", Array.from(skillNames));
    const skillIds = (skills || []).map((s: Record<string, unknown>) => s.id as string);
    if (skillIds.length > 0) {
      query = query.in("skill_id", skillIds);
    }
  }

  const { data: trainings } = await query;

  const { data: enrollments } = await supabaseAdmin.from("training_enrollments").select("training_id");
  const countMap: Record<string, number> = {};
  for (const e of (enrollments || [])) {
    const tid = (e as Record<string, unknown>).training_id as string;
    countMap[tid] = (countMap[tid] || 0) + 1;
  }

  return (trainings || []).map((t: Record<string, unknown>) => ({
    ...t,
    enrollment_count: countMap[t.id as string] || 0,
  }));
}
