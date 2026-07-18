import { supabaseAdmin } from "@/lib/supabase";

/**
 * Core candidate match-scoring logic — deliberately NOT a "use server" file.
 * Any exported async function in a "use server" file becomes a directly
 * callable server-action endpoint regardless of whether client code
 * references it, so an unauthenticated helper must never live there. This
 * plain module is imported by src/app/actions/recruitment-intelligence.ts
 * (wraps it with requireRole for the HRD-triggered "Hitung Ulang" button) and
 * by src/app/actions/hrd.ts's submitApplication (anonymous public
 * applicants — no session exists yet to check a role against).
 */

export interface Experience { company: string; position: string; start: string; end: string; current: boolean; description?: string }
export interface Education { school: string; degree: string; field: string; start: string; end: string }
export interface ProfileData { skills?: string[]; experiences?: Experience[]; educations?: Education[] }

const DEGREE_RANK: Record<string, number> = {
  "sd": 1, "smp": 2, "sma": 3, "smk": 3, "d1": 3.5, "d2": 3.5, "d3": 4,
  "d4": 5, "s1": 5, "sarjana": 5, "s2": 6, "magister": 6, "s3": 7, "doktor": 7,
};
function degreeRank(text: string): number | null {
  const t = text.toLowerCase();
  for (const [key, rank] of Object.entries(DEGREE_RANK)) {
    if (t.includes(key)) return rank;
  }
  return null;
}
export function yearsFromExperiences(experiences: Experience[]): number {
  let totalMonths = 0;
  for (const e of experiences) {
    if (!e.start) continue;
    const start = new Date(e.start);
    const end = e.current || !e.end ? new Date() : new Date(e.end);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) continue;
    totalMonths += Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()));
  }
  return Math.round((totalMonths / 12) * 10) / 10;
}
function requiredYearsFromText(text: string): number | null {
  const m = text.match(/(\d+)\s*tahun/i);
  return m ? parseInt(m[1], 10) : null;
}

export interface MatchComponent { key: string; label: string; score: number; weight: number; note: string }
export interface MatchResult { score: number; components: MatchComponent[]; computedAt: string }

export async function computeMatchScoreCore(applicationId: string): Promise<{ error: string } | { success: true; result: MatchResult }> {
  const { data: appRow } = await supabaseAdmin.from("pelamar").select("resume_url, job_id").eq("id", applicationId).maybeSingle();
  if (!appRow) return { error: "Lamaran tidak ditemukan." };
  const app = appRow as { resume_url: string | null; job_id: string | null };

  let profile: ProfileData = {};
  try { profile = JSON.parse(app.resume_url || "{}"); } catch { profile = {}; }
  const skills = profile.skills || [];
  const experiences = profile.experiences || [];
  const educations = profile.educations || [];

  const { data: jobRow } = app.job_id
    ? await supabaseAdmin.from("lowongan_kerja").select("education, experience, requirements, description").eq("id", app.job_id).maybeSingle()
    : { data: null };
  const job = (jobRow as { education?: string; experience?: string; requirements?: string; description?: string } | null) || {};

  const components: MatchComponent[] = [];

  // Education
  const reqDegreeRank = job.education ? degreeRank(job.education) : null;
  const candidateDegreeRank = educations.length > 0 ? Math.max(...educations.map(e => degreeRank(e.degree) ?? 0)) : null;
  if (reqDegreeRank != null && candidateDegreeRank != null) {
    const score = candidateDegreeRank >= reqDegreeRank ? 100 : Math.round((candidateDegreeRank / reqDegreeRank) * 100);
    components.push({ key: "education", label: "Pendidikan", score, weight: 25, note: `Kandidat ${score >= 100 ? "memenuhi" : "belum memenuhi"} level pendidikan minimal "${job.education}".` });
  } else {
    components.push({ key: "education", label: "Pendidikan", score: 0, weight: 0, note: "Tidak dapat dibandingkan — data pendidikan kandidat atau syarat lowongan tidak tersedia." });
  }

  // Experience
  const reqYears = job.experience ? requiredYearsFromText(job.experience) : null;
  const candidateYears = experiences.length > 0 ? yearsFromExperiences(experiences) : null;
  if (reqYears != null && candidateYears != null) {
    const score = Math.min(100, Math.round((candidateYears / Math.max(reqYears, 0.1)) * 100));
    components.push({ key: "experience", label: "Pengalaman Kerja", score, weight: 35, note: `Kandidat memiliki ${candidateYears} tahun pengalaman (syarat: ${reqYears} tahun).` });
  } else {
    components.push({ key: "experience", label: "Pengalaman Kerja", score: 0, weight: 0, note: "Tidak dapat dibandingkan — syarat pengalaman lowongan tidak dalam format yang bisa dibaca otomatis." });
  }

  // Skills — crude but honest keyword overlap against requirements + description text.
  const jobText = `${job.requirements || ""} ${job.description || ""}`.toLowerCase();
  if (skills.length > 0 && jobText.trim()) {
    const matched = skills.filter(s => s.trim() && jobText.includes(s.trim().toLowerCase()));
    const score = Math.round((matched.length / skills.length) * 100);
    components.push({ key: "skills", label: "Kecocokan Skill", score, weight: 40, note: `${matched.length} dari ${skills.length} skill kandidat disebut dalam persyaratan lowongan.` });
  } else {
    components.push({ key: "skills", label: "Kecocokan Skill", score: 0, weight: 0, note: "Tidak dapat dibandingkan — kandidat tidak mencantumkan skill atau lowongan tidak punya deskripsi persyaratan." });
  }

  const totalWeight = components.reduce((s, c) => s + c.weight, 0);
  const finalScore = totalWeight > 0
    ? Math.round(components.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight)
    : 0;

  const result: MatchResult = { score: finalScore, components, computedAt: new Date().toISOString() };
  await supabaseAdmin.from("pelamar").update({ match_score: finalScore, match_detail: result }).eq("id", applicationId);
  return { success: true, result };
}
