"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

/**
 * Manpower Request Validation Engine — rule-based checks against data that
 * genuinely exists in this schema (position/org/budget/headcount/internal
 * mobility/succession/workload). This app has no ML infrastructure and no
 * tracked production/sales data, so "Workload Analysis" below uses a real,
 * honest proxy instead — formasi (position slot) fill-rate for the unit,
 * against thresholds HRD can edit in manpower_validation_rule — rather than
 * fabricating operational metrics that don't exist anywhere in this app.
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
  // unit_organisasi has no status/active-inactive column in this schema —
  // a row existing at all means it's a real, registered unit. Querying a
  // non-existent "status" column here used to make this select fail
  // silently on every call, so Organization Validation (and everything
  // downstream that depends on `unit` — Headcount, Internal Mobility,
  // Workload) always reported "can't verify" even for real departments.
  const { data: unitMatch } = await supabaseAdmin.from("unit_organisasi")
    .select("id").eq("name", req.department).maybeSingle();
  const unit = unitMatch as { id?: string } | null;
  checks.push(unit
    ? { key: "org_unit", label: "Organization Validation", status: "Pass", message: `Unit organisasi "${req.department}" terdaftar di Master Unit Organisasi.` }
    : { key: "org_unit", label: "Organization Validation", status: "Info", message: `Nama unit organisasi "${req.department}" tidak cocok persis dengan Master Unit Organisasi — tidak dapat diverifikasi otomatis (kemungkinan perbedaan penamaan).` });
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

  // ── 7. Workload Analysis ───────────────────────────────────────────────
  // Real proxy for "is this unit actually stretched thin": formasi fill-rate
  // (Filled / Total position slots) for the unit, against HRD-configurable
  // thresholds — not fabricated production/sales/utilization numbers, since
  // this app tracks none of that.
  if (unit) {
    const unitId = (unitMatch as { id: string }).id;
    const [{ count: totalFormasi }, { count: filledFormasi }, { data: rules }] = await Promise.all([
      supabaseAdmin.from("formasi_jabatan").select("*", { count: "exact", head: true }).eq("unit_organisasi_id", unitId),
      supabaseAdmin.from("formasi_jabatan").select("*", { count: "exact", head: true }).eq("unit_organisasi_id", unitId).eq("status", "Filled"),
      supabaseAdmin.from("manpower_validation_rule").select("rule_key, threshold_value").eq("is_active", true),
    ]);
    const ruleMap = new Map((rules || []).map((r: { rule_key: string; threshold_value: number }) => [r.rule_key, r.threshold_value]));
    const highThreshold = ruleMap.get("workload_utilization_high_pct") ?? 90;
    const lowThreshold = ruleMap.get("workload_utilization_low_pct") ?? 60;
    const total = totalFormasi || 0;
    if (total === 0) {
      checks.push({ key: "workload", label: "Workload Analysis", status: "Info", message: "Belum ada formasi tercatat untuk unit ini — utilisasi tidak dapat dihitung." });
    } else {
      const utilizationPct = Math.round(((filledFormasi || 0) / total) * 100);
      if (utilizationPct >= highThreshold) {
        checks.push({ key: "workload", label: "Workload Analysis", status: "Pass", message: `Utilisasi formasi unit ${utilizationPct}% (≥${highThreshold}%) — beban kerja tinggi, penambahan tenaga kerja wajar.` });
      } else if (utilizationPct < lowThreshold) {
        checks.push({ key: "workload", label: "Workload Analysis", status: "Warning", message: `Utilisasi formasi unit hanya ${utilizationPct}% (<${lowThreshold}%) — masih banyak formasi kosong, pertimbangkan menunda penambahan headcount baru.` });
      } else {
        checks.push({ key: "workload", label: "Workload Analysis", status: "Info", message: `Utilisasi formasi unit ${utilizationPct}% — dalam rentang normal.` });
      }
    }
  } else {
    checks.push({ key: "workload", label: "Workload Analysis", status: "Info", message: "Tidak dapat dihitung karena unit organisasi tidak cocok." });
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

export async function getEmploymentTypeOptions() {
  const { data } = await supabaseAdmin.from("employment_type_master").select("*").eq("is_active", true).order("urutan");
  return data || [];
}
