"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";

export async function getMyApplicationData() {
  const user = await requireRole("applicant");

  // Ambil data user (untuk account info + application_id)
  const { data: userRecord } = await supabaseAdmin
    .from("users")
    .select("is_temporary, expires_at, application_id")
    .eq("email", user.email)
    .maybeSingle();

  const ur = userRecord as Record<string, unknown> | null;

  // Cari application: lewat application_id dulu (paling akurat), fallback lewat email
  let application: Record<string, unknown> | null = null;

  if (ur?.application_id) {
    const { data } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("id", ur.application_id as string)
      .maybeSingle();
    application = data as Record<string, unknown> | null;
  }

  // Fallback: cari lewat email (normalized)
  if (!application) {
    const { data } = await supabaseAdmin
      .from("applications")
      .select("*")
      .eq("email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    application = data as Record<string, unknown> | null;

    // Kalau ketemu, simpan application_id ke users agar berikutnya langsung
    if (application && ur) {
      await supabaseAdmin
        .from("users")
        .update({ application_id: application.id })
        .eq("email", user.email);
    }
  }

  // Last-resort: cari via email case-insensitive (ilike) jika belum ketemu
  if (!application) {
    const { data } = await supabaseAdmin
      .from("applications")
      .select("*")
      .ilike("email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    application = data as Record<string, unknown> | null;
  }

  if (!application) return null;

  const app = application as Record<string, unknown>;

  // Get job details — gunakan select("*") agar aman meski ada kolom yang belum ada
  const { data: job } = await supabaseAdmin
    .from("job_postings")
    .select("id, position, department, location, requirements, education, experience, description, title")
    .eq("id", app.job_id as string)
    .maybeSingle();

  // Parse profile data
  let profileData: Record<string, unknown> = {};
  try {
    profileData = JSON.parse(app.resume_url as string || "{}");
  } catch {
    profileData = {};
  }

  return {
    application: {
      id: app.id as string,
      status: app.status as string,
      applied_at: app.applied_at as string || app.created_at as string,
      full_name: app.full_name as string,
      email: app.email as string,
      phone: app.phone as string,
      reached_interview: !!app.reached_interview,
      test_tulis_result: app.test_tulis_result ?? null,
      test_psikotes_result: app.test_psikotes_result ?? null,
    },
    job: job ? {
      position: (job as Record<string, unknown>).position as string,
      department: (job as Record<string, unknown>).department as string,
      location: (job as Record<string, unknown>).location as string,
      requirements: (job as Record<string, unknown>).requirements as string,
      education: (job as Record<string, unknown>).education as string,
      experience: (job as Record<string, unknown>).experience as string,
      description: (job as Record<string, unknown>).description as string,
    } : null,
    profileData,
    account: {
      is_temporary: ur?.is_temporary as boolean ?? false,
      expires_at: ur?.expires_at as string || null,
    },
  };
}

export async function getAllMyApplications() {
  const user = await requireRole("applicant");

  // Coba email dulu, fallback ke application_id
  let { data: applications } = await supabaseAdmin
    .from("applications")
    .select("id, job_id, status, applied_at, created_at")
    .eq("email", user.email)
    .order("created_at", { ascending: false });

  if (!applications || applications.length === 0) {
    const { data: userRecord } = await supabaseAdmin
      .from("users")
      .select("application_id")
      .eq("email", user.email)
      .maybeSingle();
    const ur = userRecord as Record<string, unknown> | null;
    if (ur?.application_id) {
      const { data } = await supabaseAdmin
        .from("applications")
        .select("id, job_id, status, applied_at, created_at")
        .eq("id", ur.application_id as string)
        .limit(1);
      applications = data;
    }
  }

  if (!applications || applications.length === 0) return [];

  const jobIds = [...new Set((applications as Record<string, unknown>[]).map(a => a.job_id as string))];
  const { data: jobs } = await supabaseAdmin
    .from("job_postings")
    .select("id, position, department")
    .in("id", jobIds);

  const jobMap = new Map((jobs || []).map((j: Record<string, unknown>) => [j.id as string, j]));

  return (applications as Record<string, unknown>[]).map(a => {
    const job = jobMap.get(a.job_id as string) as Record<string, unknown> | undefined;
    return {
      id: a.id as string,
      status: a.status as string,
      applied_at: a.applied_at as string || a.created_at as string,
      position: job?.position as string || "—",
      department: job?.department as string || "—",
    };
  });
}

export async function getHrdApplications() {
  await requireRole("hrd", "superadmin");

  const [{ data: apps }, { data: jbs }] = await Promise.all([
    supabaseAdmin.from("applications").select("*").order("applied_at", { ascending: false }).limit(100),
    supabaseAdmin.from("job_postings").select("id, position, department").order("position", { ascending: true }),
  ]);

  const jobMap = new Map((jbs || []).map((j: Record<string, unknown>) => [j.id as string, j]));
  const applications = (apps || []).map((app: Record<string, unknown>) => ({
    ...app,
    job_postings: jobMap.get(app.job_id as string) || null,
  }));

  return { applications, jobs: jbs || [] };
}
