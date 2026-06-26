"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function saveEmployeeProfile(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const employeeId = formData.get("employeeId") as string;
  if (!employeeId) return { error: "ID karyawan tidak ditemukan." };

  // Ownership check: employee can only update their own data
  if (user.role === "employee") {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("email", user.email)
      .maybeSingle();
    if (!emp) return { error: "Akses ditolak: data bukan milik Anda." };
  }

  const nik = (formData.get("nik") as string || "").trim();
  const birth_place = (formData.get("birth_place") as string || "").trim();
  const birth_date = formData.get("birth_date") as string || null;
  const religion = formData.get("religion") as string || null;
  const blood_type = formData.get("blood_type") as string || null;
  const marital_status = formData.get("marital_status") as string || null;
  const spouse_name = (formData.get("spouse_name") as string || "").trim();
  const children_count = formData.get("children_count") as string;
  const ktp_address = (formData.get("ktp_address") as string || "").trim();
  const last_education = formData.get("last_education") as string || null;
  const emergency_name = (formData.get("emergency_name") as string || "").trim();
  const emergency_phone = (formData.get("emergency_phone") as string || "").trim();

  const { error } = await supabaseAdmin
    .from("employees")
    .update({
      nik,
      birth_place,
      birth_date: birth_date || null,
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

  if (error) { console.error("[profile] saveEmployeeProfile error:", error.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  revalidatePath("/employee/profile");
  return { success: true };
}

export async function saveContactProfile(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const employeeId = formData.get("employeeId") as string;
  if (!employeeId) return { error: "ID karyawan tidak ditemukan." };

  // Ownership check
  if (user.role === "employee") {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("email", user.email)
      .maybeSingle();
    if (!emp) return { error: "Akses ditolak: data bukan milik Anda." };
  }

  const full_name = (formData.get("full_name") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim();
  const address = (formData.get("address") as string || "").trim();

  if (!full_name) return { error: "Nama lengkap wajib diisi." };

  // If the current address column contains the legacy auth JSON (used when the
  // users table doesn't exist), preserve the __auth__ data and store the actual
  // home address inside the JSON under "home_address". Overwriting the column
  // with a plain string would destroy the employee's login credentials.
  const { data: current } = await supabaseAdmin
    .from("employees")
    .select("address")
    .eq("id", employeeId)
    .single();

  let storedAddress = address;
  try {
    const parsed = JSON.parse(current?.address as string || "{}");
    if (parsed.__auth__) {
      parsed.home_address = address;
      storedAddress = JSON.stringify(parsed);
    }
  } catch { /* address is plain text, safe to overwrite */ }

  const { error } = await supabaseAdmin
    .from("employees")
    .update({ full_name, phone, address: storedAddress })
    .eq("id", employeeId);

  if (error) { console.error("[profile] saveContactProfile error:", error.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  revalidatePath("/employee/profile");
  return { success: true };
}

export async function saveBasicProfile(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const employeeId = formData.get("employeeId") as string;
  if (!employeeId) return { error: "ID karyawan tidak ditemukan." };

  if (user.role === "employee") {
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", employeeId)
      .eq("email", user.email)
      .maybeSingle();
    if (!emp) return { error: "Akses ditolak: data bukan milik Anda." };
  }

  const full_name = (formData.get("full_name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim();
  const address = (formData.get("address") as string || "").trim();
  const department = (formData.get("department") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();

  if (!full_name) return { error: "Nama lengkap wajib diisi." };
  if (!email) return { error: "Email wajib diisi." };

  const { data: current } = await supabaseAdmin
    .from("employees")
    .select("address")
    .eq("id", employeeId)
    .single();

  let storedAddress = address;
  try {
    const parsed = JSON.parse(current?.address as string || "{}");
    if (parsed.__auth__) {
      parsed.home_address = address;
      storedAddress = JSON.stringify(parsed);
    }
  } catch { /* address is plain text, safe to overwrite */ }

  const updateData: Record<string, unknown> = { full_name, email, phone, address: storedAddress, department: department || null, position: position || null };

  // Employees cannot change their own department or position
  if (user.role === "employee") {
    delete updateData.department;
    delete updateData.position;
  }

  const { error } = await supabaseAdmin
    .from("employees")
    .update(updateData)
    .eq("id", employeeId);

  if (error) { console.error("[profile] saveBasicProfile error:", error.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  revalidatePath("/employee/profile");
  return { success: true };
}
