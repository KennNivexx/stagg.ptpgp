"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function getSopDocuments() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("sop_documents")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function saveSop(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const number = (formData.get("number") as string || "").trim();
  const title = (formData.get("title") as string || "").trim();
  const department = (formData.get("department") as string || "").trim() || null;
  const version = (formData.get("version") as string || "v1.0").trim();
  const description = (formData.get("description") as string || "").trim() || null;
  if (!title) return { error: "Judul SOP wajib diisi." };
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  const autoNum = `SOP-${Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().substring(0, 6)}`;
  const finalNumber = number || autoNum;
  const { error } = await supabaseAdmin.from("sop_documents").insert({
    id: "sop-" + crypto.randomUUID(), number: finalNumber, title, department,
    version, description, status: "Aktif",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error?.code === "23505") return { error: `Nomor SOP "${finalNumber}" sudah ada.` };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/knowledge/sop");
  return { success: true };
}
