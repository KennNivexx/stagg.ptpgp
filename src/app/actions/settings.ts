"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";
import { auditLog } from "@/lib/audit";

export async function getWebsiteSettings() {
  const { data, error } = await supabaseAdmin
    .from("karyawan")
    .select("address")
    .eq("email", "__settings__@ptpgp.co.id")
    .single();

  if (error || !data?.address) return {};

  try {
    const parsed = JSON.parse(data.address as string);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveWebsiteSettings(
  section: string,
  values: Record<string, unknown>
) {
  const user = await requireRole("superadmin");

  const current = await getWebsiteSettings();
  current[section] = values;

  const { error } = await supabaseAdmin.from("karyawan").upsert(
    {
      full_name: "System Settings",
      email: "__settings__@ptpgp.co.id",
      address: JSON.stringify(current),
      department: "System",
      position: "Settings",
      join_date: new Date().toISOString().split("T")[0],
      status: "Tetap",
    },
    { onConflict: "email" }
  );

  if (error) { console.error("[settings] saveWebsiteSettings error:", error.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  revalidatePath("/", "layout");
  revalidatePath("/superadmin/website");
  auditLog({
    action: "settings.save",
    targetName: section,
    performedBy: user,
  });
  return { success: true };
}
