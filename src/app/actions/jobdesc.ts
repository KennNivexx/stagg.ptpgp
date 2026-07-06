"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole, requireAuth } from "@/lib/auth-guard";

const uid = () => "jd-" + crypto.randomUUID();

export interface JobDesc {
  id: string; title: string; position: string; department: string; kode: string;
  responsibilities: string[]; requirements: string[];
}

export async function getJobDescs(): Promise<JobDesc[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("job_descriptions").select("*").order("department", { ascending: true }).order("position", { ascending: true });
  return ((data || []) as JobDesc[]).map(d => ({ ...d, title: d.title || "", kode: d.kode || "" }));
}

// Read-only accessor for the employee/department-head portals — a position
// can have multiple job-description entries, so this always returns a list.
export async function getJobDescsForPosition(position: string): Promise<JobDesc[]> {
  await requireAuth();
  if (!position) return [];
  const { data } = await supabaseAdmin.from("job_descriptions").select("*").eq("position", position);
  return ((data || []) as JobDesc[]).map(d => ({ ...d, title: d.title || "", kode: d.kode || "" }));
}

export async function getJobDescsForDepartment(department: string): Promise<JobDesc[]> {
  await requireAuth();
  if (!department) return [];
  const { data } = await supabaseAdmin.from("job_descriptions").select("*").eq("department", department).order("position", { ascending: true });
  return ((data || []) as JobDesc[]).map(d => ({ ...d, title: d.title || "", kode: d.kode || "" }));
}

export async function saveJobDesc(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const kode = (formData.get("kode") as string || "").trim();
  const responsibilities = (JSON.parse((formData.get("responsibilities") as string) || "[]") as string[]).map(s => s.trim()).filter(Boolean);
  const requirements = (JSON.parse((formData.get("requirements") as string) || "[]") as string[]).map(s => s.trim()).filter(Boolean);

  if (!position) return { error: "Posisi wajib diisi." };
  if (!kode) return { error: "Kode perusahaan wajib diisi." };
  if (!/^\d+(\.\d+)+$/.test(kode)) return { error: "Format kode perusahaan tidak valid (contoh: 1.1.2.1.1.0.0)." };

  const now = new Date().toISOString();
  if (id) {
    const { error } = await supabaseAdmin.from("job_descriptions").update({
      title, position, department, kode, responsibilities, requirements, updated_at: now,
    }).eq("id", id);
    if (error) {
      console.error("[jobdesc] saveJobDesc error:", error.message);
      return { error: "Gagal memproses. Silakan coba lagi." };
    }
  } else {
    const newId = uid();
    const { error } = await supabaseAdmin.from("job_descriptions").insert({
      id: newId, title, position, department, kode, responsibilities, requirements, created_at: now, updated_at: now,
    });
    if (error) {
      console.error("[jobdesc] addJobDesc error:", error.message);
      return { error: "Gagal memproses. Silakan coba lagi." };
    }
  }

  revalidatePath("/hrd/workplace/jobdesc");
  revalidatePath("/employee/jobdesc");
  revalidatePath("/department/jobdesc");
  return { success: true };
}

export async function deleteJobDesc(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("job_descriptions").delete().eq("id", id);
  if (error) { console.error("[jobdesc] deleteJobDesc error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/workplace/jobdesc");
  revalidatePath("/employee/jobdesc");
  revalidatePath("/department/jobdesc");
  return { success: true };
}
