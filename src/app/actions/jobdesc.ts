"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => "jd-" + crypto.randomUUID();

interface JobDesc {
  id: string; position: string; department: string;
  responsibilities: string[]; requirements: string[];
}

export async function getJobDescs(): Promise<JobDesc[]> {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("job_descriptions").select("*").order("department", { ascending: true }).order("position", { ascending: true });
  return (data as JobDesc[]) || [];
}

export async function saveJobDesc(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const responsibilities = (formData.get("responsibilities") as string || "").split("\n").filter(Boolean);
  const requirements = (formData.get("requirements") as string || "").split("\n").filter(Boolean);

  if (!position) return { error: "Posisi wajib diisi." };

  const now = new Date().toISOString();
  if (id) {
    const { error } = await supabaseAdmin.from("job_descriptions").update({
      position, department, responsibilities, requirements, updated_at: now,
    }).eq("id", id);
    if (error) {
      console.error("[jobdesc] saveJobDesc error:", error.message);
      return { error: "Gagal memproses. Silakan coba lagi." };
    }
  } else {
    const newId = uid();
    const { error } = await supabaseAdmin.from("job_descriptions").insert({
      id: newId, position, department, responsibilities, requirements, created_at: now, updated_at: now,
    });
    if (error) {
      console.error("[jobdesc] addJobDesc error:", error.message);
      return { error: "Gagal memproses. Silakan coba lagi." };
    }
  }

  revalidatePath("/hrd/workplace/jobdesc");
  return { success: true };
}

export async function deleteJobDesc(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("job_descriptions").delete().eq("id", id);
  if (error) { console.error("[jobdesc] deleteJobDesc error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/workplace/jobdesc");
  return { success: true };
}
