"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function getWebsiteSettings() {
  const { data, error } = await supabaseAdmin
    .from("employees")
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
  const current = await getWebsiteSettings();
  current[section] = values;

  const { error } = await supabaseAdmin.from("employees").upsert(
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

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/superadmin/website");
  return { success: true };
}
