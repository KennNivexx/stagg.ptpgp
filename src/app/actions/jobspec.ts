"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "js-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);

interface JobSpec {
  id: string; position: string; department: string;
  education: string; experience: string; skills: string[]; certifications: string[];
}

export async function getJobSpecs(): Promise<JobSpec[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("job_specifications").select("*").order("department", { ascending: true }).order("position", { ascending: true });
  return (data as JobSpec[]) || [];
}

export async function saveJobSpec(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const education = (formData.get("education") as string || "").trim();
  const experience = (formData.get("experience") as string || "").trim();
  const skills = (formData.get("skills") as string || "").split("\n").filter(Boolean);
  const certifications = (formData.get("certifications") as string || "").split("\n").filter(Boolean);

  if (!position) return { error: "Posisi wajib diisi." };

  const now = new Date().toISOString();
  if (id) {
    const { error } = await supabaseAdmin.from("job_specifications").update({
      position, department, education, experience, skills, certifications, updated_at: now,
    }).eq("id", id);
    if (error) return { error: "Gagal mengupdate spesifikasi pekerjaan." };
  } else {
    const newId = uid();
    const { error } = await supabaseAdmin.from("job_specifications").insert({
      id: newId, position, department, education, experience, skills, certifications, created_at: now, updated_at: now,
    });
    if (error) return { error: "Gagal menambah spesifikasi pekerjaan." };
  }

  revalidatePath("/hrd/workplace/jobspec");
  return { success: true };
}

export async function deleteJobSpec(id: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("job_specifications").delete().eq("id", id);
  revalidatePath("/hrd/workplace/jobspec");
  return { success: true };
}
