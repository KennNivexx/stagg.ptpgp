"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";

export async function getMyApplicationData() {
  const user = await requireRole("applicant");

  // Run independent queries in parallel
  const [
    { data: userRecord },
    { data: application },
  ] = await Promise.all([
    supabaseAdmin
      .from("users")
      .select("is_temporary, expires_at")
      .eq("email", user.email)
      .maybeSingle(),
    supabaseAdmin
      .from("applications")
      .select("*")
      .eq("email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!application) return null;

  const app = application as Record<string, unknown>;

  // Get job details (depends on application.job_id)
  const { data: job } = await supabaseAdmin
    .from("job_postings")
    .select("position, department, location, requirements, education, experience, description")
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
      is_temporary: (userRecord as Record<string, unknown> | null)?.is_temporary as boolean ?? false,
      expires_at: (userRecord as Record<string, unknown> | null)?.expires_at as string || null,
    },
  };
}

export async function getAllMyApplications() {
  const user = await requireRole("applicant");

  const { data: applications } = await supabaseAdmin
    .from("applications")
    .select("id, job_id, status, applied_at, created_at")
    .eq("email", user.email)
    .order("created_at", { ascending: false });

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
