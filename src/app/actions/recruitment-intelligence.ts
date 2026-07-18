"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { computeMatchScoreCore, yearsFromExperiences, type MatchResult, type ProfileData } from "@/lib/recruitment-scoring";

/**
 * Recruitment Intelligence — rule-based recommendations computed from data
 * that genuinely exists (candidate's self-reported experiences/educations/
 * skills from the public application form, job posting requirements, real
 * written-test/psikotes scores, grade/salary band). Matches this app's
 * established principle (see Manpower Validation Engine): AI recommends,
 * never decides — every number here traces to a real row, nothing fabricated.
 *
 * The actual scoring math lives in src/lib/recruitment-scoring.ts (a plain
 * module, not "use server") because submitApplication in actions/hrd.ts
 * needs to trigger it for anonymous public applicants — before any HRD
 * session exists to check a role against. Every exported async function in
 * a "use server" file is a directly callable endpoint regardless of whether
 * client code references it, so an unauthenticated version can't live here.
 */

export type { MatchResult, MatchComponent } from "@/lib/recruitment-scoring";

export async function computeCandidateMatchScore(applicationId: string): Promise<{ error: string } | { success: true; result: MatchResult }> {
  await requireRole("hrd", "superadmin");
  const result = await computeMatchScoreCore(applicationId);
  if ("success" in result) revalidatePath("/hrd/recruitment/pipeline");
  return result;
}

export interface FinalEvalResult { score: number; components: { key: string; label: string; score: number | null; weight: number }[]; computedAt: string }

/** Combines every score this app actually has for a candidate — match score,
 * written test, psikotes — into one weighted Final Score. Components with no
 * data yet are excluded and weight redistributed, rather than treated as 0,
 * so an application that hasn't reached a stage isn't unfairly penalized. */
export async function computeFinalEvaluation(applicationId: string): Promise<{ error: string } | { success: true; result: FinalEvalResult }> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("pelamar")
    .select("match_score, test_tulis_result, test_psikotes_result").eq("id", applicationId).maybeSingle();
  if (!data) return { error: "Lamaran tidak ditemukan." };
  const row = data as { match_score: number | null; test_tulis_result: { score?: number } | null; test_psikotes_result: { overall?: number } | null };

  const all = [
    { key: "match", label: "Kecocokan CV & Job Spec", score: row.match_score, weight: 25 },
    { key: "tulis", label: "Tes Tertulis", score: row.test_tulis_result?.score ?? null, weight: 35 },
    { key: "psikotes", label: "Psikotes", score: row.test_psikotes_result?.overall ?? null, weight: 40 },
  ];
  const available = all.filter(c => c.score != null);
  const totalWeight = available.reduce((s, c) => s + c.weight, 0);
  const score = totalWeight > 0
    ? Math.round(available.reduce((s, c) => s + (c.score as number) * c.weight, 0) / totalWeight)
    : 0;

  const result: FinalEvalResult = { score, components: all, computedAt: new Date().toISOString() };
  await supabaseAdmin.from("pelamar").update({ final_score: score, final_score_detail: result }).eq("id", applicationId);
  revalidatePath("/hrd/recruitment/pipeline");
  revalidatePath("/hrd/recruitment/decisions");
  return { success: true, result };
}

export interface SalaryRecommendation { min: number; max: number; suggested: number; basis: string }

/** Real arithmetic over grade_jabatan's salary band, nudged by the
 * candidate's years of experience within that band — not a fabricated
 * number, and never auto-applied (setOfferedSalary in recruitment.ts still
 * requires an HRD click either way). */
export async function getSalaryRecommendation(applicationId: string): Promise<{ error: string } | { success: true; result: SalaryRecommendation }> {
  await requireRole("hrd", "superadmin");
  const { data: appRow } = await supabaseAdmin.from("pelamar").select("resume_url, job_id").eq("id", applicationId).maybeSingle();
  if (!appRow) return { error: "Lamaran tidak ditemukan." };
  const app = appRow as { resume_url: string | null; job_id: string | null };
  if (!app.job_id) return { error: "Lowongan untuk lamaran ini tidak ditemukan." };

  const { data: jobRow } = await supabaseAdmin.from("lowongan_kerja").select("position, department").eq("id", app.job_id).maybeSingle();
  const job = jobRow as { position?: string; department?: string } | null;
  if (!job) return { error: "Lowongan tidak ditemukan." };

  const { data: jabatanRow } = await supabaseAdmin.from("jabatan")
    .select("grade_id").eq("name", job.position || "").eq("department", job.department || "").maybeSingle();
  const gradeId = (jabatanRow as { grade_id?: string } | null)?.grade_id;
  if (!gradeId) return { error: "Grade untuk posisi ini belum terhubung ke Master Jabatan — tidak dapat menghitung rekomendasi gaji." };

  const { data: gradeRow } = await supabaseAdmin.from("grade_jabatan").select("salary_min, salary_max").eq("id", gradeId).maybeSingle();
  const grade = gradeRow as { salary_min: number | null; salary_max: number | null } | null;
  if (!grade?.salary_min || !grade?.salary_max) return { error: "Salary band untuk grade posisi ini belum ditetapkan." };

  let profile: ProfileData = {};
  try { profile = JSON.parse(app.resume_url || "{}"); } catch { profile = {}; }
  const years = (profile.experiences || []).length > 0 ? yearsFromExperiences(profile.experiences || []) : 0;
  // More experience → position further up the band, capped at the max.
  // 0 years -> band min; 10+ years -> band max; linear in between.
  const position = Math.min(1, years / 10);
  const suggested = Math.round(grade.salary_min + (grade.salary_max - grade.salary_min) * position);

  return {
    success: true,
    result: {
      min: grade.salary_min, max: grade.salary_max, suggested,
      basis: `Salary band grade posisi Rp${grade.salary_min.toLocaleString("id-ID")}–Rp${grade.salary_max.toLocaleString("id-ID")}, disesuaikan dari ${years} tahun pengalaman kandidat.`,
    },
  };
}

export interface SLAFlag { applicationId: string; fullName: string; stage: string; daysInStage: number; thresholdDays: number }

/** Flags applications sitting past their stage's configured SLA threshold —
 * pure date-math over applied_at/status, no ML. */
export async function getRecruitmentSLAStatus(): Promise<SLAFlag[]> {
  await requireRole("hrd", "superadmin", "director");
  const [{ data: slaRows }, { data: apps }] = await Promise.all([
    supabaseAdmin.from("recruitment_sla_config").select("stage, threshold_days"),
    supabaseAdmin.from("pelamar").select("id, full_name, status, applied_at, created_at")
      .not("status", "in", "(Diterima,Ditolak,Dibatalkan)"),
  ]);
  const thresholds = new Map((slaRows || []).map((r: { stage: string; threshold_days: number }) => [r.stage, r.threshold_days]));
  const now = Date.now();
  const flags: SLAFlag[] = [];
  for (const a of (apps || []) as { id: string; full_name: string; status: string; applied_at: string | null; created_at: string }[]) {
    const threshold = thresholds.get(a.status);
    if (threshold == null) continue;
    const since = new Date(a.applied_at || a.created_at).getTime();
    const days = Math.floor((now - since) / 86_400_000);
    if (days > threshold) {
      flags.push({ applicationId: a.id, fullName: a.full_name, stage: a.status, daysInStage: days, thresholdDays: threshold });
    }
  }
  return flags.sort((a, b) => b.daysInStage - a.daysInStage);
}

export interface ChannelStat { channel: string; applications: number; hired: number; conversionPct: number }

/** Real conversion-rate aggregation per recruitment_channel — requires
 * channel_id to actually be set on applications (new field, so this will be
 * empty until the application form starts collecting it). */
export async function getChannelEffectiveness(): Promise<ChannelStat[]> {
  await requireRole("hrd", "superadmin", "director");
  const { data: apps } = await supabaseAdmin.from("pelamar").select("channel_id, status");
  const { data: channels } = await supabaseAdmin.from("recruitment_channel").select("id, name");
  const channelMap = new Map((channels || []).map((c: { id: string; name: string }) => [c.id, c.name]));

  const agg: Record<string, { total: number; hired: number }> = {};
  for (const a of (apps || []) as { channel_id: string | null; status: string }[]) {
    const name = a.channel_id ? channelMap.get(a.channel_id) || "Tidak diketahui" : "Tidak dicatat";
    if (!agg[name]) agg[name] = { total: 0, hired: 0 };
    agg[name].total++;
    if (a.status === "Diterima") agg[name].hired++;
  }
  return Object.entries(agg)
    .map(([channel, { total, hired }]) => ({ channel, applications: total, hired, conversionPct: total > 0 ? Math.round((hired / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.applications - a.applications);
}

export async function getRecruitmentChannels() {
  const { data } = await supabaseAdmin.from("recruitment_channel").select("*").eq("is_active", true).order("urutan");
  return data || [];
}
