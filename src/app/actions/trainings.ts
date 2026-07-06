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

// Training programs can only ever be CREATED via reviewTrainingRequest()
// approving a department head's gap-based request (see below) — HRD has no
// path to add one from scratch. This function only ever UPDATES an existing
// training (refining dates/description/status after auto-creation).
export async function saveTraining(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  if (!id) {
    return { error: "Training baru hanya dapat dibuat melalui persetujuan Permintaan Training yang diajukan Kepala Departemen." };
  }

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

  const { error } = await supabaseAdmin.from("trainings").update({
    title, skill_id: skill_id || null, description, date_start, date_end, status
  }).eq("id", id);
  if (error) return { error: "Gagal mengupdate pelatihan." };

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

// ── Permintaan Pelatihan (diajukan Kepala Departemen dari Analisis Kesenjangan) ──

export interface TrainingRequest {
  id: string; department: string; skill_id: string | null; skill_name: string | null;
  current_level: number | null; required_level: number | null; reason: string | null;
  requested_by: string; requested_by_name: string; status: string;
  training_id: string | null; created_at: string; reviewed_at: string | null;
}

export async function submitTrainingRequest(formData: FormData) {
  const user = await requireRole("department_manager", "superadmin");

  const department = (formData.get("department") as string || "").trim();
  const skill_id = (formData.get("skill_id") as string || "").trim() || null;
  const skill_name = (formData.get("skill_name") as string || "").trim();
  const current_level = parseInt(formData.get("current_level") as string || "0", 10) || 0;
  const required_level = parseInt(formData.get("required_level") as string || "0", 10) || 0;
  const reason = (formData.get("reason") as string || "").trim();

  if (!department || !skill_name) return { error: "Departemen dan kompetensi wajib diisi." };

  const { error } = await supabaseAdmin.from("training_requests").insert({
    id: "treq-" + crypto.randomUUID(),
    department, skill_id, skill_name, current_level, required_level, reason,
    requested_by: user.email, requested_by_name: user.name || "",
    status: "Pending", created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260703002_training_requests_roi.sql terlebih dahulu." };
  if (error) { console.error("[trainings] submitTrainingRequest error:", error.message); return { error: "Gagal mengirim permintaan pelatihan." }; }

  revalidatePath("/department/competency");
  revalidatePath("/hrd/learning/trainings");
  return { success: true };
}

export async function getMyDeptTrainingRequests(department: string) {
  await requireRole("department_manager", "superadmin");
  if (!department) return [];
  const { data } = await supabaseAdmin
    .from("training_requests")
    .select("*")
    .eq("department", department)
    .order("created_at", { ascending: false });
  return (data || []) as TrainingRequest[];
}

export async function getTrainingRequests() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("training_requests").select("*").order("created_at", { ascending: false });
  return (data || []) as TrainingRequest[];
}

export async function reviewTrainingRequest(id: string, approve: boolean) {
  await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID permintaan wajib diisi." };

  const { data: req } = await supabaseAdmin.from("training_requests").select("*").eq("id", id).maybeSingle();
  if (!req) return { error: "Permintaan tidak ditemukan." };
  const request = req as TrainingRequest;
  if (request.status !== "Pending") return { error: "Permintaan ini sudah diproses sebelumnya." };

  if (!approve) {
    await supabaseAdmin.from("training_requests").update({ status: "Ditolak", reviewed_at: new Date().toISOString() }).eq("id", id);
    revalidatePath("/hrd/learning/trainings");
    revalidatePath("/department/competency");
    return { success: true };
  }

  // Approve: auto-create a Planned training program that HRD can refine
  // (exact dates, description) via the normal edit form.
  const trainingId = uid();
  const now = new Date();
  const startDefault = now.toISOString().split("T")[0];
  const endDefault = new Date(now.getTime() + 30 * 86_400_000).toISOString().split("T")[0];

  const { error: trainErr } = await supabaseAdmin.from("trainings").insert({
    id: trainingId,
    title: `Pelatihan ${request.skill_name}`,
    skill_id: request.skill_id,
    description: request.reason || `Diajukan oleh ${request.department} berdasarkan kesenjangan kompetensi ${request.skill_name}.`,
    date_start: startDefault, date_end: endDefault, status: "Planned",
    department: request.department, source_request_id: id,
    created_at: now.toISOString(),
  });
  if (trainErr) {
    console.error("[trainings] reviewTrainingRequest error:", trainErr.message);
    return { error: "Gagal membuat program pelatihan." };
  }

  await supabaseAdmin.from("training_requests").update({
    status: "Disetujui", training_id: trainingId, reviewed_at: now.toISOString(),
  }).eq("id", id);

  revalidatePath("/hrd/learning/trainings");
  revalidatePath("/department/competency");
  return { success: true };
}

// ── Analisis Dampak ROTI (Return On Training Investment) ────────────────────

export interface TrainingROIRow {
  id: string;
  title: string;
  department: string | null;
  status: string;
  date_start: string;
  date_end: string;
  cost: number;
  benefit: number;
  roti: number | null;
  notes: string;
}

export async function getTrainingROI(): Promise<TrainingROIRow[]> {
  await requireRole("hrd", "superadmin");
  const [{ data: trainings }, { data: roiRows }] = await Promise.all([
    supabaseAdmin.from("trainings").select("id, title, department, status, date_start, date_end").order("date_start", { ascending: false }),
    supabaseAdmin.from("training_roi").select("*"),
  ]);

  const roiMap = new Map((roiRows || []).map((r: Record<string, unknown>) => [r.training_id as string, r]));

  // Build each row explicitly (rather than spreading a Record<string, unknown>)
  // so TypeScript keeps every field's real type instead of collapsing the
  // whole object to just the newly-added keys.
  return (trainings || []).map((t: Record<string, unknown>) => {
    const r = roiMap.get(t.id as string) as Record<string, unknown> | undefined;
    const cost = Number(r?.cost) || 0;
    const benefit = Number(r?.benefit) || 0;
    const roti = cost > 0 ? Math.round(((benefit - cost) / cost) * 100) : null;
    return {
      id: t.id as string,
      title: t.title as string,
      department: (t.department as string) || null,
      status: t.status as string,
      date_start: t.date_start as string,
      date_end: t.date_end as string,
      cost, benefit, roti,
      notes: (r?.notes as string) || "",
    };
  });
}

export async function saveTrainingROI(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const training_id = (formData.get("training_id") as string || "").trim();
  const cost = parseInt(formData.get("cost") as string || "0", 10) || 0;
  const benefit = parseInt(formData.get("benefit") as string || "0", 10) || 0;
  const notes = (formData.get("notes") as string || "").trim();

  if (!training_id) return { error: "Program pelatihan wajib dipilih." };

  const { error } = await supabaseAdmin.from("training_roi").upsert({
    training_id, cost, benefit, notes, updated_at: new Date().toISOString(),
  }, { onConflict: "training_id" });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260703002_training_requests_roi.sql terlebih dahulu." };
  if (error) { console.error("[trainings] saveTrainingROI error:", error.message); return { error: "Gagal menyimpan data ROTI." }; }

  revalidatePath("/hrd/learning/roi");
  return { success: true };
}

// ── Materi Kursus, Kuis & Ujian, Sertifikat (data nyata, mengikuti training) ──

export async function getTrainingMaterials() {
  await requireRole("hrd", "superadmin", "department_manager", "employee");
  const { data } = await supabaseAdmin.from("training_materials").select("*").order("created_at", { ascending: false });
  return (data || []) as Record<string, unknown>[];
}

export async function saveTrainingMaterial(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const training_id = (formData.get("training_id") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const type = (formData.get("type") as string || "File").trim();
  if (!training_id || !title) return { error: "Program pelatihan dan judul materi wajib diisi." };

  const { error } = await supabaseAdmin.from("training_materials").insert({
    id: "mat-" + crypto.randomUUID(), training_id, title, type, file_size: "-", created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260703002_training_requests_roi.sql terlebih dahulu." };
  if (error) return { error: "Gagal menambah materi." };
  revalidatePath("/hrd/learning/materials");
  return { success: true };
}

export async function deleteTrainingMaterial(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("training_materials").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus materi." };
  revalidatePath("/hrd/learning/materials");
  return { success: true };
}

export async function getTrainingQuizzes() {
  await requireRole("hrd", "superadmin", "department_manager", "employee");
  const { data } = await supabaseAdmin.from("training_quizzes").select("*").order("created_at", { ascending: false });
  return (data || []) as Record<string, unknown>[];
}

export async function saveTrainingQuiz(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const training_id = (formData.get("training_id") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const questions_count = parseInt(formData.get("questions_count") as string || "0", 10) || 0;
  const pass_score = parseInt(formData.get("pass_score") as string || "70", 10) || 70;
  const duration_minutes = parseInt(formData.get("duration_minutes") as string || "30", 10) || 30;
  if (!training_id || !title) return { error: "Program pelatihan dan judul kuis wajib diisi." };

  const { error } = await supabaseAdmin.from("training_quizzes").insert({
    id: "quiz-" + crypto.randomUUID(), training_id, title, questions_count, pass_score, duration_minutes,
    status: "Draft", created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260703002_training_requests_roi.sql terlebih dahulu." };
  if (error) return { error: "Gagal menambah kuis." };
  revalidatePath("/hrd/learning/quizzes");
  return { success: true };
}

export async function deleteTrainingQuiz(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("training_quizzes").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus kuis." };
  revalidatePath("/hrd/learning/quizzes");
  return { success: true };
}

export async function getTrainingCertificates() {
  await requireRole("hrd", "superadmin", "department_manager", "employee");
  const { data } = await supabaseAdmin.from("training_certificates").select("*").order("created_at", { ascending: false });
  return (data || []) as Record<string, unknown>[];
}

export async function issueCertificate(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const training_id = (formData.get("training_id") as string || "").trim();
  const employee_id = (formData.get("employee_id") as string || "").trim();
  const certificate_number = (formData.get("certificate_number") as string || "").trim();
  const completion_date = (formData.get("completion_date") as string || "").trim();
  if (!training_id || !employee_id || !certificate_number) return { error: "Program, karyawan, dan nomor sertifikat wajib diisi." };

  const { error } = await supabaseAdmin.from("training_certificates").insert({
    id: "cert-" + crypto.randomUUID(), training_id, employee_id, certificate_number,
    completion_date: completion_date || null, status: "Diterbitkan", created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260703002_training_requests_roi.sql terlebih dahulu." };
  if (error) return { error: "Gagal menerbitkan sertifikat." };
  revalidatePath("/hrd/learning/certificates");
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
