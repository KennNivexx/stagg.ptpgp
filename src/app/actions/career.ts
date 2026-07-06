"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";

const MISSING_CAREER_REQUESTS_TABLE = "Fitur ini belum aktif. Hubungi admin untuk menjalankan migrasi career_requests.";

export async function submitInternalApplication(jobTitle: string, jobDept: string) {
  const user = await requireRole("employee", "hrd", "superadmin");
  const { error } = await supabaseAdmin.from("career_requests").insert({
    id: crypto.randomUUID(),
    employee_email: user.email,
    employee_name: user.name || user.email,
    type: "application",
    job_title: jobTitle,
    job_department: jobDept,
    status: "Pending",
    created_at: new Date().toISOString(),
  });
  if (error && (error.message.includes("Could not find the table") || error.code === "42P01")) {
    return { error: MISSING_CAREER_REQUESTS_TABLE };
  }
  if (error) { console.error("[career] submitInternalApplication error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  return { success: true };
}

export async function requestCareerConsultation() {
  const user = await requireRole("employee", "hrd", "superadmin");
  const { error } = await supabaseAdmin.from("career_requests").insert({
    id: crypto.randomUUID(),
    employee_email: user.email,
    employee_name: user.name || user.email,
    type: "consultation",
    status: "Pending",
    created_at: new Date().toISOString(),
  });
  if (error && (error.message.includes("Could not find the table") || error.code === "42P01")) {
    return { error: MISSING_CAREER_REQUESTS_TABLE };
  }
  if (error) { console.error("[career] requestCareerConsultation error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  return { success: true };
}
