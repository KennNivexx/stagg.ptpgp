"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

// ── INITIATIVES ────────────────────────────────────────────────────────────

export async function getInitiatives() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("change_initiatives")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function saveInitiative(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const description = (formData.get("description") as string || "").trim() || null;
  const sponsor = (formData.get("sponsor") as string || "").trim() || null;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;
  const status = (formData.get("status") as string || "Perencanaan").trim();
  if (!title) return { error: "Nama inisiatif wajib diisi." };
  const { error } = await supabaseAdmin.from("change_initiatives").insert({
    id: "ci-" + crypto.randomUUID(), title, description, sponsor,
    start_date: startDate || null, end_date: endDate || null, status, progress: 0,
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[change] saveInitiative error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/change/initiatives");
  return { success: true };
}

// ── COMMUNICATIONS ─────────────────────────────────────────────────────────

export async function getCommunications() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("change_communications")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function saveCommunication(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const target = (formData.get("target") as string || "").trim() || null;
  const message = (formData.get("message") as string || "").trim() || null;
  const channel = (formData.get("channel") as string || "Email").trim();
  const frequency = (formData.get("frequency") as string || "Sekali Saja").trim();
  const pic = (formData.get("pic") as string || "").trim() || null;
  const sendDate = (formData.get("send_date") as string) || null;
  const { error } = await supabaseAdmin.from("change_communications").insert({
    id: "cc-" + crypto.randomUUID(),
    target_audience: target, message, channel, frequency, pic,
    send_date: sendDate || null, status: "Menunggu",
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[change] saveCommunication error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/change/communications");
  return { success: true };
}

// ── POLICIES ───────────────────────────────────────────────────────────────

export async function getPolicies() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin
    .from("change_policies")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function savePolicy(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const version = (formData.get("version") as string || "v1.0").trim();
  const description = (formData.get("description") as string || "").trim() || null;
  const effectiveDate = (formData.get("effective_date") as string) || null;
  const approver = (formData.get("approver") as string || "").trim() || null;
  if (!title) return { error: "Nama kebijakan wajib diisi." };
  const { error } = await supabaseAdmin.from("change_policies").insert({
    id: "cp-" + crypto.randomUUID(),
    title, version, description,
    effective_date: effectiveDate || null, approver, status: "Draft",
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[change] savePolicy error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/change/policies");
  return { success: true };
}
