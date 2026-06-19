"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function saveEmployeeProfile(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const employeeId = formData.get("employeeId") as string;
  const nik = formData.get("nik") as string;
  const birth_place = formData.get("birth_place") as string;
  const birth_date = formData.get("birth_date") as string;
  const religion = formData.get("religion") as string;
  const blood_type = formData.get("blood_type") as string;
  const marital_status = formData.get("marital_status") as string;
  const spouse_name = formData.get("spouse_name") as string;
  const children_count = formData.get("children_count") as string;
  const ktp_address = formData.get("ktp_address") as string;
  const last_education = formData.get("last_education") as string;
  const emergency_name = formData.get("emergency_name") as string;
  const emergency_phone = formData.get("emergency_phone") as string;

  const { error } = await supabaseAdmin
    .from("employees")
    .update({
      nik,
      birth_place,
      birth_date,
      religion,
      blood_type,
      marital_status,
      spouse_name,
      children_count: children_count ? parseInt(children_count) : null,
      ktp_address,
      last_education,
      emergency_name,
      emergency_phone,
    })
    .eq("id", employeeId);

  if (error) return { error: error.message };

  revalidatePath("/employee/profile");
  return { success: true };
}
