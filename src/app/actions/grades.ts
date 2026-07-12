"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

export interface GradeJabatan {
  id: string;
  kode: string;
  nama: string;
  urutan: number;
  salary_min: number | null;
  salary_max: number | null;
  keterangan: string | null;
}

const uid = () => "grade-" + crypto.randomUUID();

export async function getGrades(): Promise<GradeJabatan[]> {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin.from("grade_jabatan").select("*").order("urutan");
  if (error) return [];
  return (data as GradeJabatan[]) || [];
}

export async function saveGrade(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const id = (formData.get("id") as string || "").trim();
  const kode = (formData.get("kode") as string || "").trim();
  const nama = (formData.get("nama") as string || "").trim();
  const urutan = parseInt((formData.get("urutan") as string) || "0", 10) || 0;
  const salary_min = formData.get("salary_min") ? Number(formData.get("salary_min")) : null;
  const salary_max = formData.get("salary_max") ? Number(formData.get("salary_max")) : null;
  const keterangan = (formData.get("keterangan") as string || "").trim() || null;

  if (!kode || !nama) return { error: "Kode dan nama grade wajib diisi." };

  const { data: dup } = await supabaseAdmin.from("grade_jabatan").select("id").eq("kode", kode).neq("id", id || "").maybeSingle();
  if (dup) return { error: `Kode "${kode}" sudah digunakan grade lain.` };

  const finalId = id || uid();
  const { error } = await supabaseAdmin.from("grade_jabatan").upsert({
    id: finalId, kode, nama, urutan, salary_min, salary_max, keterangan,
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260712001_org_design_overhaul.sql terlebih dahulu." };
  if (error) { console.error("saveGrade error:", error); return { error: "Gagal menyimpan grade." }; }

  revalidatePath("/hrd/workplace/grades");
  auditLog({ action: "grade.save", targetId: finalId, targetName: nama, performedBy: user });
  return { success: true };
}

export async function deleteGrade(id: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID grade wajib diisi." };

  const { count } = await supabaseAdmin.from("jabatan").select("*", { count: "exact", head: true }).eq("grade_id", id);
  if (count && count > 0) return { error: "Grade ini masih dipakai oleh Master Jabatan. Lepas dulu dari jabatan terkait." };

  const { error } = await supabaseAdmin.from("grade_jabatan").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus grade." };

  revalidatePath("/hrd/workplace/grades");
  auditLog({ action: "grade.delete", targetId: id, performedBy: user });
  return { success: true };
}
