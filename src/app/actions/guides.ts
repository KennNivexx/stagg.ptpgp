"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const MANAGEABLE_ROLES = ["hrd", "employee", "applicant", "department_manager", "director"] as const;
type ManageableRole = typeof MANAGEABLE_ROLES[number];

function isManageableRole(role: string): role is ManageableRole {
  return (MANAGEABLE_ROLES as readonly string[]).includes(role);
}

// ── Read guides for the caller's own portal (employee/applicant/dept/director/hrd) ──
export async function getGuidesForMyRole() {
  const session = await requireRole("hrd", "superadmin", "employee", "applicant", "department_manager", "director");
  const role = session.role === "superadmin" ? "hrd" : session.role;

  const { data, error } = await supabaseAdmin
    .from("panduan_bantuan")
    .select("*")
    .eq("role", role)
    .order("category", { ascending: true })
    .order("order_index", { ascending: true });

  if (error?.code === "42P01") return [];
  if (error) return [];
  return data || [];
}

// ── HRD: fetch all guides for a given role (management view) ────────────────
export async function getGuidesForManagement(role: string) {
  await requireRole("hrd", "superadmin");
  if (!isManageableRole(role)) return [];

  const { data, error } = await supabaseAdmin
    .from("panduan_bantuan")
    .select("*")
    .eq("role", role)
    .order("category", { ascending: true })
    .order("order_index", { ascending: true });

  if (error?.code === "42P01") return [];
  if (error) return [];
  return data || [];
}

// ── HRD: create or update a guide ────────────────────────────────────────────
export async function saveGuide(guideId: string | null, formData: FormData) {
  await requireRole("hrd", "superadmin");

  const role = (formData.get("role") as string || "").trim();
  const category = (formData.get("category") as string || "Umum").trim() || "Umum";
  const title = (formData.get("title") as string || "").trim();
  const content = (formData.get("content") as string || "").trim();
  const orderIndex = parseInt(formData.get("order_index") as string || "0", 10) || 0;

  if (!isManageableRole(role)) {
    return { error: "Peran tidak valid. Panduan untuk akun superadmin tidak dapat dikelola dari sini." };
  }
  if (!title) return { error: "Judul panduan wajib diisi." };

  if (guideId) {
    const { error } = await supabaseAdmin
      .from("panduan_bantuan")
      .update({ role, category, title, content, order_index: orderIndex, updated_at: new Date().toISOString() })
      .eq("id", guideId);
    if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260705001 terlebih dahulu." };
    if (error) return { error: error.message };
  } else {
    const { error } = await supabaseAdmin.from("panduan_bantuan").insert({
      id: "guide-" + crypto.randomUUID(),
      role, category, title, content, order_index: orderIndex,
      created_at: new Date().toISOString(),
    });
    if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260705001 terlebih dahulu." };
    if (error) return { error: error.message };
  }

  revalidatePath(`/hrd/guides/${role}`);
  return { success: true };
}

// ── HRD: delete a guide ──────────────────────────────────────────────────────
export async function deleteGuide(guideId: string) {
  await requireRole("hrd", "superadmin");

  const { data: guide } = await supabaseAdmin.from("panduan_bantuan").select("role").eq("id", guideId).maybeSingle();
  if (guide && !isManageableRole(guide.role as string)) {
    return { error: "Panduan ini tidak dapat dihapus dari sini." };
  }

  const { error } = await supabaseAdmin.from("panduan_bantuan").delete().eq("id", guideId);
  if (error) return { error: error.message };

  if (guide) revalidatePath(`/hrd/guides/${guide.role as string}`);
  return { success: true };
}
