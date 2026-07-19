"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "tr-" + crypto.randomUUID();

/** Enrolls every employee who actually has this skill gap (current level below
 * the position's required level) in the department — this is the "orang orang
 * dengan kategori yang cocok akan langsung masuk ke Training itu" behavior. */
async function autoEnrollGapEmployees(trainingId: string, skillId: string | null, department: string): Promise<number> {
  if (!skillId) return 0;

  const { data: employees } = await supabaseAdmin
    .from("karyawan")
    .select("id, position")
    .eq("department", department)
    .not("status", "eq", "Resigned");
  if (!employees || employees.length === 0) return 0;

  const positions = [...new Set(employees.map((e: { position: string }) => e.position).filter(Boolean))];
  const { data: posSkills } = await supabaseAdmin
    .from("kompetensi_jabatan")
    .select("position_code, required_level")
    .eq("skill_id", skillId)
    .in("position_code", positions);
  const requiredByPosition = new Map((posSkills || []).map((p: { position_code: string; required_level: number }) => [p.position_code, p.required_level]));

  const employeeIds = employees.map((e: { id: string }) => e.id);
  const { data: empSkills } = await supabaseAdmin
    .from("kompetensi_karyawan")
    .select("employee_id, current_level")
    .eq("skill_id", skillId)
    .in("employee_id", employeeIds);
  const currentByEmployee = new Map((empSkills || []).map((s: { employee_id: string; current_level: number }) => [s.employee_id, s.current_level]));

  const gapEmployeeIds = employees
    .filter((e: { id: string; position: string }) => {
      const required = requiredByPosition.get(e.position);
      if (required === undefined) return false;
      const current = currentByEmployee.get(e.id) ?? 0;
      return current < required;
    })
    .map((e: { id: string }) => e.id);

  if (gapEmployeeIds.length === 0) return 0;

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("peserta_pelatihan").insert(
    gapEmployeeIds.map((employeeId) => ({
      id: "te-" + crypto.randomUUID(),
      training_id: trainingId,
      employee_id: employeeId,
      status: "Enrolled",
      enrolled_at: now,
    }))
  );
  if (error) {
    console.error("[trainings] autoEnrollGapEmployees error:", error.message);
    return 0;
  }
  return gapEmployeeIds.length;
}

export async function getTrainings() {
  await requireRole("hrd", "superadmin", "department_manager");

  const [{ data: trainings }, { data: enrollments }] = await Promise.all([
    supabaseAdmin.from("pelatihan").select("*").order("date_start", { ascending: false }),
    supabaseAdmin.from("peserta_pelatihan").select("training_id"),
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

// Master Data fields (kategori/metode/provider/instruktur/lokasi/jam) — read
// once here and reused by both the create and update branches below.
function readTrainingMasterFields(formData: FormData) {
  return {
    category: (formData.get("category") as string || "").trim() || null,
    method: (formData.get("method") as string || "Offline").trim(),
    provider: (formData.get("provider") as string || "").trim() || null,
    instruktur: (formData.get("instruktur") as string || "").trim() || null,
    jenis_instruktur: (formData.get("jenis_instruktur") as string || "Internal").trim(),
    lokasi: (formData.get("lokasi") as string || "").trim() || null,
    durasi_jam: formData.get("durasi_jam") ? Number(formData.get("durasi_jam")) : null,
  };
}

/**
 * Creates a training from scratch when no `id` is given (previously this
 * function was update-only — the only ways to get a training row were via
 * reviewTrainingRequest()/createTrainingFromGap()/createTrainingFromTNA(),
 * with no manual "Katalog Pelatihan" entry point at all), otherwise updates
 * the existing row.
 */
export async function saveTraining(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const skill_id = (formData.get("skill_id") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const date_start = (formData.get("date_start") as string || "").trim();
  const date_end = (formData.get("date_end") as string || "").trim();
  const status = (formData.get("status") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const master = readTrainingMasterFields(formData);

  if (!title || !date_start || !date_end) return { error: "Judul, tanggal mulai, dan tanggal selesai wajib diisi." };
  const VALID_STATUSES = ["Planned", "Ongoing", "Completed", "Cancelled"];
  if (status && !VALID_STATUSES.includes(status)) {
    return { error: `Status tidak valid. Gunakan: ${VALID_STATUSES.join(", ")}.` };
  }
  if (new Date(date_end) < new Date(date_start)) return { error: "Tanggal selesai harus setelah tanggal mulai." };

  if (!id) {
    const newId = uid();
    const { error } = await supabaseAdmin.from("pelatihan").insert({
      id: newId, title, skill_id: skill_id || null, description,
      date_start, date_end, status: status || "Planned", department: department || null,
      ...master, created_at: new Date().toISOString(),
    });
    if (error?.code === "42703" || error?.code === "PGRST204") return { error: "Jalankan migrasi 20260715001_learning_training_management.sql terlebih dahulu." };
    if (error) { console.error("[trainings] saveTraining insert error:", error.message); return { error: "Gagal membuat pelatihan." }; }
    revalidatePath("/hrd/learning");
    revalidatePath("/hrd/learning/trainings");
    return { success: true, id: newId };
  }

  const { error } = await supabaseAdmin.from("pelatihan").update({
    title, skill_id: skill_id || null, description, date_start, date_end, status, ...master,
  }).eq("id", id);
  if (error) return { error: "Gagal mengupdate pelatihan." };

  revalidatePath("/hrd/learning");
  return { success: true };
}

export async function deleteTraining(id: string) {
  await requireRole("hrd", "superadmin");

  if (!id) return { error: "ID pelatihan wajib diisi." };

  await supabaseAdmin.from("peserta_pelatihan").delete().eq("training_id", id);
  const { error } = await supabaseAdmin.from("pelatihan").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus pelatihan." };

  revalidatePath("/hrd/learning");
  return { success: true };
}

export async function getTrainingEnrollments(trainingId: string) {
  await requireRole("hrd", "superadmin", "department_manager");

  const { data, error } = await supabaseAdmin
    .from("peserta_pelatihan")
    .select("*, karyawan!inner(full_name, email, department, position)")
    .eq("training_id", trainingId)
    .order("created_at", { ascending: true });

  if (error) return [];

  return (data || []).map((e: Record<string, unknown>) => {
    const emp = (e.karyawan as Record<string, unknown>) || {};
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

/** HRD marks an enrollment's outcome after reviewing quiz/completion —
 * pass keeps it "Completed" (ready for issueCertificate); fail resets it to
 * "Perlu Mengulang" so the employee must retry, per the explicit spec:
 * lulus → sertifikat, tidak lolos → mengulang. */
export async function markEnrollmentResult(id: string, passed: boolean): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID peserta wajib diisi." };

  const { error } = await supabaseAdmin
    .from("peserta_pelatihan")
    .update({ status: passed ? "Completed" : "Perlu Mengulang" })
    .eq("id", id);
  if (error) return { error: "Gagal memperbarui status peserta." };

  revalidatePath("/hrd/learning/trainings");
  revalidatePath("/employee/training");
  return { success: true };
}

export async function removeEnrollment(id: string) {
  await requireRole("hrd", "superadmin");

  if (!id) return { error: "ID enrollment wajib diisi." };

  const { error } = await supabaseAdmin.from("peserta_pelatihan").delete().eq("id", id);
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
    .from("pelatihan")
    .select("id, status")
    .eq("id", trainingId)
    .maybeSingle();

  if (!training) return { error: "Pelatihan tidak ditemukan." };
  if (!["Planned", "Ongoing"].includes((training as { id: string; status: string }).status)) {
    return { error: "Pelatihan tidak menerima pendaftaran." };
  }

  // Check not already enrolled
  const { data: existing } = await supabaseAdmin
    .from("peserta_pelatihan")
    .select("id")
    .eq("training_id", trainingId)
    .eq("employee_id", employeeId)
    .maybeSingle();

  if (existing) return { error: "Anda sudah terdaftar di pelatihan ini." };

  const { error } = await supabaseAdmin.from("peserta_pelatihan").insert({
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

  const { error } = await supabaseAdmin.from("permintaan_pelatihan").insert({
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
    .from("permintaan_pelatihan")
    .select("*")
    .eq("department", department)
    .order("created_at", { ascending: false });
  return (data || []) as TrainingRequest[];
}

export interface DeptTrainingStatusRow {
  employee_id: string; employee_name: string; training_id: string;
  training_title: string; date_start: string | null; date_end: string | null;
  status: string; training_status: string;
}

/** Team training enrollment/completion status for a Kepala Departemen —
 * cross-references peserta_pelatihan against the department's own
 * employees, so a manager sees exactly who on their team is enrolled in
 * what and whether they've completed it, without needing HRD's full
 * company-wide Learning module. */
export async function getDeptTrainingStatus(department: string): Promise<DeptTrainingStatusRow[]> {
  await requireRole("department_manager", "hrd", "superadmin");
  if (!department) return [];

  const { data: employees } = await supabaseAdmin.from("karyawan")
    .select("id, full_name").eq("department", department).neq("status", "Inactive");
  const empIds = (employees || []).map((e: { id: string }) => e.id);
  if (empIds.length === 0) return [];
  const empMap = new Map((employees || []).map((e: { id: string; full_name: string }) => [e.id, e.full_name]));

  const { data: enrollments } = await supabaseAdmin.from("peserta_pelatihan")
    .select("employee_id, training_id, status").in("employee_id", empIds);
  if (!enrollments || enrollments.length === 0) return [];

  const trainingIds = [...new Set(enrollments.map((e: { training_id: string }) => e.training_id))];
  const { data: trainings } = await supabaseAdmin.from("pelatihan")
    .select("id, title, date_start, date_end, status").in("id", trainingIds);
  const trainingMap = new Map((trainings || []).map((t: { id: string; title: string; date_start: string | null; date_end: string | null; status: string }) => [t.id, t]));

  return enrollments.map((e: { employee_id: string; training_id: string; status: string }) => {
    const t = trainingMap.get(e.training_id) as { title?: string; date_start?: string | null; date_end?: string | null; status?: string } | undefined;
    return {
      employee_id: e.employee_id, employee_name: empMap.get(e.employee_id) || "-",
      training_id: e.training_id, training_title: t?.title || "-",
      date_start: t?.date_start || null, date_end: t?.date_end || null,
      status: e.status, training_status: t?.status || "-",
    };
  }).sort((a, b) => (b.date_start || "").localeCompare(a.date_start || ""));
}

export async function getTrainingRequests() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("permintaan_pelatihan").select("*").order("created_at", { ascending: false });
  return (data || []) as TrainingRequest[];
}

export async function reviewTrainingRequest(id: string, approve: boolean) {
  await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID permintaan wajib diisi." };

  const { data: req } = await supabaseAdmin.from("permintaan_pelatihan").select("*").eq("id", id).maybeSingle();
  if (!req) return { error: "Permintaan tidak ditemukan." };
  const request = req as TrainingRequest;
  if (request.status !== "Pending") return { error: "Permintaan ini sudah diproses sebelumnya." };

  if (!approve) {
    await supabaseAdmin.from("permintaan_pelatihan").update({ status: "Ditolak", reviewed_at: new Date().toISOString() }).eq("id", id);
    revalidatePath("/hrd/learning/trainings");
    revalidatePath("/department/competency");
    return { success: true };
  }

  // Approve: auto-create a training program (jadwal ditentukan HRD, bisa
  // direfine lewat form edit) — tapi baru benar-benar berjalan (dan karyawan
  // baru diberi tahu) setelah Direktur menyetujui anggarannya, lihat
  // reviewTrainingBudget di bawah.
  const trainingId = uid();
  const now = new Date();
  const startDefault = now.toISOString().split("T")[0];
  const endDefault = new Date(now.getTime() + 30 * 86_400_000).toISOString().split("T")[0];

  const { error: trainErr } = await supabaseAdmin.from("pelatihan").insert({
    id: trainingId,
    title: `Pelatihan ${request.skill_name}`,
    skill_id: request.skill_id,
    description: request.reason || `Diajukan oleh ${request.department} berdasarkan kesenjangan kompetensi ${request.skill_name}.`,
    date_start: startDefault, date_end: endDefault, status: "Planned",
    department: request.department, source_request_id: id,
    budget_status: "Menunggu Direktur",
    created_at: now.toISOString(),
  });
  if (trainErr) {
    console.error("[trainings] reviewTrainingRequest error:", trainErr.message);
    return { error: "Gagal membuat program pelatihan." };
  }

  await autoEnrollGapEmployees(trainingId, request.skill_id, request.department);

  await supabaseAdmin.from("permintaan_pelatihan").update({
    status: "Disetujui", training_id: trainingId, reviewed_at: now.toISOString(),
  }).eq("id", id);

  revalidatePath("/hrd/learning/trainings");
  revalidatePath("/department/competency");
  revalidatePath("/director/trainings");
  return { success: true };
}

/**
 * HRD-direct path: create a training straight from a Gap Analysis row
 * (instead of waiting for a department manager to submit a request first).
 * Still gated by Director budget approval before employees are notified —
 * same as the department-request path above.
 */
export async function createTrainingFromGap(params: {
  skillId: string; skillName: string; department: string;
  currentLevel: number; requiredLevel: number; proposedCost: number;
}): Promise<{ error: string } | { success: true; enrolledCount: number }> {
  const user = await requireRole("hrd", "superadmin");
  const { skillId, skillName, department, proposedCost } = params;
  if (!skillId || !skillName || !department) return { error: "Data gap tidak lengkap." };
  if (proposedCost < 0) return { error: "Estimasi biaya tidak valid." };

  const trainingId = uid();
  const now = new Date();
  const startDefault = now.toISOString().split("T")[0];
  const endDefault = new Date(now.getTime() + 30 * 86_400_000).toISOString().split("T")[0];

  const { error } = await supabaseAdmin.from("pelatihan").insert({
    id: trainingId,
    title: `Pelatihan ${skillName}`,
    skill_id: skillId,
    description: `Dibuat oleh ${user.name || user.email} dari Analisis Kesenjangan (${department}) — gap level ${params.currentLevel}/${params.requiredLevel}.`,
    date_start: startDefault, date_end: endDefault, status: "Planned",
    department, proposed_cost: proposedCost, budget_status: "Menunggu Direktur",
    created_at: now.toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "42703") return { error: "Jalankan migrasi 20260709001_workflow_overhaul.sql terlebih dahulu." };
  if (error) { console.error("[trainings] createTrainingFromGap error:", error.message); return { error: "Gagal membuat program pelatihan." }; }

  const enrolledCount = await autoEnrollGapEmployees(trainingId, skillId, department);

  revalidatePath("/hrd/competency/gap");
  revalidatePath("/hrd/learning/trainings");
  revalidatePath("/director/trainings");
  return { success: true, enrolledCount };
}

// ── Training Need Analysis (TNA) — persisted, org-wide gap scan ─────────────
// Previously Gap Analysis was only ever live-computed on the fly (see
// src/app/hrd/competency/gap/page.tsx) with no saved record of which gaps
// have actually been acted on. generateTNA() snapshots the same resolution
// chain (Employee Assignment -> Position Number -> Master Jabatan, falling
// back to legacy position-text match) into tna_kompetensi so HR can track
// status (Open/Assigned/Resolved) instead of re-deriving it from scratch
// and losing track of what's already been turned into a training.

export interface TnaRow {
  id: string;
  karyawan_id: string;
  karyawan_nama: string;
  skill_id: string;
  skill_nama: string;
  required_level: number;
  current_level: number;
  gap: number;
  status: string;
  pelatihan_id: string | null;
}

export async function generateTNA(): Promise<{ error: string } | { success: true; count: number }> {
  await requireRole("hrd", "superadmin");

  const [{ data: employees }, { data: skills }, { data: empSkills }, { data: posSkills }, { data: formasiList }] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, position, formasi_id").neq("status", "Inactive"),
    supabaseAdmin.from("master_kompetensi").select("id"),
    supabaseAdmin.from("kompetensi_karyawan").select("employee_id, skill_id, current_level"),
    supabaseAdmin.from("kompetensi_jabatan").select("position_code, skill_id, required_level, jabatan_id"),
    supabaseAdmin.from("formasi_jabatan").select("id, jabatan_id"),
  ]);
  if (!employees || !skills) return { error: "Gagal memuat data untuk TNA." };

  const formasiToJabatan = new Map((formasiList || []).map((f: { id: string; jabatan_id: string }) => [f.id, f.jabatan_id]));
  const empCurrentMap: Record<string, Record<string, number>> = {};
  for (const es of (empSkills || []) as { employee_id: string; skill_id: string; current_level: number }[]) {
    if (!empCurrentMap[es.employee_id]) empCurrentMap[es.employee_id] = {};
    empCurrentMap[es.employee_id][es.skill_id] = es.current_level;
  }
  const posReqMap: Record<string, Record<string, number>> = {};
  const jabatanReqMap: Record<string, Record<string, number>> = {};
  for (const ps of (posSkills || []) as { position_code: string; skill_id: string; required_level: number; jabatan_id: string | null }[]) {
    if (!posReqMap[ps.position_code]) posReqMap[ps.position_code] = {};
    posReqMap[ps.position_code][ps.skill_id] = ps.required_level;
    if (ps.jabatan_id) {
      if (!jabatanReqMap[ps.jabatan_id]) jabatanReqMap[ps.jabatan_id] = {};
      jabatanReqMap[ps.jabatan_id][ps.skill_id] = ps.required_level;
    }
  }

  const rows: { id: string; karyawan_id: string; skill_id: string; required_level: number; current_level: number; gap: number; status: string }[] = [];
  for (const emp of employees as { id: string; position: string; formasi_id: string | null }[]) {
    const jabatanId = emp.formasi_id ? formasiToJabatan.get(emp.formasi_id) : null;
    for (const skill of skills as { id: string }[]) {
      const required = (jabatanId ? jabatanReqMap[jabatanId]?.[skill.id] : undefined) ?? posReqMap[emp.position]?.[skill.id] ?? null;
      if (required === null) continue;
      const current = empCurrentMap[emp.id]?.[skill.id] ?? 0;
      const gap = current - required;
      if (gap >= 0) continue;
      rows.push({
        id: "tna-" + crypto.randomUUID(), karyawan_id: emp.id, skill_id: skill.id,
        required_level: required, current_level: current, gap, status: "Open",
      });
    }
  }

  if (rows.length === 0) return { success: true, count: 0 };

  const { error } = await supabaseAdmin.from("tna_kompetensi").upsert(rows, { onConflict: "karyawan_id,skill_id,status" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260715001_learning_training_management.sql terlebih dahulu." };
  if (error) { console.error("[trainings] generateTNA error:", error.message); return { error: "Gagal membuat TNA." }; }

  revalidatePath("/hrd/learning/tna");
  return { success: true, count: rows.length };
}

export async function getTNA(): Promise<TnaRow[]> {
  await requireRole("hrd", "superadmin");
  const { data: rows, error } = await supabaseAdmin.from("tna_kompetensi").select("*").order("gap", { ascending: true });
  if (error || !rows) return [];

  const empIds = [...new Set(rows.map((r: { karyawan_id: string }) => r.karyawan_id))];
  const skillIds = [...new Set(rows.map((r: { skill_id: string }) => r.skill_id))];
  const [{ data: emps }, { data: skills }] = await Promise.all([
    empIds.length ? supabaseAdmin.from("karyawan").select("id, full_name").in("id", empIds) : Promise.resolve({ data: [] }),
    skillIds.length ? supabaseAdmin.from("master_kompetensi").select("id, name").in("id", skillIds) : Promise.resolve({ data: [] }),
  ]);
  const empName = new Map(((emps || []) as { id: string; full_name: string }[]).map(e => [e.id, e.full_name]));
  const skillName = new Map(((skills || []) as { id: string; name: string }[]).map(s => [s.id, s.name]));

  return (rows as Record<string, unknown>[]).map(r => ({
    id: r.id as string, karyawan_id: r.karyawan_id as string, karyawan_nama: empName.get(r.karyawan_id as string) || "—",
    skill_id: r.skill_id as string, skill_nama: skillName.get(r.skill_id as string) || "—",
    required_level: r.required_level as number, current_level: r.current_level as number, gap: r.gap as number,
    status: r.status as string, pelatihan_id: (r.pelatihan_id as string) || null,
  }));
}

/** Groups selected Open TNA rows by skill_id, creates one training per
 * skill (reusing the same createTrainingFromGap shape), enrolls the
 * relevant employees, then marks those TNA rows Assigned + linked. */
export async function createTrainingFromTNA(tnaIds: string[]): Promise<{ error: string } | { success: true; createdCount: number }> {
  const user = await requireRole("hrd", "superadmin");
  if (!tnaIds || tnaIds.length === 0) return { error: "Pilih minimal satu baris TNA." };

  const { data: rows } = await supabaseAdmin.from("tna_kompetensi").select("*").in("id", tnaIds).eq("status", "Open");
  if (!rows || rows.length === 0) return { error: "Baris TNA tidak ditemukan atau sudah diproses." };

  const skillIds = [...new Set((rows as { skill_id: string }[]).map(r => r.skill_id))];
  const { data: skills } = await supabaseAdmin.from("master_kompetensi").select("id, name").in("id", skillIds);
  const skillName = new Map(((skills || []) as { id: string; name: string }[]).map(s => [s.id, s.name]));

  const empIds = [...new Set((rows as { karyawan_id: string }[]).map(r => r.karyawan_id))];
  const { data: emps } = await supabaseAdmin.from("karyawan").select("id, department").in("id", empIds);
  const empDept = new Map(((emps || []) as { id: string; department: string }[]).map(e => [e.id, e.department]));

  const now = new Date();
  const startDefault = now.toISOString().split("T")[0];
  const endDefault = new Date(now.getTime() + 30 * 86_400_000).toISOString().split("T")[0];
  let createdCount = 0;

  const bySkill = new Map<string, { karyawan_id: string; department: string }[]>();
  for (const r of rows as { id: string; karyawan_id: string; skill_id: string }[]) {
    const dept = empDept.get(r.karyawan_id) || "";
    if (!bySkill.has(r.skill_id)) bySkill.set(r.skill_id, []);
    bySkill.get(r.skill_id)!.push({ karyawan_id: r.karyawan_id, department: dept });
  }

  for (const [skillId, participants] of bySkill) {
    const trainingId = uid();
    const { error: trainErr } = await supabaseAdmin.from("pelatihan").insert({
      id: trainingId, title: `Pelatihan ${skillName.get(skillId) || skillId}`, skill_id: skillId,
      description: `Dibuat oleh ${user.name || user.email} dari Training Need Analysis.`,
      date_start: startDefault, date_end: endDefault, status: "Planned",
      department: participants[0]?.department || null, budget_status: "Menunggu Direktur",
      created_at: now.toISOString(),
    });
    if (trainErr) { console.error("[trainings] createTrainingFromTNA insert error:", trainErr.message); continue; }
    createdCount++;

    await supabaseAdmin.from("peserta_pelatihan").insert(
      participants.map(p => ({ id: "te-" + crypto.randomUUID(), training_id: trainingId, employee_id: p.karyawan_id, status: "Enrolled", enrolled_at: now.toISOString() }))
    );

    const tnaIdsForSkill = (rows as { id: string; skill_id: string }[]).filter(r => r.skill_id === skillId).map(r => r.id);
    await supabaseAdmin.from("tna_kompetensi").update({ status: "Assigned", pelatihan_id: trainingId }).in("id", tnaIdsForSkill);
  }

  revalidatePath("/hrd/learning/tna");
  revalidatePath("/hrd/learning/trainings");
  return { success: true, createdCount };
}

export async function getTrainingsAwaitingBudget() {
  await requireRole("director", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("pelatihan")
    .select("*")
    .eq("budget_status", "Menunggu Direktur")
    .order("created_at", { ascending: false });
  if (error?.code === "42703") return [];
  return data || [];
}

export async function getTrainingBudgetHistory() {
  await requireRole("director", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("pelatihan")
    .select("*")
    .in("budget_status", ["Disetujui", "Ditolak"])
    .order("created_at", { ascending: false })
    .limit(30);
  if (error?.code === "42703") return [];
  return data || [];
}

/** Director's budget decision — this is the point employees actually get
 * notified, per the explicit requirement that training only gets communicated
 * to staff after Director approves the cost. */
export async function reviewTrainingBudget(trainingId: string, approve: boolean, finalCost?: number): Promise<{ error: string } | { success: true }> {
  await requireRole("director", "superadmin");

  const { data: trainingRow } = await supabaseAdmin.from("pelatihan").select("*").eq("id", trainingId).maybeSingle();
  if (!trainingRow) return { error: "Pelatihan tidak ditemukan." };
  const training = trainingRow as Record<string, unknown>;
  if (training.budget_status !== "Menunggu Direktur") {
    return { error: `Pelatihan ini sudah diproses sebelumnya (${training.budget_status}).` };
  }

  const patch: Record<string, unknown> = { budget_status: approve ? "Disetujui" : "Ditolak" };
  if (approve && finalCost !== undefined) patch.proposed_cost = finalCost;
  if (!approve) patch.status = "Cancelled";

  const { error } = await supabaseAdmin.from("pelatihan").update(patch).eq("id", trainingId);
  if (error) return { error: "Gagal memproses keputusan anggaran." };

  if (approve) {
    const { data: enrollments } = await supabaseAdmin
      .from("peserta_pelatihan")
      .select("employee_id")
      .eq("training_id", trainingId);
    const employeeIds = [...new Set((enrollments || []).map((e: { employee_id: string }) => e.employee_id).filter(Boolean))];
    const emailByEmployeeId: Record<string, string> = {};
    if (employeeIds.length > 0) {
      const { data: emps } = await supabaseAdmin.from("karyawan").select("id, email").in("id", employeeIds);
      (emps || []).forEach((e: { id: string; email?: string }) => { if (e.email) emailByEmployeeId[e.id] = e.email; });
    }
    for (const employeeId of employeeIds) {
      const email = emailByEmployeeId[employeeId];
      if (!email) continue;
      await supabaseAdmin.from("notifikasi").insert({
        id: crypto.randomUUID(),
        user_email: email,
        title: "Training Wajib — Menutup Gap Kompetensi",
        message: `Anda terdaftar di pelatihan "${training.title}" untuk menutup kesenjangan kompetensi Anda. Jadwal: ${training.date_start} - ${training.date_end}.`,
        link: "/employee/training",
      });
    }
  }

  revalidatePath("/director/trainings");
  revalidatePath("/hrd/learning/trainings");
  revalidatePath("/employee/training");
  return { success: true };
}

// ── Evaluasi Pelatihan (Kirkpatrick: Reaction/Learning/Behavior/Result) ─────

export interface EvaluasiPelatihanRow {
  id: string;
  training_id: string;
  karyawan_id: string;
  karyawan_nama: string;
  reaction_score: number | null;
  learning_score: number | null;
  behavior_score: number | null;
  result_notes: string | null;
}

export async function getEvaluasiPelatihan(trainingId: string): Promise<EvaluasiPelatihanRow[]> {
  await requireRole("hrd", "superadmin");
  if (!trainingId) return [];

  const [{ data: peserta }, { data: evaluasi }] = await Promise.all([
    supabaseAdmin.from("peserta_pelatihan").select("employee_id, karyawan!inner(id, full_name)").eq("training_id", trainingId),
    supabaseAdmin.from("evaluasi_pelatihan").select("*").eq("training_id", trainingId),
  ]);
  if (!peserta) return [];

  const evalByEmp = new Map(((evaluasi || []) as Record<string, unknown>[]).map(e => [e.karyawan_id as string, e]));

  return (peserta as Record<string, unknown>[]).map(p => {
    const emp = p.karyawan as { id: string; full_name: string } | null;
    const empId = emp?.id || (p.employee_id as string);
    const e = evalByEmp.get(empId) as Record<string, unknown> | undefined;
    return {
      id: (e?.id as string) || "", training_id: trainingId, karyawan_id: empId,
      karyawan_nama: emp?.full_name || "—",
      reaction_score: (e?.reaction_score as number) ?? null, learning_score: (e?.learning_score as number) ?? null,
      behavior_score: (e?.behavior_score as number) ?? null, result_notes: (e?.result_notes as string) || null,
    };
  });
}

export async function saveEvaluasiPelatihan(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const training_id = (formData.get("training_id") as string || "").trim();
  const karyawan_id = (formData.get("karyawan_id") as string || "").trim();
  if (!training_id || !karyawan_id) return { error: "Training dan karyawan wajib diisi." };

  const reaction_score = formData.get("reaction_score") ? parseInt(formData.get("reaction_score") as string, 10) : null;
  const learning_score = formData.get("learning_score") ? parseInt(formData.get("learning_score") as string, 10) : null;
  const behavior_score = formData.get("behavior_score") ? parseInt(formData.get("behavior_score") as string, 10) : null;
  const result_notes = (formData.get("result_notes") as string || "").trim() || null;

  const { data: existing } = await supabaseAdmin.from("evaluasi_pelatihan").select("id").eq("training_id", training_id).eq("karyawan_id", karyawan_id).maybeSingle();
  const id = (existing as { id: string } | null)?.id || ("ev-" + crypto.randomUUID());

  const { error } = await supabaseAdmin.from("evaluasi_pelatihan").upsert({
    id, training_id, karyawan_id, reaction_score, learning_score, behavior_score, result_notes,
  }, { onConflict: "training_id,karyawan_id" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260715001_learning_training_management.sql terlebih dahulu." };
  if (error) { console.error("[trainings] saveEvaluasiPelatihan error:", error.message); return { error: "Gagal menyimpan evaluasi." }; }

  revalidatePath("/hrd/learning/evaluation");
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
    supabaseAdmin.from("pelatihan").select("id, title, department, status, date_start, date_end").order("date_start", { ascending: false }),
    supabaseAdmin.from("roi_pelatihan").select("*"),
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

  const { error } = await supabaseAdmin.from("roi_pelatihan").upsert({
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
  const { data } = await supabaseAdmin.from("materi_pelatihan").select("*").order("created_at", { ascending: false });
  return (data || []) as Record<string, unknown>[];
}

export async function saveTrainingMaterial(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const training_id = (formData.get("training_id") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const type = (formData.get("type") as string || "File").trim();
  if (!training_id || !title) return { error: "Program pelatihan dan judul materi wajib diisi." };

  const { error } = await supabaseAdmin.from("materi_pelatihan").insert({
    id: "mat-" + crypto.randomUUID(), training_id, title, type, file_size: "-", created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260703002_training_requests_roi.sql terlebih dahulu." };
  if (error) return { error: "Gagal menambah materi." };
  revalidatePath("/hrd/learning/materials");
  return { success: true };
}

export async function deleteTrainingMaterial(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("materi_pelatihan").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus materi." };
  revalidatePath("/hrd/learning/materials");
  return { success: true };
}

export async function getTrainingQuizzes() {
  await requireRole("hrd", "superadmin", "department_manager", "employee");
  const { data } = await supabaseAdmin.from("kuis_pelatihan").select("*").order("created_at", { ascending: false });
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

  const { error } = await supabaseAdmin.from("kuis_pelatihan").insert({
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
  const { error } = await supabaseAdmin.from("kuis_pelatihan").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus kuis." };
  revalidatePath("/hrd/learning/quizzes");
  return { success: true };
}

export async function getTrainingCertificates() {
  await requireRole("hrd", "superadmin", "department_manager", "employee");
  const { data } = await supabaseAdmin.from("sertifikat_pelatihan").select("*").order("created_at", { ascending: false });
  return (data || []) as Record<string, unknown>[];
}

export async function issueCertificate(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const training_id = (formData.get("training_id") as string || "").trim();
  const employee_id = (formData.get("employee_id") as string || "").trim();
  const certificate_number = (formData.get("certificate_number") as string || "").trim();
  const completion_date = (formData.get("completion_date") as string || "").trim();
  if (!training_id || !employee_id || !certificate_number) return { error: "Program, karyawan, dan nomor sertifikat wajib diisi." };

  const { error } = await supabaseAdmin.from("sertifikat_pelatihan").insert({
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
    .from("spesifikasi_kerja")
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

  let query = supabaseAdmin.from("pelatihan").select("*").order("date_start", { ascending: false });

  if (skillNames.size > 0) {
    const { data: skills } = await supabaseAdmin
      .from("master_kompetensi")
      .select("id")
      .in("name", Array.from(skillNames));
    const skillIds = (skills || []).map((s: Record<string, unknown>) => s.id as string);
    if (skillIds.length > 0) {
      query = query.in("skill_id", skillIds);
    }
  }

  const { data: trainings } = await query;

  const { data: enrollments } = await supabaseAdmin.from("peserta_pelatihan").select("training_id");
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
