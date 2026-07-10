"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const MISSING_TABLE = (code?: string) => code === "42P01" || code === "PGRST205";

interface EmployeeRef { id: string; full_name: string; department?: string; position?: string; }

// Official readiness weighting — kept in one place so every succession page
// (Overview, Kandidat Suksesor, Penilaian Kesiapan) computes the same number.
const CRITERIA_WEIGHTS = {
  kepemimpinan: 25,
  keahlian_teknis: 25,
  pengalaman: 20,
  kinerja: 20,
  potensi: 10,
};

export async function saveReadinessAssessment(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  if (!employeeId) return { error: "Pilih kandidat terlebih dahulu." };

  const clamp = (raw: FormDataEntryValue | null) => Math.max(0, Math.min(100, parseInt((raw as string) || "0", 10) || 0));
  const kepemimpinan = clamp(formData.get("kepemimpinan"));
  const keahlianTeknis = clamp(formData.get("keahlian_teknis"));
  const pengalaman = clamp(formData.get("pengalaman"));
  const kinerja = clamp(formData.get("kinerja"));
  const potensi = clamp(formData.get("potensi"));

  const totalScore = Math.round(
    kepemimpinan * (CRITERIA_WEIGHTS.kepemimpinan / 100) +
    keahlianTeknis * (CRITERIA_WEIGHTS.keahlian_teknis / 100) +
    pengalaman * (CRITERIA_WEIGHTS.pengalaman / 100) +
    kinerja * (CRITERIA_WEIGHTS.kinerja / 100) +
    potensi * (CRITERIA_WEIGHTS.potensi / 100)
  );

  const year = new Date().getFullYear();
  const { data: existing } = await supabaseAdmin
    .from("penilaian_kesiapan_suksesi")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("year", year)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("penilaian_kesiapan_suksesi").upsert({
    id: (existing as { id: string } | null)?.id || ("sra-" + crypto.randomUUID()),
    employee_id: employeeId, year,
    kepemimpinan, keahlian_teknis: keahlianTeknis, pengalaman, kinerja, potensi,
    total_score: totalScore,
    assessed_by: user.name || user.email,
    updated_at: new Date().toISOString(),
  }, { onConflict: "employee_id,year" });

  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704007_succession_readiness.sql terlebih dahulu." };
  if (error) { console.error("[succession] saveReadinessAssessment error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/succession/readiness");
  revalidatePath("/hrd/succession");
  revalidatePath("/hrd/succession/candidates");
  revalidatePath("/hrd/succession/talentpool");
  return { success: true };
}

export async function getReadinessAssessments() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("penilaian_kesiapan_suksesi")
    .select("*")
    .order("updated_at", { ascending: false });
  if (MISSING_TABLE(error?.code) || error) return [];
  const rows = (data || []) as Array<Record<string, unknown>>;
  const employeeIds = [...new Set(rows.map((r) => r.employee_id as string))];
  const { data: employees } = employeeIds.length > 0
    ? await supabaseAdmin.from("karyawan").select("id, full_name, department, position").in("id", employeeIds)
    : { data: [] };
  const employeeMap = new Map((employees || []).map((e: Record<string, unknown>) => [e.id as string, e]));
  return rows.map((r) => ({
    id: r.id as string,
    employee_id: r.employee_id as string,
    year: r.year as number,
    kepemimpinan: r.kepemimpinan as number,
    keahlian_teknis: r.keahlian_teknis as number,
    pengalaman: r.pengalaman as number,
    kinerja: r.kinerja as number,
    potensi: r.potensi as number,
    total_score: r.total_score as number,
    assessed_by: r.assessed_by as string | null,
    created_at: r.created_at as string | null,
    updated_at: r.updated_at as string | null,
    karyawan: employeeMap.get(r.employee_id as string) || null,
  }));
}

/** Latest readiness total_score per employee (most recent year wins). This is
 * the ONE formula every succession page should use: prefer a real assessment,
 * fall back to average KPI score, never a fabricated headcount-based number. */
export async function getLatestReadinessByEmployee(): Promise<Record<string, number>> {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("penilaian_kesiapan_suksesi")
    .select("employee_id, year, total_score")
    .order("year", { ascending: false });
  if (MISSING_TABLE(error?.code) || error) return {};
  const map: Record<string, number> = {};
  for (const row of (data || []) as Array<Record<string, unknown>>) {
    const eid = row.employee_id as string;
    if (!(eid in map)) map[eid] = Number(row.total_score) || 0;
  }
  return map;
}

// ── Succession Candidates ──────────────────────────────────────────────────
// Kept separate from succession_readiness_assessments: "menambahkan kandidat
// ke rencana suksesi" is a distinct action from "menilai kesiapan".

export async function addSuccessionCandidate(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const targetPositionEmployeeId = (formData.get("target_position_employee_id") as string || "").trim();
  const readinessRaw = (formData.get("readiness_override") as string || "").trim();
  const notes = (formData.get("notes") as string || "").trim() || null;

  if (!employeeId) return { error: "Pilih karyawan terlebih dahulu." };

  let readinessOverride: number | null = null;
  if (readinessRaw) {
    const parsed = parseInt(readinessRaw, 10);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      return { error: "Tingkat kesiapan harus di antara 0 dan 100." };
    }
    readinessOverride = parsed;
  }

  const { data: existing } = await supabaseAdmin
    .from("kandidat_suksesor")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("kandidat_suksesor").upsert({
    id: (existing as { id: string } | null)?.id || ("sc-" + crypto.randomUUID()),
    employee_id: employeeId,
    target_position_employee_id: targetPositionEmployeeId || null,
    readiness_override: readinessOverride,
    notes,
    added_by: user.name || user.email,
  }, { onConflict: "employee_id" });

  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704008_succession_planning_tables.sql terlebih dahulu." };
  if (error) { console.error("[succession] addSuccessionCandidate error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/succession/candidates");
  revalidatePath("/hrd/succession");
  return { success: true };
}

export async function getSuccessionCandidates() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("kandidat_suksesor")
    .select("*")
    .order("created_at", { ascending: false });
  if (MISSING_TABLE(error?.code) || error) return [];
  const rows = (data || []) as Array<Record<string, unknown>>;
  const employeeIds = [...new Set([
    ...rows.map((r) => r.employee_id as string),
    ...rows.map((r) => r.target_position_employee_id as string).filter(Boolean),
  ])];
  const { data: employees } = employeeIds.length > 0
    ? await supabaseAdmin.from("karyawan").select("id, full_name, department, position").in("id", employeeIds)
    : { data: [] };
  const employeeMap = new Map((employees || []).map((e: Record<string, unknown>) => [e.id as string, e as unknown as EmployeeRef]));
  return rows.map((r) => ({
    id: r.id as string,
    employee_id: r.employee_id as string,
    target_position_employee_id: r.target_position_employee_id as string | null,
    readiness_override: r.readiness_override as number | null,
    notes: r.notes as string | null,
    added_by: r.added_by as string | null,
    created_at: r.created_at as string | null,
    employee: employeeMap.get(r.employee_id as string) || null,
    target_position: r.target_position_employee_id ? employeeMap.get(r.target_position_employee_id as string) || null : null,
  }));
}

// ── Critical Positions ──────────────────────────────────────────────────────

export async function addCriticalPosition(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const riskLevel = (formData.get("risk_level") as string || "").trim();
  const vacancyRiskDate = (formData.get("vacancy_risk_date") as string || "").trim();

  if (!employeeId) return { error: "Pilih karyawan terlebih dahulu." };
  const RISK_LEVELS = ["Rendah", "Sedang", "Tinggi"];
  if (!RISK_LEVELS.includes(riskLevel)) return { error: "Tingkat risiko wajib dipilih." };

  const { data: existing } = await supabaseAdmin
    .from("posisi_kritis")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("posisi_kritis").upsert({
    id: (existing as { id: string } | null)?.id || ("scp-" + crypto.randomUUID()),
    employee_id: employeeId,
    risk_level: riskLevel,
    vacancy_risk_date: vacancyRiskDate || null,
    marked_by: user.name || user.email,
  }, { onConflict: "employee_id" });

  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704008_succession_planning_tables.sql terlebih dahulu." };
  if (error) { console.error("[succession] addCriticalPosition error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/succession/positions");
  revalidatePath("/hrd/succession");
  return { success: true };
}

export async function getCriticalPositions() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("posisi_kritis")
    .select("*")
    .order("created_at", { ascending: false });
  if (MISSING_TABLE(error?.code) || error) return [];
  const rows = (data || []) as Array<Record<string, unknown>>;
  const employeeIds = [...new Set(rows.map((r) => r.employee_id as string))];
  const { data: employees } = employeeIds.length > 0
    ? await supabaseAdmin.from("karyawan").select("id, full_name, department, position").in("id", employeeIds)
    : { data: [] };
  const employeeMap = new Map((employees || []).map((e: Record<string, unknown>) => [e.id as string, e as unknown as EmployeeRef]));
  return rows.map((r) => ({
    id: r.id as string,
    employee_id: r.employee_id as string,
    risk_level: r.risk_level as string,
    vacancy_risk_date: r.vacancy_risk_date as string | null,
    marked_by: r.marked_by as string | null,
    created_at: r.created_at as string | null,
    employee: employeeMap.get(r.employee_id as string) || null,
  }));
}

// ── Talent Pool ───────────────────────────────────────────────────────────

export async function addToTalentPool(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const potentialRating = (formData.get("potential_rating") as string || "").trim();
  const notes = (formData.get("notes") as string || "").trim() || null;

  if (!employeeId) return { error: "Pilih karyawan terlebih dahulu." };
  const RATINGS = ["Bintang", "Potensial Tinggi", "Solid", "Perlu Pengembangan"];
  if (!RATINGS.includes(potentialRating)) return { error: "Rating potensi wajib dipilih." };

  const { data: existing } = await supabaseAdmin
    .from("pool_suksesi")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("pool_suksesi").upsert({
    id: (existing as { id: string } | null)?.id || ("stp-" + crypto.randomUUID()),
    employee_id: employeeId,
    potential_rating: potentialRating,
    notes,
    added_by: user.name || user.email,
  }, { onConflict: "employee_id" });

  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704008_succession_planning_tables.sql terlebih dahulu." };
  if (error) { console.error("[succession] addToTalentPool error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/succession/talentpool");
  revalidatePath("/hrd/succession");
  return { success: true };
}

export async function getTalentPoolEntries() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("pool_suksesi")
    .select("*")
    .order("created_at", { ascending: false });
  if (MISSING_TABLE(error?.code) || error) return [];
  const rows = (data || []) as Array<Record<string, unknown>>;
  const employeeIds = [...new Set(rows.map((r) => r.employee_id as string))];
  const { data: employees } = employeeIds.length > 0
    ? await supabaseAdmin.from("karyawan").select("id, full_name, department, position").in("id", employeeIds)
    : { data: [] };
  const employeeMap = new Map((employees || []).map((e: Record<string, unknown>) => [e.id as string, e as unknown as EmployeeRef]));
  return rows.map((r) => ({
    id: r.id as string,
    employee_id: r.employee_id as string,
    potential_rating: r.potential_rating as string,
    notes: r.notes as string | null,
    added_by: r.added_by as string | null,
    created_at: r.created_at as string | null,
    employee: employeeMap.get(r.employee_id as string) || null,
  }));
}
