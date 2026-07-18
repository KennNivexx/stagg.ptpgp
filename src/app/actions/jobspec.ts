"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuth } from "@/lib/auth-guard";

const uid = () => "js-" + crypto.randomUUID();

export interface JobSpec {
  id: string; title: string; position: string; department: string; kode: string;
  education: string; experience: string; skills: string[]; certifications: string[]; jabatan_id?: string | null;
}

export async function getJobSpecs(): Promise<JobSpec[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("spesifikasi_kerja").select("*").order("department", { ascending: true }).order("position", { ascending: true });
  return ((data || []) as JobSpec[]).map(d => ({ ...d, title: d.title || "", kode: d.kode || "" }));
}

// Department-scoped read accessor, for bundling alongside the employee /
// department-head Deskripsi Kerja page if desired.
export async function getJobSpecsForDepartment(department: string): Promise<JobSpec[]> {
  await requireAuth();
  if (!department) return [];
  const { data } = await supabaseAdmin.from("spesifikasi_kerja").select("*").eq("department", department);
  return ((data || []) as JobSpec[]).map(d => ({ ...d, title: d.title || "", kode: d.kode || "" }));
}

export async function saveJobSpec(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const kode = (formData.get("kode") as string || "").trim();
  const education = (formData.get("education") as string || "").trim();
  const experience = (formData.get("experience") as string || "").trim();
  const jabatan_id = (formData.get("jabatan_id") as string || "").trim() || null;
  let skills: string[], certifications: string[];
  try {
    skills = (JSON.parse((formData.get("skills") as string) || "[]") as string[]).map(s => s.trim()).filter(Boolean);
    certifications = (JSON.parse((formData.get("certifications") as string) || "[]") as string[]).map(s => s.trim()).filter(Boolean);
  } catch {
    return { error: "Format skills/sertifikasi tidak valid." };
  }

  if (!department) return { error: "Departemen wajib dipilih." };
  if (!kode) return { error: "Kode perusahaan wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(kode)) return { error: "Format kode perusahaan tidak valid (contoh: 1.1.2.1.1.0.0)." };

  const now = new Date().toISOString();
  if (id) {
    const { error } = await supabaseAdmin.from("spesifikasi_kerja").update({
      title, position, department, kode, jabatan_id, education, experience, skills, certifications, updated_at: now,
    }).eq("id", id);
    if (error) {
      console.error("[jobspec] saveJobSpec error:", error.message);
      return { error: "Gagal memproses. Silakan coba lagi." };
    }
  } else {
    const newId = uid();
    const { error } = await supabaseAdmin.from("spesifikasi_kerja").insert({
      id: newId, title, position, department, kode, jabatan_id, education, experience, skills, certifications, created_at: now, updated_at: now,
    });
    if (error) {
      console.error("[jobspec] addJobSpec error:", error.message);
      return { error: "Gagal memproses. Silakan coba lagi." };
    }
  }

  revalidatePath("/hrd/workplace/jobspec");
  return { success: true };
}

export async function deleteJobSpec(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("spesifikasi_kerja").delete().eq("id", id);
  if (error) { console.error("[jobspec] deleteJobSpec error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/workplace/jobspec");
  return { success: true };
}
