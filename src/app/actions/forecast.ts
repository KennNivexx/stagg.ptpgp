"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function saveForecast(formData: FormData) {
  await requireRole("hrd", "superadmin");

  const department = (formData.get("departemen") as string || "").trim();
  const year = parseInt(formData.get("year") as string || "0");
  const q1 = parseInt(formData.get("proyeksi_q1") as string || "0") || 0;
  const q2 = parseInt(formData.get("proyeksi_q2") as string || "0") || 0;
  const q3 = parseInt(formData.get("proyeksi_q3") as string || "0") || 0;
  const q4 = parseInt(formData.get("proyeksi_q4") as string || "0") || 0;

  if (!department) return { error: "Pilih departemen." };
  if (!year) return { error: "Tahun tidak valid." };

  const { error } = await supabaseAdmin
    .from("department_forecasts")
    .upsert(
      { department, year, q1, q2, q3, q4, updated_at: new Date().toISOString() },
      { onConflict: "department,year" }
    );

  if (error) {
    console.error("[forecast] saveForecast error:", error.message);
    return { error: "Gagal menyimpan proyeksi." };
  }

  revalidatePath("/hrd/workforce/forecast");
  return { success: true };
}
