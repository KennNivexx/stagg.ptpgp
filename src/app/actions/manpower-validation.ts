"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

/**
 * Manpower Request Validation Engine — rule-based checks against data that
 * genuinely exists in this schema (position/org/budget/headcount/internal
 * mobility/succession). This app has no ML infrastructure and no tracked
 * operational data (production/sales/utilization), so unlike the client's
 * spec this deliberately has no "Workload Analysis" check and no fabricated
 * AI score — every result below traces to a real row this function read.
 */

export type ValidationStatus = "Pass" | "Warning" | "Incomplete" | "Info";
export interface ValidationCheck { key: string; label: string; status: ValidationStatus; message: string }
export interface ValidationResult { checks: ValidationCheck[]; overallStatus: "Complete" | "Incomplete"; computedAt: string }

interface RequestRow {
  department: string; position: string; quantity: number; grade_code: string | null;
  cost_center: string | null; budget_recruitment: number | null; budget_available: boolean | null;
}

export async function runManpowerValidation(requestId: string): Promise<{ error: string } | { success: true; result: ValidationResult }> {
  await requireRole("hrd", "superadmin", "director", "department_manager");

  const { data: reqRow } = await supabaseAdmin.from("permintaan_sdm")
    .select("department, position, quantity, grade_code, cost_center, budget_recruitment, budget_available")
    .eq("id", requestId).maybeSingle();
  if (!reqRow) return { error: "Permintaan tidak ditemukan." };
  const req = reqRow as RequestRow;

  const checks: ValidationCheck[] = [];

  // ── 1. Position Validation ────────────────────────────────────────────
  const { data: jabatanMatch } = await supabaseAdmin.from("jabatan")
    .select("id").eq("name", req.position).eq("department", req.department).maybeSingle();
  if (jabatanMatch) {
    checks.push({ key: "position", label: "Position Validation", status: "Pass", message: `Jabatan "${req.position}" terdaftar di Master Jabatan.` });
  } else {
    checks.push({ key: "position", label: "Position Validation", status: "Incomplete", message: `Jabatan "${req.position}" belum terdaftar di Master Jabatan (${req.department}).` });
  }

  const { data: jobDescMatch } = await supabaseAdmin.from("deskripsi_kerja")
    .select("id").eq("position", req.position).maybeSingle();
  checks.push(jobDescMatch
    ? { key: "job_desc", label: "Job Description", status: "Pass", message: "Deskripsi kerja untuk posisi ini sudah tersedia." }
    : { key: "job_desc", label: "Job Description", status: "Incomplete", message: "Deskripsi kerja untuk posisi ini belum dibuat." });

  if (req.grade_code) {
    const { data: gradeMatch } = await supabaseAdmin.from("grade_jabatan")
      .select("id, salary_min, salary_max").eq("kode", req.grade_code).maybeSingle();
    const g = gradeMatch as { salary_min: number | null; salary_max: number | null } | null;
    if (!g) {
      checks.push({ key: "grade", label: "Grade & Salary Band", status: "Incomplete", message: `Grade "${req.grade_code}" tidak ditemukan di Master Grade.` });
    } else if (g.salary_min == null || g.salary_max == null) {
      checks.push({ key: "grade", label: "Grade & Salary Band", status: "Incomplete", message: `Salary band untuk grade "${req.grade_code}" belum ditetapkan.` });
    } else {
      checks.push({ key: "grade", label: "Grade & Salary Band", status: "Pass", message: `Grade "${req.grade_code}" — salary band Rp${g.salary_min.toLocaleString("id-ID")} - Rp${g.salary_max.toLocaleString("id-ID")}.` });
    }
  } else {
    checks.push({ key: "grade", label: "Grade & Salary Band", status: "Incomplete", message: "Grade jabatan belum dipilih pada permintaan ini." });
  }

  // ── 2. Organization Validation ────────────────────────────────────────
  const { data: unitMatch } = await supabaseAdmin.from("unit_organisasi")
    .select("id, status").eq("name", req.department).maybeSingle();
  const unit = unitMatch as { status?: string } | null;
  if (!unit) {
    checks.push({ key: "org_unit", label: "Organization Validation", status: "Info", message: `Nama unit organisasi "${req.department}" tidak cocok persis dengan Master Unit Organisasi — tidak dapat diverifikasi otomatis (kemungkinan perbedaan penamaan).` });
  } else {
    checks.push(unit.status === "Aktif"
      ? { key: "org_unit", label: "Organization Validation", status: "Pass", message: `Unit organisasi "${req.department}" berstatus Aktif.` }
      : { key: "org_unit", label: "Organization Validation", status: "Incomplete", message: `Unit organisasi "${req.department}" berstatus ${unit.status || "tidak diketahui"}, bukan Aktif.` });
  }
  checks.push(req.cost_center
    ? { key: "cost_center", label: "Cost Center", status: "Pass", message: `Cost center: ${req.cost_center}.` }
    : { key: "cost_center", label: "Cost Center", status: "Incomplete", message: "Cost center belum diisi." });

  // ── 3. Budget Validation ──────────────────────────────────────────────
  if (!req.budget_recruitment || req.budget_recruitment <= 0) {
    checks.push({ key: "budget", label: "Budget Validation", status: "Incomplete", message: "Anggaran rekrutmen belum diisi." });
  } else if (!req.budget_available) {
    checks.push({ key: "budget", label: "Budget Validation", status: "Warning", message: `Anggaran diajukan Rp${req.budget_recruitment.toLocaleString("id-ID")}, namun ketersediaan anggaran belum dikonfirmasi.` });
  } else {
    checks.push({ key: "budget", label: "Budget Validation", status: "Pass", message: `Anggaran Rp${req.budget_recruitment.toLocaleString("id-ID")} tersedia.` });
  }

  // ── 4. Headcount Validation ───────────────────────────────────────────
  if (unit) {
    const { count: vacantCount } = await supabaseAdmin.from("formasi_jabatan")
      .select("*", { count: "exact", head: true })
      .eq("unit_organisasi_id", (unitMatch as { id: string }).id).eq("status", "Vacant");
    const vacant = vacantCount || 0;
    if (vacant >= req.quantity) {
      checks.push({ key: "headcount", label: "Headcount Validation", status: "Pass", message: `Tersedia ${vacant} formasi kosong di unit ini untuk ${req.quantity} permintaan.` });
    } else {
      checks.push({ key: "headcount", label: "Headcount Validation", status: "Warning", message: `Hanya ${vacant} formasi kosong tersedia, permintaan ${req.quantity} orang melebihi formasi yang ada — perlu formasi baru.` });
    }
  } else {
    checks.push({ key: "headcount", label: "Headcount Validation", status: "Info", message: "Tidak dapat memeriksa formasi karena unit organisasi tidak cocok." });
  }

  // ── 5. Internal Mobility Validation ───────────────────────────────────
  if (jabatanMatch) {
    const { data: poolMatches } = await supabaseAdmin.from("talent_pools")
      .select("id, karyawan_id").eq("target_jabatan_id", (jabatanMatch as { id: string }).id).in("status", ["Ready", "Development"]);
    const n = (poolMatches || []).length;
    checks.push(n > 0
      ? { key: "internal_mobility", label: "Internal Mobility Validation", status: "Warning", message: `${n} kandidat internal (Talent Pool) tersedia untuk posisi ini — pertimbangkan rekrutmen internal sebelum membuka lowongan eksternal.` }
      : { key: "internal_mobility", label: "Internal Mobility Validation", status: "Pass", message: "Tidak ada kandidat internal di Talent Pool untuk posisi ini — rekrutmen eksternal dapat dilanjutkan." });
  } else {
    checks.push({ key: "internal_mobility", label: "Internal Mobility Validation", status: "Info", message: "Tidak dapat memeriksa Talent Pool karena jabatan belum terdaftar di Master Jabatan." });
  }

  // ── 6. Succession Validation (only relevant for manager-level roles) ──
  const isManagerRole = /manager|kepala|direktur|general manager/i.test(req.position);
  if (isManagerRole) {
    const { data: employeesInDept } = await supabaseAdmin.from("karyawan").select("id").eq("department", req.department);
    const empIds = (employeesInDept || []).map((e: { id: string }) => e.id);
    let successorCount = 0;
    if (empIds.length > 0) {
      const { count } = await supabaseAdmin.from("kandidat_suksesor")
        .select("*", { count: "exact", head: true }).in("target_position_employee_id", empIds);
      successorCount = count || 0;
    }
    checks.push(successorCount > 0
      ? { key: "succession", label: "Succession Validation", status: "Warning", message: `${successorCount} kandidat suksesor sudah terdaftar untuk posisi manajerial di departemen ini — tinjau Succession Planning sebelum rekrutmen eksternal.` }
      : { key: "succession", label: "Succession Validation", status: "Pass", message: "Tidak ada kandidat suksesor terdaftar — rekrutmen eksternal dapat dilanjutkan." });
  } else {
    checks.push({ key: "succession", label: "Succession Validation", status: "Info", message: "Tidak berlaku — posisi ini bukan level manajerial." });
  }

  const hasIncomplete = checks.some(c => c.status === "Incomplete");
  const result: ValidationResult = {
    checks,
    overallStatus: hasIncomplete ? "Incomplete" : "Complete",
    computedAt: new Date().toISOString(),
  };

  await supabaseAdmin.from("permintaan_sdm").update({
    validation_result: result, validated_at: result.computedAt,
  }).eq("id", requestId);

  revalidatePath("/hrd/workforce/requests");
  return { success: true, result };
}

export async function getRequestTypeOptions() {
  const { data } = await supabaseAdmin.from("jenis_permintaan_sdm").select("*").eq("is_active", true).order("urutan");
  return data || [];
}

export async function getRequestReasonOptions() {
  const { data } = await supabaseAdmin.from("alasan_permintaan_sdm").select("*").eq("is_active", true).order("urutan");
  return data || [];
}
