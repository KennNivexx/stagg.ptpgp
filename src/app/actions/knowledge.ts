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
  const mandatory = formData.get("mandatory") === "on" || formData.get("mandatory") === "true";
  const effective_date = (formData.get("effective_date") as string || "").trim() || null;
  const expiry_date = (formData.get("expiry_date") as string || "").trim() || null;
  const sme = (formData.get("sme") as string || "").trim() || null;
  // "Published" here — same taxonomy as policies/articles/videos below,
  // instead of a one-off "Aktif" that meant the same thing but read as a
  // different lifecycle state in the UI.
  const status = (formData.get("status") as string || "Published").trim();
  const { error } = await supabaseAdmin.from("dokumen_sop").insert({
    id: "sop-" + crypto.randomUUID(), number: finalNumber, title, department,
    version, description, document_url: documentUrl, status,
    mandatory, effective_date, expiry_date, sme,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error?.code === "23505") return { error: `Nomor SOP "${finalNumber}" sudah ada.` };
  if (error?.code === "PGRST204" || /document_url/i.test(error?.message || "")) {
    return { error: "Jalankan migrasi 20260704005_hrd_files_bucket.sql dan 20260716001_knowledge_management.sql terlebih dahulu." };
  }
  if (error) { console.error("[knowledge] saveSop error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/knowledge/sop");
  return { success: true };
}

// ── Kebijakan Perusahaan ────────────────────────────────────────────────────

const MISSING_TABLE = (code?: string) => code === "42P01" || code === "PGRST205";
const MISSING_COLUMN = (code?: string) => code === "PGRST204";

export async function getPolicies() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("kebijakan_perusahaan")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as Array<Record<string, unknown>>;
}

export async function getPolicyById(id: string) {
  await requireRole("hrd", "superadmin");
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
  const status = (formData.get("status") as string || "Published").trim();
  const mandatory = formData.get("mandatory") === "on" || formData.get("mandatory") === "true";
  const expiry_date = (formData.get("expiry_date") as string || "").trim() || null;
  if (!title || !content) return { error: "Judul dan isi kebijakan wajib diisi." };
  const { error } = await supabaseAdmin.from("kebijakan_perusahaan").insert({
    id: "pol-" + crypto.randomUUID(), title, category, content,
    effective_date: effectiveDate, revision, created_by: user.name || user.email,
    status, mandatory, expiry_date,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704001_knowledge_and_surveys.sql terlebih dahulu." };
  if (MISSING_COLUMN(error?.code)) return { error: "Jalankan migrasi 20260716001_knowledge_management.sql terlebih dahulu." };
  if (error) { console.error("[knowledge] savePolicy error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/knowledge/policies");
  return { success: true };
}

// ── Basis Pengetahuan ────────────────────────────────────────────────────────

export async function getArticles() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("artikel_pengetahuan")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as Array<Record<string, unknown>>;
}

export async function getArticleById(id: string) {
  await requireRole("hrd", "superadmin");
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
  const status = (formData.get("status") as string || "Published").trim();
  const mandatory = formData.get("mandatory") === "on" || formData.get("mandatory") === "true";
  if (!title || !content) return { error: "Judul dan isi artikel wajib diisi." };
  const { error } = await supabaseAdmin.from("artikel_pengetahuan").insert({
    id: "art-" + crypto.randomUUID(), title, category, author: user.name || user.email,
    content, views: 0, status, mandatory,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704001_knowledge_and_surveys.sql terlebih dahulu." };
  if (MISSING_COLUMN(error?.code)) return { error: "Jalankan migrasi 20260716001_knowledge_management.sql terlebih dahulu." };
  if (error) { console.error("[knowledge] saveArticle error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/knowledge/base");
  return { success: true };
}

// ── Video Tutorial ───────────────────────────────────────────────────────────

export async function getVideos() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("video_pelatihan")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data || []) as Array<Record<string, unknown>>;
}

export async function getVideoById(id: string) {
  await requireRole("hrd", "superadmin");
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
  const status = (formData.get("status") as string || "Published").trim();
  const mandatory = formData.get("mandatory") === "on" || formData.get("mandatory") === "true";
  if (!title || !videoUrl) return { error: "Judul dan URL video wajib diisi." };
  const { error } = await supabaseAdmin.from("video_pelatihan").insert({
    id: "vid-" + crypto.randomUUID(), title, category, video_url: videoUrl, duration, description,
    views: 0, created_by: user.name || user.email, status, mandatory,
    created_at: new Date().toISOString(),
  });
  if (MISSING_TABLE(error?.code)) return { error: "Jalankan migrasi 20260704001_knowledge_and_surveys.sql terlebih dahulu." };
  if (MISSING_COLUMN(error?.code)) return { error: "Jalankan migrasi 20260716001_knowledge_management.sql terlebih dahulu." };
  if (error) { console.error("[knowledge] saveVideo error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/knowledge/videos");
  return { success: true };
}

// ── Competency Mapping ───────────────────────────────────────────────────────
// Knowledge content lives across 4 separate tables (SOP/policy/article/video)
// so mapping uses one polymorphic table (content_type + content_id -> skill_id)
// instead of a bespoke FK column per table.

export interface KnowledgeBoardItem {
  content_type: "sop" | "kebijakan" | "artikel" | "video";
  content_id: string;
  title: string;
  status: string;
  mandatory: boolean;
  mapped_skills: { mapping_id: string; skill_id: string; skill_name: string; wajib: boolean }[];
}

export async function getSkillsForMapping() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("master_kompetensi").select("id, name").order("name");
  return (data || []) as { id: string; name: string }[];
}

export async function mapKnowledgeToSkill(contentType: string, contentId: string, skillId: string, wajib: boolean) {
  await requireRole("hrd", "superadmin");
  if (!contentType || !contentId || !skillId) return { error: "Data mapping tidak lengkap." };

  const { error } = await supabaseAdmin.from("pemetaan_pengetahuan").insert({
    id: "pk-" + crypto.randomUUID(), content_type: contentType, content_id: contentId, skill_id: skillId, wajib,
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260716001_knowledge_management.sql terlebih dahulu." };
  if (error?.code === "23505") return { error: "Kompetensi ini sudah dipetakan ke konten tersebut." };
  if (error) { console.error("[knowledge] mapKnowledgeToSkill error:", error.message); return { error: "Gagal menyimpan mapping." }; }

  revalidatePath("/hrd/knowledge/mapping");
  return { success: true };
}

export async function removeKnowledgeMapping(id: string) {
  await requireRole("hrd", "superadmin");
  await supabaseAdmin.from("pemetaan_pengetahuan").delete().eq("id", id);
  revalidatePath("/hrd/knowledge/mapping");
  return { success: true };
}

export async function getKnowledgeMappingBoard(): Promise<KnowledgeBoardItem[]> {
  await requireRole("hrd", "superadmin");

  const [{ data: sops }, { data: policies }, { data: articles }, { data: videos }, { data: mappings }, { data: skills }] = await Promise.all([
    supabaseAdmin.from("dokumen_sop").select("id, title, status, mandatory"),
    supabaseAdmin.from("kebijakan_perusahaan").select("id, title, status, mandatory"),
    supabaseAdmin.from("artikel_pengetahuan").select("id, title, status, mandatory"),
    supabaseAdmin.from("video_pelatihan").select("id, title, status, mandatory"),
    supabaseAdmin.from("pemetaan_pengetahuan").select("*"),
    supabaseAdmin.from("master_kompetensi").select("id, name"),
  ]);

  const skillName = new Map(((skills || []) as { id: string; name: string }[]).map(s => [s.id, s.name]));
  const mappingsByContent = new Map<string, { mapping_id: string; skill_id: string; skill_name: string; wajib: boolean }[]>();
  for (const m of (mappings || []) as { id: string; content_type: string; content_id: string; skill_id: string; wajib: boolean }[]) {
    const key = `${m.content_type}:${m.content_id}`;
    if (!mappingsByContent.has(key)) mappingsByContent.set(key, []);
    mappingsByContent.get(key)!.push({ mapping_id: m.id, skill_id: m.skill_id, skill_name: skillName.get(m.skill_id) || "—", wajib: m.wajib });
  }

  const build = (rows: Record<string, unknown>[] | null, type: KnowledgeBoardItem["content_type"]): KnowledgeBoardItem[] =>
    ((rows || []) as { id: string; title: string; status: string; mandatory: boolean }[]).map(r => ({
      content_type: type, content_id: r.id, title: r.title, status: r.status || "—", mandatory: !!r.mandatory,
      mapped_skills: mappingsByContent.get(`${type}:${r.id}`) || [],
    }));

  return [
    ...build(sops, "sop"),
    ...build(policies, "kebijakan"),
    ...build(articles, "artikel"),
    ...build(videos, "video"),
  ];
}

/** Auto-sends relevant knowledge modules to employees based on their
 * GAP kompetensi — called after TNA generation or after competency assessment.
 * Finds employees with skill gaps, looks up mapped knowledge content, and
 * sends notifications linking them to the relevant modules/quizzes. */
export async function autoSendKnowledgeToGapEmployees(): Promise<{ sent: number }> {
  await requireRole("hrd", "superadmin");

  // Find employees with open TNA gaps
  const { data: tnaRows } = await supabaseAdmin
    .from("tna_kompetensi")
    .select("karyawan_id, skill_id")
    .eq("status", "Open");

  if (!tnaRows || tnaRows.length === 0) return { sent: 0 };

  const skillIds = [...new Set((tnaRows as { skill_id: string }[]).map(r => r.skill_id))];
  const { data: mappings } = await supabaseAdmin
    .from("pemetaan_pengetahuan")
    .select("*")
    .in("skill_id", skillIds);

  if (!mappings || mappings.length === 0) return { sent: 0 };

  // Group by karyawan_id -> skill_id -> knowledge content
  const { data: emps } = await supabaseAdmin
    .from("karyawan")
    .select("id, email, full_name")
    .in("id", [...new Set((tnaRows as { karyawan_id: string }[]).map(r => r.karyawan_id))]);
  const empEmailMap = new Map((emps || []).map((e: { id: string; email: string }) => [e.id, e.email]));

  const { data: skills } = await supabaseAdmin
    .from("master_kompetensi")
    .select("id, name, kode_kompetensi")
    .in("id", skillIds);
  const skillMap = new Map((skills || []).map((s: { id: string; name: string; kode_kompetensi: string | null }) => [s.id, s]));

  let sent = 0;
  for (const row of tnaRows as { karyawan_id: string; skill_id: string }[]) {
    const email = empEmailMap.get(row.karyawan_id);
    if (!email) continue;

    const relevantMappings = (mappings as { skill_id: string; content_type: string; content_id: string }[])
      .filter(m => m.skill_id === row.skill_id);

    if (relevantMappings.length === 0) continue;

    const skill = skillMap.get(row.skill_id);
    const skillName = skill?.name || row.skill_id;
    const kodeKompetensi = skill?.kode_kompetensi || "";

    await supabaseAdmin.from("notifikasi").insert({
      id: crypto.randomUUID(),
      user_email: email,
      title: `Modul Pembelajaran Tersedia: ${skillName}`,
      message: `Anda memiliki modul pembelajaran untuk menutup kesenjangan kompetensi "${skillName}" ${kodeKompetensi ? `(Kode: ${kodeKompetensi})` : ""}. Silakan buka akun Anda untuk mengakses materi dan kuis.`,
      link: "/employee/training",
    });
    sent++;
  }

  return { sent };
}
export async function getKnowledgeForJabatan(jabatanId: string): Promise<{ content_type: string; content_id: string; title: string; skill_name: string; mandatory: boolean }[]> {
  if (!jabatanId) return [];

  const { data: reqs } = await supabaseAdmin.from("kompetensi_jabatan").select("skill_id").eq("jabatan_id", jabatanId);
  const skillIds = [...new Set(((reqs || []) as { skill_id: string }[]).map(r => r.skill_id))];
  if (skillIds.length === 0) return [];

  const { data: mappings } = await supabaseAdmin.from("pemetaan_pengetahuan").select("*").in("skill_id", skillIds);
  if (!mappings || mappings.length === 0) return [];

  const { data: skills } = await supabaseAdmin.from("master_kompetensi").select("id, name").in("id", skillIds);
  const skillName = new Map(((skills || []) as { id: string; name: string }[]).map(s => [s.id, s.name]));

  const byType: Record<string, string[]> = { sop: [], kebijakan: [], artikel: [], video: [] };
  for (const m of mappings as { content_type: string; content_id: string }[]) {
    byType[m.content_type]?.push(m.content_id);
  }

  const [{ data: sops }, { data: policies }, { data: articles }, { data: videos }] = await Promise.all([
    byType.sop.length ? supabaseAdmin.from("dokumen_sop").select("id, title").in("id", byType.sop) : Promise.resolve({ data: [] }),
    byType.kebijakan.length ? supabaseAdmin.from("kebijakan_perusahaan").select("id, title").in("id", byType.kebijakan) : Promise.resolve({ data: [] }),
    byType.artikel.length ? supabaseAdmin.from("artikel_pengetahuan").select("id, title").in("id", byType.artikel) : Promise.resolve({ data: [] }),
    byType.video.length ? supabaseAdmin.from("video_pelatihan").select("id, title").in("id", byType.video) : Promise.resolve({ data: [] }),
  ]);
  const titleByTypeId = new Map<string, string>();
  for (const [type, rows] of [["sop", sops], ["kebijakan", policies], ["artikel", articles], ["video", videos]] as const) {
    for (const r of (rows || []) as { id: string; title: string }[]) titleByTypeId.set(`${type}:${r.id}`, r.title);
  }

  return (mappings as { content_type: string; content_id: string; skill_id: string; wajib: boolean }[])
    .map(m => ({
      content_type: m.content_type, content_id: m.content_id,
      title: titleByTypeId.get(`${m.content_type}:${m.content_id}`) || "—",
      skill_name: skillName.get(m.skill_id) || "—", mandatory: m.wajib,
    }))
    .filter(k => k.title !== "—");
}
