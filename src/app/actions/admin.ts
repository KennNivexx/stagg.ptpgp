"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function createAdminUser(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  if (!name || !email) return { error: "Nama dan email wajib diisi." };
  if (!email.includes("@")) return { error: "Format email tidak valid." };
  const { data: existing } = await supabaseAdmin
    .from("employees").select("id").eq("email", email).maybeSingle();
  if (existing) return { error: "Email sudah terdaftar dalam sistem." };
  const { error } = await supabaseAdmin.from("employees").insert({
    id: "emp-" + crypto.randomUUID(), full_name: name, email,
    status: "Active", created_at: new Date().toISOString(),
  });
  if (error) return { error: "Gagal membuat user: " + error.message };
  revalidatePath("/hrd/admin/users");
  return { success: true };
}

export async function saveSystemSetting(key: string, value: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("system_settings").upsert(
    { key, value, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) return { error: "Gagal: " + error.message };
  return { success: true };
}

export async function saveMultipleSettings(settings: Record<string, string>) {
  await requireRole("hrd", "superadmin");
  for (const [key, value] of Object.entries(settings)) {
    await supabaseAdmin.from("system_settings").upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
  }
  return { success: true };
}

export async function saveApprovalConfig(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const workflow = (formData.get("workflow") as string || "").trim();
  const steps = parseInt(formData.get("steps") as string || "3", 10);
  const approver1 = (formData.get("approver_1") as string || "").trim() || null;
  const approver2 = (formData.get("approver_2") as string || "").trim() || null;
  const approver3 = (formData.get("approver_3") as string || "").trim() || null;
  if (!workflow) return { error: "Pilih workflow terlebih dahulu." };
  const { error } = await supabaseAdmin.from("approval_configs").upsert({
    id: "apcfg-" + crypto.randomUUID(), workflow_name: workflow,
    steps, approver_1: approver1, approver_2: approver2, approver_3: approver3,
    created_at: new Date().toISOString(),
  }, { onConflict: "workflow_name" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/admin/approvals");
  return { success: true };
}

export async function saveNotificationTemplate(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const eventType = (formData.get("event_type") as string || "").trim();
  const subject = (formData.get("subject") as string || "").trim();
  const body = (formData.get("body") as string || "").trim();
  if (!eventType) return { error: "Pilih template notifikasi." };
  const { error } = await supabaseAdmin.from("notification_settings").upsert(
    { event_type: eventType, subject, body, updated_at: new Date().toISOString() },
    { onConflict: "event_type" }
  );
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) return { error: "Gagal: " + error.message };
  return { success: true };
}
