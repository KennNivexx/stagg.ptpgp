"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export interface Question {
  id: string;
  text: string;
  type: "pilihan_ganda" | "skala";
  // pilihan_ganda
  options?: string[];
  correct_answer?: string;
  points?: number;
  // skala (psikotes)
  dimension?: string;
  scale?: number;
  reverse?: boolean;
}

export interface RecruitmentTest {
  id: string;
  job_posting_id: string | null;
  test_type: "tulis" | "psikotes";
  title: string;
  instructions: string;
  questions: Question[];
  duration_minutes: number;
  passing_score: number;
  is_active: boolean;
  created_at: string;
  department: string | null;
  test_year: number | null;
}

// ── HRD: Get all tests ─────────────────────────────────────────────────────
export async function getAllRecruitmentTests() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("recruitment_tests")
    .select("id, job_posting_id, test_type, title, duration_minutes, passing_score, is_active, created_at, department, test_year")
    .order("created_at", { ascending: false });
  if (error?.code === "42P01") return [];
  if (error?.code === "42703") {
    // department/test_year columns not migrated yet — fall back to old shape.
    const { data: fallback } = await supabaseAdmin
      .from("recruitment_tests")
      .select("id, job_posting_id, test_type, title, duration_minutes, passing_score, is_active, created_at")
      .order("created_at", { ascending: false });
    return (fallback || []).map((t) => ({ ...t, department: null, test_year: null }));
  }
  if (error) return [];
  return data || [];
}

// ── HRD: Get single test with questions ────────────────────────────────────
export async function getRecruitmentTest(testId: string) {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("recruitment_tests")
    .select("*")
    .eq("id", testId)
    .single();
  if (error) return null;
  return data as RecruitmentTest;
}

// ── HRD: Save test (create or update) ─────────────────────────────────────
export async function saveRecruitmentTest(
  testId: string | null,
  payload: {
    job_posting_id: string | null;
    test_type: "tulis" | "psikotes";
    title: string;
    instructions: string;
    questions: Question[];
    duration_minutes: number;
    passing_score: number;
    is_active: boolean;
    department?: string | null;
    test_year?: number | null;
  }
): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  if (testId) {
    const { error } = await supabaseAdmin
      .from("recruitment_tests")
      .update(payload)
      .eq("id", testId);
    if (error?.code === "42703") return { error: "Jalankan migrasi 20260709001_workflow_overhaul.sql terlebih dahulu." };
    if (error) return { error: error.message };
  } else {
    const { error } = await supabaseAdmin
      .from("recruitment_tests")
      .insert({ id: "test-" + crypto.randomUUID(), ...payload, created_at: new Date().toISOString() });
    if (error?.code === "42P01") return { error: "Jalankan migrasi 20260701001 terlebih dahulu." };
    if (error?.code === "42703") return { error: "Jalankan migrasi 20260709001_workflow_overhaul.sql terlebih dahulu." };
    if (error) return { error: error.message };
  }
  revalidatePath("/hrd/recruitment/tests");
  return { success: true };
}

// ── HRD: Delete test ───────────────────────────────────────────────────────
export async function deleteRecruitmentTest(testId: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin
    .from("recruitment_tests")
    .delete()
    .eq("id", testId);
  if (error) return { error: error.message };
  revalidatePath("/hrd/recruitment/tests");
  return { success: true };
}

// ── Applicant: Get available tests for their application ───────────────────
export async function getApplicantTests() {
  const session = await requireRole("applicant");

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("application_id")
    .eq("email", session.email)
    .maybeSingle();

  // Cari application: lewat application_id dulu, fallback lewat email
  let application: Record<string, unknown> | null = null;

  if (user?.application_id) {
    const { data } = await supabaseAdmin
      .from("applications")
      .select("id, job_id, status, test_tulis_result, test_psikotes_result")
      .eq("id", user.application_id)
      .maybeSingle();
    application = data as Record<string, unknown> | null;
  }

  // Fallback: cari lewat email (untuk akun yang dibuat tanpa application_id)
  if (!application) {
    const { data } = await supabaseAdmin
      .from("applications")
      .select("id, job_id, status, test_tulis_result, test_psikotes_result")
      .eq("email", session.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    application = data as Record<string, unknown> | null;

    // Kalau ketemu, update application_id di users supaya berikutnya langsung
    if (application && user) {
      await supabaseAdmin
        .from("users")
        .update({ application_id: application.id })
        .eq("email", session.email);
    }
  }

  if (!application) return { tulis: null, psikotes: null, alreadyTaken: {}, results: {} };

  // Tes tersedia begitu HRD memindahkan status ke tahap "Tes Tulis & Psikotes".
  // Status "Interview" juga tetap diizinkan mengakses (lihat hasil / kerjakan
  // susulan) supaya kandidat yang sudah lanjut ke interview tidak kehilangan
  // akses ke tes yang belum sempat dikerjakan.
  const testEligibleStatuses = ["Tes Tulis & Psikotes", "Interview"];
  if (!testEligibleStatuses.includes(application.status as string)) {
    return { tulis: null, psikotes: null, alreadyTaken: {}, results: {} };
  }

  // Ambil tes: yang spesifik ke lowongan ini ATAU template umum (job_posting_id IS NULL)
  const jobId = application.job_id as string | null;
  let testsQuery = supabaseAdmin
    .from("recruitment_tests")
    .select("id, test_type, title, instructions, questions, duration_minutes, passing_score")
    .eq("is_active", true);

  if (jobId) {
    testsQuery = testsQuery.or(`job_posting_id.eq.${jobId},job_posting_id.is.null`);
  } else {
    testsQuery = testsQuery.is("job_posting_id", null);
  }

  const { data: tests } = await testsQuery;

  // Strip correct_answer — tidak pernah dikirim ke client
  const stripAnswers = (test: Record<string, unknown> | undefined) => {
    if (!test) return null;
    return {
      ...test,
      questions: (test.questions as Question[]).map(({ correct_answer: _ca, ...q }) => q),
    };
  };

  const tulis = tests?.find(t => t.test_type === "tulis");
  const psikotes = tests?.find(t => t.test_type === "psikotes");

  return {
    applicationId: application.id,
    tulis: stripAnswers(tulis as Record<string, unknown>),
    psikotes: stripAnswers(psikotes as Record<string, unknown>),
    alreadyTaken: {
      tulis: !!application.test_tulis_result,
      psikotes: !!application.test_psikotes_result,
    },
    results: {
      tulis: application.test_tulis_result,
      psikotes: application.test_psikotes_result,
    },
  };
}

// ── Helper: cari application_id pelamar (lewat users, fallback lewat email) ─
async function resolveApplicationId(email: string): Promise<string | null> {
  const { data: user } = await supabaseAdmin
    .from("users").select("application_id").eq("email", email).maybeSingle();

  if (user?.application_id) return user.application_id as string;

  // Fallback: cari langsung lewat email di applications
  const { data: app } = await supabaseAdmin
    .from("applications").select("id").eq("email", email)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (app?.id) {
    // Simpan supaya lookup berikutnya langsung
    await supabaseAdmin.from("users").update({ application_id: app.id }).eq("email", email);
    return app.id as string;
  }
  return null;
}

// ── Applicant: Submit tes tulis answers (score server-side) ────────────────
export async function submitTulisAnswers(testId: string, answers: Record<string, string>) {
  const session = await requireRole("applicant");

  const applicationId = await resolveApplicationId(session.email);
  if (!applicationId) return { error: "Lamaran tidak ditemukan." };

  const { data: app } = await supabaseAdmin
    .from("applications")
    .select("test_tulis_result")
    .eq("id", applicationId)
    .single();

  if (app?.test_tulis_result) return { error: "Tes tulis sudah dikerjakan sebelumnya." };

  // Get test WITH correct answers (server-side only)
  const { data: test } = await supabaseAdmin
    .from("recruitment_tests")
    .select("*")
    .eq("id", testId)
    .eq("test_type", "tulis")
    .single();

  if (!test) return { error: "Tes tidak ditemukan." };

  // Calculate score
  const questions = test.questions as Question[];
  let earnedPoints = 0;
  let totalPoints = 0;

  for (const q of questions) {
    if (q.type === "pilihan_ganda") {
      const pts = q.points || 10;
      totalPoints += pts;
      if (answers[q.id] === q.correct_answer) earnedPoints += pts;
    }
  }

  const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = score >= (test.passing_score as number || 70);

  const result = {
    test_id: testId,
    test_title: test.title,
    score,
    passed,
    earned_points: earnedPoints,
    total_points: totalPoints,
    total_questions: questions.length,
    answers,
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("applications")
    .update({ test_tulis_result: result })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidatePath("/applicant/test");
  return { success: true, score, passed };
}

// ── Applicant: Submit psikotes answers (dimension scoring server-side) ─────
export async function submitPsikotesAnswers(testId: string, answers: Record<string, number>) {
  const session = await requireRole("applicant");

  const applicationId = await resolveApplicationId(session.email);
  if (!applicationId) return { error: "Lamaran tidak ditemukan." };

  const { data: app } = await supabaseAdmin
    .from("applications")
    .select("test_psikotes_result")
    .eq("id", applicationId)
    .single();

  if (app?.test_psikotes_result) return { error: "Psikotes sudah dikerjakan sebelumnya." };

  const { data: test } = await supabaseAdmin
    .from("recruitment_tests")
    .select("*")
    .eq("id", testId)
    .eq("test_type", "psikotes")
    .single();

  if (!test) return { error: "Tes tidak ditemukan." };

  const questions = test.questions as Question[];
  // Each dimension tracks its OWN scale — different dimensions can use
  // different scales (e.g. 1-5 vs 1-7), so normalizing every dimension
  // against questions[0]'s scale would skew any dimension that doesn't
  // happen to share the first question's scale.
  const dimTotals: Record<string, { sum: number; count: number; maxScale: number }> = {};

  for (const q of questions) {
    if (q.type === "skala" && q.dimension) {
      const raw = answers[q.id] ?? 3;
      const maxScale = q.scale || 5;
      const score = q.reverse ? maxScale + 1 - raw : raw;
      if (!dimTotals[q.dimension]) dimTotals[q.dimension] = { sum: 0, count: 0, maxScale };
      dimTotals[q.dimension].sum += score;
      dimTotals[q.dimension].count += 1;
    }
  }

  const dimensions: Record<string, number> = {};
  for (const [dim, { sum, count, maxScale }] of Object.entries(dimTotals)) {
    dimensions[dim] = Math.round((sum / count / maxScale) * 100);
  }

  const vals = Object.values(dimensions);
  const overall = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

  const result = {
    test_id: testId,
    test_title: test.title,
    dimensions,
    overall,
    answers,
    submitted_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from("applications")
    .update({ test_psikotes_result: result })
    .eq("id", applicationId);

  if (error) return { error: error.message };

  revalidatePath("/applicant/test");
  return { success: true, dimensions, overall };
}
