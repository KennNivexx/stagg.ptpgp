"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

export interface JalurJabatan {
  id: string;
  jabatan_dari_id: string;
  jabatan_dari_name: string;
  jabatan_ke_id: string;
  jabatan_ke_name: string;
  keterangan: string | null;
}

const uid = () => "jalur-" + crypto.randomUUID();

/** Master jenjang antar-jabatan (directed graph) — distinct from the
 * employee-facing "Jalur Karir" page under Pengembangan Karir, which is a
 * read-only visualization grouped by department/level, not persisted edges. */
export async function getCareerPathGraph(): Promise<JalurJabatan[]> {
  await requireRole("hrd", "superadmin");
  const { data: edges, error } = await supabaseAdmin.from("jalur_jabatan").select("*").order("created_at");
  if (error) return [];

  const list = (edges || []) as Record<string, unknown>[];
  const jabatanIds = [...new Set(list.flatMap(e => [e.jabatan_dari_id as string, e.jabatan_ke_id as string]))];
  const { data: jabatans } = jabatanIds.length
    ? await supabaseAdmin.from("jabatan").select("id, name").in("id", jabatanIds)
    : { data: [] };
  const nameById = new Map(((jabatans || []) as { id: string; name: string }[]).map(j => [j.id, j.name]));

  return list.map(e => ({
    id: e.id as string,
    jabatan_dari_id: e.jabatan_dari_id as string, jabatan_dari_name: nameById.get(e.jabatan_dari_id as string) || "—",
    jabatan_ke_id: e.jabatan_ke_id as string, jabatan_ke_name: nameById.get(e.jabatan_ke_id as string) || "—",
    keterangan: (e.keterangan as string) || null,
  }));
}

export async function addCareerPathEdge(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");

  const jabatan_dari_id = (formData.get("jabatan_dari_id") as string || "").trim();
  const jabatan_ke_id = (formData.get("jabatan_ke_id") as string || "").trim();
  const keterangan = (formData.get("keterangan") as string || "").trim() || null;

  if (!jabatan_dari_id || !jabatan_ke_id) return { error: "Jabatan asal dan tujuan wajib dipilih." };
  if (jabatan_dari_id === jabatan_ke_id) return { error: "Jabatan asal dan tujuan tidak boleh sama." };

  const id = uid();
  const { error } = await supabaseAdmin.from("jalur_jabatan").insert({ id, jabatan_dari_id, jabatan_ke_id, keterangan });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260712001_org_design_overhaul.sql terlebih dahulu." };
  if (error?.code === "23505") return { error: "Jalur ini sudah ada." };
  if (error) { console.error("addCareerPathEdge error:", error); return { error: "Gagal menambah jalur karir." }; }

  revalidatePath("/hrd/workplace/careerpath");
  auditLog({ action: "careerpath.save", targetId: id, performedBy: user });
  return { success: true };
}

export async function deleteCareerPathEdge(id: string) {
  const user = await requireRole("hrd", "superadmin");
  if (!id) return { error: "ID jalur wajib diisi." };

  const { error } = await supabaseAdmin.from("jalur_jabatan").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus jalur karir." };

  revalidatePath("/hrd/workplace/careerpath");
  auditLog({ action: "careerpath.delete", targetId: id, performedBy: user });
  return { success: true };
}
