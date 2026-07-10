"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function getSopDocuments() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("dokumen_sop")
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
  const documentUrl = (formData.get("document_url") as string || "").trim() || null;
  if (!title) return { error: "Judul SOP wajib diisi." };
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  const autoNum = `SOP-${Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase().substring(0, 6)}`;
  const finalNumber = number || autoNum;
  const { error } = await supabaseAdmin.from("dokumen_sop").insert({
    id: "sop-" + crypto.randomUUID(), number: finalNumber, title, department,
    version, description, document_url: documentUrl, status: "Aktif",
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error?.code === "23505") return { error: `Nomor SOP "${finalNumber}" sudah ada.` };
  if (error?.code === "PGRST204" || /document_url/i.test(error?.message || "")) {
    return { error: "Jalankan migrasi 20260704005_hrd_files_bucket.sql terlebih dahulu." };
  }
  if (error) { console.error("[knowledge] saveSop error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/knowledge/sop");
  return { success: true };
}

// ── Kebijakan Perusahaan ────────────────────────────────────────────────────

const MISSING_TABLE = (code?: string) => code === "42P01" || code === "PGRST205";

export async function getPolicies() {
  const { data, error } = await supabaseAdmin
    .from("kebijakan_perusahaan")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as Array<Record<string, unknown>>;
}

export async function getPolicyById(id: string) {
  const { data, error } = await supabaseAdmin.from("kebijakan_perusahaan").select("*").eq("id", id).maybeSingle();
  if (error) return null;
  return data as Record<string, unknown> | null;
}

export async function savePolicy(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const category = (formData.get("category") as string || "").trim() || null;
  const content = (formData.get("content") as string || "").trim();
  const effectiveDate = (formData.get("effective_date") as string || "").trim() || null;
  const revision = (formData.get("revision") as string || "Rev. 1").trim();
  if (!title || !content) return { error: "Judul dan isi kebijakan wajib diisi." };
  const { error } = await supabaseAdmin.from("kebijakan_perusahaan").insert({
    id: "pol-" + crypto.randomUUID(), title, category, content,
    effective_date: effectiveDate, revision, created_by: user.name || user.email,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704001_knowledge_and_surveys.sql terlebih dahulu." };
  if (error) { console.error("[knowledge] savePolicy error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/knowledge/policies");
  return { success: true };
}

// ── Basis Pengetahuan ────────────────────────────────────────────────────────

export async function getArticles() {
  const { data, error } = await supabaseAdmin
    .from("artikel_pengetahuan")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as Array<Record<string, unknown>>;
}

export async function getArticleById(id: string) {
  const { data, error } = await supabaseAdmin.from("artikel_pengetahuan").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  await supabaseAdmin.from("artikel_pengetahuan").update({ views: (Number((data as Record<string, unknown>).views) || 0) + 1 }).eq("id", id);
  return data as Record<string, unknown>;
}

export async function saveArticle(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const category = (formData.get("category") as string || "").trim() || null;
  const content = (formData.get("content") as string || "").trim();
  if (!title || !content) return { error: "Judul dan isi artikel wajib diisi." };
  const { error } = await supabaseAdmin.from("artikel_pengetahuan").insert({
    id: "art-" + crypto.randomUUID(), title, category, author: user.name || user.email,
    content, views: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704001_knowledge_and_surveys.sql terlebih dahulu." };
  if (error) { console.error("[knowledge] saveArticle error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/knowledge/base");
  return { success: true };
}

// ── Video Tutorial ───────────────────────────────────────────────────────────

export async function getVideos() {
  const { data, error } = await supabaseAdmin
    .from("video_pelatihan")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as Array<Record<string, unknown>>;
}

export async function getVideoById(id: string) {
  const { data, error } = await supabaseAdmin.from("video_pelatihan").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  await supabaseAdmin.from("video_pelatihan").update({ views: (Number((data as Record<string, unknown>).views) || 0) + 1 }).eq("id", id);
  return data as Record<string, unknown>;
}

export async function saveVideo(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const category = (formData.get("category") as string || "").trim() || null;
  const videoUrl = (formData.get("video_url") as string || "").trim();
  const duration = (formData.get("duration") as string || "").trim() || null;
  const description = (formData.get("description") as string || "").trim() || null;
  if (!title || !videoUrl) return { error: "Judul dan URL video wajib diisi." };
  const { error } = await supabaseAdmin.from("video_pelatihan").insert({
    id: "vid-" + crypto.randomUUID(), title, category, video_url: videoUrl, duration, description,
    views: 0, created_by: user.name || user.email, created_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704001_knowledge_and_surveys.sql terlebih dahulu." };
  if (error) { console.error("[knowledge] saveVideo error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/knowledge/videos");
  return { success: true };
}
