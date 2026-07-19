"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { resolveManagerDepartment } from "@/lib/dept-resolve";

// ── CAREER REQUESTS (lamaran internal & konsultasi karir dari karyawan) ─────

export async function getCareerRequests() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("permintaan_karir")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) return [];
  return (data || []) as Array<Record<string, unknown>>;
}

const CAREER_REQUEST_STATUSES = ["Pending", "Reviewed", "Completed", "Rejected"] as const;
type CareerRequestStatus = (typeof CAREER_REQUEST_STATUSES)[number];

export async function updateCareerRequestStatus(id: string, status: CareerRequestStatus, notes = "") {
  await requireRole("hrd", "superadmin");
  if (!CAREER_REQUEST_STATUSES.includes(status)) return { error: "Status tidak valid." };
  const { error } = await supabaseAdmin.from("permintaan_karir").update({
    status, notes, updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) { console.error("[career-hrd] updateCareerRequestStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/requests");
  return { success: true };
}

// ── MUTATIONS ──────────────────────────────────────────────────────────────

export async function getMutations() {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  let q = supabaseAdmin
    .from("mutasi_karir")
    .select("*, karyawan!inner(full_name, position, department)")
    // Salary Review rows also live in mutasi_karir (review_type set) but
    // have their own approval flow in rewards.ts — exclude them here so
    // this list and its approve/reject flow only ever see real mutations.
    .is("review_type", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (user.role === "department_manager") {
    const ownDept = await resolveManagerDepartment(user.email);
    if (!ownDept) return [];
    q = q.eq("karyawan.department", ownDept);
  }
  const { data } = await q;
  return data || [];
}

export async function submitMutation(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const fromDepartment = (formData.get("from_department") as string || "").trim();
  const toDepartment = (formData.get("to_department") as string || "").trim();
  const effectiveDate = (formData.get("effective_date") as string) || null;
  const reason = (formData.get("reason") as string || "").trim() || null;
  if (!employeeId || !fromDepartment || !toDepartment)
    return { error: "Karyawan, departemen asal, dan departemen tujuan wajib diisi." };

  // A department_manager may only initiate a mutation FOR an employee
  // currently in their own department (the destination can be anywhere).
  if (user.role === "department_manager") {
    const ownDept = await resolveManagerDepartment(user.email);
    if (!ownDept || fromDepartment !== ownDept) {
      return { error: "Anda hanya dapat mengajukan mutasi untuk karyawan di departemen Anda sendiri." };
    }
  }
  const { error } = await supabaseAdmin.from("mutasi_karir").insert({
    id: "mut-" + crypto.randomUUID(),
    employee_id: employeeId, from_department: fromDepartment, to_department: toDepartment,
    effective_date: effectiveDate || null, reason, status: "Menunggu",
    requested_by: user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[career-hrd] submitMutation error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/mutations");
  return { success: true };
}

export async function updateMutationStatus(id: string, status: "Disetujui" | "Ditolak") {
  await requireRole("hrd", "superadmin");
  let cascadeFields: Record<string, unknown> = {};

  if (status === "Disetujui") {
    const { data: mutation, error: fetchError } = await supabaseAdmin
      .from("mutasi_karir").select("employee_id, to_department").eq("id", id).maybeSingle();
    if (fetchError || !mutation) return { error: "Data mutasi tidak ditemukan." };
    const m = mutation as { employee_id: string; to_department: string };

    const { data: emp } = await supabaseAdmin.from("karyawan").select("position, formasi_id").eq("id", m.employee_id).maybeSingle();
    const currentPosition = (emp as { position?: string; formasi_id?: string } | null)?.position || null;

    // A pure department transfer keeps the same jabatan/grade/salary unless
    // paired with a promotion — record that explicitly (grade_before ==
    // grade_after) instead of leaving these columns permanently null.
    const { data: jabatanRow } = currentPosition
      ? await supabaseAdmin.from("jabatan").select("id, grade_id").eq("name", currentPosition).maybeSingle()
      : { data: null };
    const gradeId = (jabatanRow as { id?: string; grade_id?: string } | null)?.grade_id || null;
    const { data: struktur } = await supabaseAdmin.from("struktur_gaji").select("basic_salary").eq("employee_id", m.employee_id).maybeSingle();
    const currentSalary = (struktur as { basic_salary?: number } | null)?.basic_salary ?? null;
    cascadeFields = { grade_before: gradeId, grade_after: gradeId, salary_before: currentSalary, salary_after: currentSalary };

    // Reassign formasi to a vacant slot for the same jabatan in the new
    // department, if one exists — otherwise leave the current formasi_id
    // (org unit will no longer match the employee's department, but we
    // don't silently invent a formasi row that doesn't exist).
    const jabatanId = (jabatanRow as { id?: string } | null)?.id;
    if (jabatanId) {
      const { data: destUnit } = await supabaseAdmin.from("unit_organisasi").select("id").eq("name", m.to_department).maybeSingle();
      const destUnitId = (destUnit as { id?: string } | null)?.id;
      if (destUnitId) {
        const { data: vacantFormasi } = await supabaseAdmin.from("formasi_jabatan")
          .select("id").eq("jabatan_id", jabatanId).eq("unit_organisasi_id", destUnitId).eq("status", "Vacant").limit(1).maybeSingle();
        const newFormasiId = (vacantFormasi as { id?: string } | null)?.id;
        if (newFormasiId) {
          const oldFormasiId = (emp as { formasi_id?: string } | null)?.formasi_id;
          if (oldFormasiId) await supabaseAdmin.from("formasi_jabatan").update({ status: "Vacant", karyawan_id: null }).eq("id", oldFormasiId);
          await supabaseAdmin.from("formasi_jabatan").update({ status: "Filled", karyawan_id: m.employee_id }).eq("id", newFormasiId);
          (cascadeFields as Record<string, unknown>).formasi_id = newFormasiId;
        }
      }
    }

    // Update the employee record FIRST — only flip the request to "Disetujui"
    // if this actually succeeds, so the request never ends up approved without
    // the department change actually having taken effect.
    const empUpdate: Record<string, unknown> = { department: m.to_department };
    if (cascadeFields.formasi_id) empUpdate.formasi_id = cascadeFields.formasi_id;
    const { error: empError } = await supabaseAdmin
      .from("karyawan").update(empUpdate).eq("id", m.employee_id);
    if (empError) {
      console.error("[career-hrd] updateMutationStatus employee update error:", empError.message);
      return { error: "Gagal memperbarui data departemen karyawan. Status mutasi tidak diubah." };
    }
  }

  const { error } = await supabaseAdmin.from("mutasi_karir").update({ status, ...cascadeFields }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL." };
  if (error) { console.error("[career-hrd] updateMutationStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/mutations");
  revalidatePath("/hrd/employees");
  return { success: true };
}

// ── PROMOTIONS ─────────────────────────────────────────────────────────────

export async function getPromotions() {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  let q = supabaseAdmin
    .from("promosi_karir")
    .select("*, karyawan!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);
  // A department_manager only ever sees promotions within their own
  // department — without this, this list (and updatePromotionStatus's
  // approve/reject) let any manager see and act on any department's
  // promotions company-wide.
  if (user.role === "department_manager") {
    const ownDept = await resolveManagerDepartment(user.email);
    if (!ownDept) return [];
    q = q.eq("karyawan.department", ownDept);
  }
  const { data } = await q;
  return data || [];
}

export async function submitPromotion(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "department_manager");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const fromPosition = (formData.get("from_position") as string || "").trim();
  const toPosition = (formData.get("to_position") as string || "").trim();
  const effectiveDate = (formData.get("effective_date") as string) || null;
  const reason = (formData.get("reason") as string || "").trim() || null;
  const criteria = (formData.get("criteria") as string || "").trim() || null;
  if (!employeeId || !toPosition) return { error: "Karyawan dan posisi tujuan wajib diisi." };
  const { error } = await supabaseAdmin.from("promosi_karir").insert({
    id: "prm-" + crypto.randomUUID(),
    employee_id: employeeId, from_position: fromPosition, to_position: toPosition,
    effective_date: effectiveDate || null, reason, criteria, status: "Menunggu",
    requested_by: user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[career-hrd] submitPromotion error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/promotions");
  return { success: true };
}

export async function updatePromotionStatus(id: string, status: "Disetujui" | "Ditolak") {
  const user = await requireRole("hrd", "superadmin", "department_manager");

  const { data: promoRow } = await supabaseAdmin.from("promosi_karir").select("employee_id").eq("id", id).maybeSingle();
  const promoEmployeeId = (promoRow as { employee_id?: string } | null)?.employee_id;
  if (user.role === "department_manager" && promoEmployeeId) {
    const [ownDept, { data: empRow }] = await Promise.all([
      resolveManagerDepartment(user.email),
      supabaseAdmin.from("karyawan").select("department").eq("id", promoEmployeeId).maybeSingle(),
    ]);
    const empDeptCheck = (empRow as { department?: string } | null)?.department;
    if (!ownDept || empDeptCheck !== ownDept) {
      return { error: "Anda hanya dapat memproses promosi untuk karyawan di departemen Anda sendiri." };
    }
  }

  if (status === "Disetujui") {
    const { data: promotion, error: fetchError } = await supabaseAdmin
      .from("promosi_karir").select("employee_id, to_position").eq("id", id).maybeSingle();
    if (fetchError || !promotion) return { error: "Data promosi tidak ditemukan." };
    const p = promotion as { employee_id: string; to_position: string };

    const { data: emp } = await supabaseAdmin.from("karyawan").select("department, formasi_id").eq("id", p.employee_id).maybeSingle();
    const empDept = (emp as { department?: string } | null)?.department;
    const oldFormasiId = (emp as { formasi_id?: string } | null)?.formasi_id;

    // Resolve the new jabatan's grade so the promotion actually raises salary
    // instead of only changing the position label — a promotion that leaves
    // grade/salary untouched is exactly the dead-end status change the spec
    // warns against.
    const { data: newJabatan } = await supabaseAdmin.from("jabatan").select("id, grade_id").eq("name", p.to_position).maybeSingle();
    const newJabatanId = (newJabatan as { id?: string; grade_id?: string } | null)?.id;
    const newGradeId = (newJabatan as { id?: string; grade_id?: string } | null)?.grade_id;

    const empUpdate: Record<string, unknown> = { position: p.to_position };

    if (newGradeId) {
      const { data: grade } = await supabaseAdmin.from("grade_jabatan").select("salary_min").eq("id", newGradeId).maybeSingle();
      const salaryMin = (grade as { salary_min?: number } | null)?.salary_min;
      if (salaryMin) {
        const { data: existingStruktur } = await supabaseAdmin.from("struktur_gaji").select("id, basic_salary").eq("employee_id", p.employee_id).maybeSingle();
        const s = existingStruktur as { id?: string; basic_salary?: number } | null;
        const newBasic = Math.max(s?.basic_salary || 0, salaryMin);
        await supabaseAdmin.from("struktur_gaji").upsert({
          id: s?.id || ("sal-" + crypto.randomUUID()), employee_id: p.employee_id,
          basic_salary: newBasic, updated_at: new Date().toISOString(),
        }, { onConflict: "employee_id" });
      }
    }

    if (newJabatanId && empDept) {
      const { data: unit } = await supabaseAdmin.from("unit_organisasi").select("id").eq("name", empDept).maybeSingle();
      const unitId = (unit as { id?: string } | null)?.id;
      if (unitId) {
        const { data: vacantFormasi } = await supabaseAdmin.from("formasi_jabatan")
          .select("id").eq("jabatan_id", newJabatanId).eq("unit_organisasi_id", unitId).eq("status", "Vacant").limit(1).maybeSingle();
        const newFormasiId = (vacantFormasi as { id?: string } | null)?.id;
        if (newFormasiId) {
          if (oldFormasiId) await supabaseAdmin.from("formasi_jabatan").update({ status: "Vacant", karyawan_id: null }).eq("id", oldFormasiId);
          await supabaseAdmin.from("formasi_jabatan").update({ status: "Filled", karyawan_id: p.employee_id }).eq("id", newFormasiId);
          empUpdate.formasi_id = newFormasiId;
        }
      }
    }

    // Update the employee record FIRST — only flip the request to "Disetujui"
    // if this actually succeeds, so the request never ends up approved without
    // the position change actually having taken effect.
    const { error: empError } = await supabaseAdmin
      .from("karyawan").update(empUpdate).eq("id", p.employee_id);
    if (empError) {
      console.error("[career-hrd] updatePromotionStatus employee update error:", empError.message);
      return { error: "Gagal memperbarui data jabatan karyawan. Status promosi tidak diubah." };
    }
  }

  const { error } = await supabaseAdmin.from("promosi_karir").update({ status }).eq("id", id);
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL." };
  if (error) { console.error("[career-hrd] updatePromotionStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/promotions");
  revalidatePath("/hrd/employees");
  return { success: true };
}

// ── DEVELOPMENT PLANS ──────────────────────────────────────────────────────

export async function getDevelopmentPlans() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("rencana_pengembangan")
    .select("*, karyawan!inner(full_name, department, position)")
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function createDevelopmentPlan(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const goals = (formData.get("goals") as string || "").trim();
  const trainings = (formData.get("trainings") as string || "").trim() || null;
  const timeline = (formData.get("timeline") as string || "").trim() || null;
  const mentor = (formData.get("mentor") as string || "").trim() || null;
  // Optional: links this IDP to a specific competency gap (see Gap Analysis
  // "Buat IDP") instead of being purely freeform.
  const skillId = (formData.get("skill_id") as string || "").trim() || null;
  const jenisAksi = (formData.get("jenis_aksi") as string || "Training").trim();
  const gapValueRaw = formData.get("gap_value") as string;
  const gapValue = gapValueRaw ? parseInt(gapValueRaw, 10) : null;
  if (!employeeId || !goals) return { error: "Karyawan dan tujuan pengembangan wajib diisi." };
  const { error } = await supabaseAdmin.from("rencana_pengembangan").insert({
    id: "dp-" + crypto.randomUUID(), employee_id: employeeId,
    goals, trainings, timeline, mentor, progress: 0, status: "Aktif",
    skill_id: skillId, jenis_aksi: jenisAksi, gap_value: gapValue,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[career-hrd] createDevelopmentPlan error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/plans");
  return { success: true };
}

/** Creates an IDP directly from one Gap Analysis row (Employee 360°'s "Buat
 * IDP" button) — same table as createDevelopmentPlan above, just pre-filled
 * from the gap instead of a manual form, and linked via skill_id/gap_value
 * so the plan traces back to the specific competency shortfall that caused it. */
export async function createIdpFromGap(karyawanId: string, skillId: string, gapValue: number): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (!karyawanId || !skillId) return { error: "Karyawan dan kompetensi wajib diisi." };

  const { data: skill } = await supabaseAdmin.from("master_kompetensi").select("name").eq("id", skillId).maybeSingle();
  const skillName = (skill as { name: string } | null)?.name || "kompetensi ini";

  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from("rencana_pengembangan").insert({
    id: "dp-" + crypto.randomUUID(), employee_id: karyawanId,
    goals: `Menutup kesenjangan kompetensi "${skillName}" (gap ${gapValue}).`,
    trainings: skillName, timeline: null, mentor: null, progress: 0, status: "Aktif",
    skill_id: skillId, jenis_aksi: "Training", gap_value: gapValue,
    created_at: now, updated_at: now,
  });
  if (error?.code === "42P01" || error?.code === "PGRST204") return { error: "Jalankan migrasi 20260714001_competency_position_link.sql terlebih dahulu." };
  if (error) { console.error("[career-hrd] createIdpFromGap error:", error.message); return { error: "Gagal membuat IDP." }; }

  revalidatePath("/hrd/career/plans");
  revalidatePath("/hrd/competency/gap");
  return { success: true };
}

export async function updatePlanProgress(id: string, progress: number) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("rencana_pengembangan")
    .update({ progress: Math.max(0, Math.min(100, progress)), updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Gagal memperbarui progres." };
  revalidatePath("/hrd/career/plans");
  return { success: true };
}

// ── CAREER PATH ────────────────────────────────────────────────────────────

export async function addCareerPathPosition(formData: FormData) {
  await requireRole("hrd", "superadmin", "department_manager");
  const name = (formData.get("name") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const level = (formData.get("level") as string || "").trim();
  const code = (formData.get("code") as string || "").trim() || null;
  if (!name || !department || !level) return { error: "Nama posisi, departemen, level, dan kode wajib diisi." };
  const positionCode = code || `${department.substring(0, 3).toUpperCase()}-${Date.now().toString(36)}`;
  const { error } = await supabaseAdmin.from("jabatan").insert({
    id: "pos-" + crypto.randomUUID(), code: positionCode, name, department, level,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "23505") return { error: `Posisi "${name}" atau kode sudah ada. Coba lagi.` };
  if (error) { console.error("[career-hrd] addCareerPathPosition error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/career/path");
  return { success: true };
}
