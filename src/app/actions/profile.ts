"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function saveEmployeeProfile(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const employeeId = formData.get("employeeId") as string;
  if (!employeeId) return { error: "ID karyawan tidak ditemukan." };

  // Ownership check: employee can only update their own data
  const { data: emp } = await supabaseAdmin
    .from("karyawan")
    .select("id, email")
    .eq("id", employeeId)
    .maybeSingle();
  if (!emp) return { error: "Karyawan tidak ditemukan." };
  if (user.role === "employee" && (emp as { email: string }).email !== user.email) {
    return { error: "Akses ditolak: data bukan milik Anda." };
  }
  const email = (emp as { email: string }).email.toLowerCase();

  const nik = (formData.get("nik") as string || "").trim() || null;
  const birth_place = (formData.get("birth_place") as string || "").trim() || null;
  const birth_date = (formData.get("birth_date") as string || "").trim() || null;
  const religion = (formData.get("religion") as string || "").trim() || null;
  const blood_type = (formData.get("blood_type") as string || "").trim() || null;
  const marital_status = (formData.get("marital_status") as string || "").trim() || null;
  const spouse_name = (formData.get("spouse_name") as string || "").trim() || null;
  const children_countRaw = formData.get("children_count") as string;
  const children_count = children_countRaw ? parseInt(children_countRaw, 10) : null;
  const ktp_address = (formData.get("ktp_address") as string || "").trim() || null;
  const last_education = (formData.get("last_education") as string || "").trim() || null;
  const emergency_name = (formData.get("emergency_name") as string || "").trim() || null;
  const emergency_phone = (formData.get("emergency_phone") as string || "").trim() || null;
  const npwp = (formData.get("npwp") as string || "").trim() || null;
  const bank_name = (formData.get("bank_name") as string || "").trim() || null;
  const bank_account_number = (formData.get("bank_account_number") as string || "").trim() || null;
  const bank_account_holder = (formData.get("bank_account_holder") as string || "").trim() || null;

  // Moved to the standalone data_pribadi_karyawan table (keyed by email, no
  // FK) so HRD's Employee 360° profile and this self-service form read/write
  // the exact same rows — see supabase/migrations/20260713001_data_pribadi_standalone.sql.
  const { data: existing } = await supabaseAdmin.from("data_pribadi_karyawan").select("id").eq("email", email).maybeSingle();
  const id = (existing as { id: string } | null)?.id || ("dpk-" + crypto.randomUUID());

  const { error } = await supabaseAdmin.from("data_pribadi_karyawan").upsert({
    id, email, nik, birth_place, birth_date, religion, blood_type, marital_status,
    spouse_name, children_count, ktp_address, last_education, emergency_name, emergency_phone,
    npwp, bank_name, bank_account_number, bank_account_holder,
    updated_at: new Date().toISOString(),
  }, { onConflict: "email" });

  if (error?.code === "PGRST204" || /column .* does not exist/i.test(error?.message || "")) {
    return { error: "Jalankan migrasi 20260818003_karyawan_payroll_master_data.sql terlebih dahulu." };
  }
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260713001_data_pribadi_standalone.sql terlebih dahulu." };
  if (error) { console.error("[profile] saveEmployeeProfile error:", error.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}

export async function saveContactProfile(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const employeeId = formData.get("employeeId") as string;
  if (!employeeId) return { error: "ID karyawan tidak ditemukan." };

  // Ownership check
  if (user.role === "employee") {
    const { data: emp } = await supabaseAdmin
      .from("karyawan")
      .select("id")
      .eq("id", employeeId)
      .eq("email", user.email)
      .maybeSingle();
    if (!emp) return { error: "Akses ditolak: data bukan milik Anda." };
  }

  const full_name = (formData.get("full_name") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim() || null;
  const address = (formData.get("address") as string || "").trim() || null;

  if (!full_name) return { error: "Nama lengkap wajib diisi." };

  const { data: karyawanRow } = await supabaseAdmin.from("karyawan").select("email").eq("id", employeeId).single();
  const email = ((karyawanRow as { email: string } | null)?.email || "").toLowerCase();

  const { error: nameErr } = await supabaseAdmin.from("karyawan").update({ full_name }).eq("id", employeeId);
  if (nameErr) { console.error("[profile] saveContactProfile name error:", nameErr.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  // phone/address live in data_pribadi_karyawan now (see saveEmployeeProfile) —
  // karyawan.address is left untouched here so any legacy __auth__ JSON blob
  // it might still hold is never at risk of being overwritten by this form.
  const { data: existing } = await supabaseAdmin.from("data_pribadi_karyawan").select("id").eq("email", email).maybeSingle();
  const id = (existing as { id: string } | null)?.id || ("dpk-" + crypto.randomUUID());
  const { error } = await supabaseAdmin.from("data_pribadi_karyawan").upsert({
    id, email, phone, address, updated_at: new Date().toISOString(),
  }, { onConflict: "email" });

  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260713001_data_pribadi_standalone.sql terlebih dahulu." };
  if (error) { console.error("[profile] saveContactProfile error:", error.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}

export async function saveBasicProfile(formData: FormData) {
  const user = await requireRole("employee", "hrd", "superadmin");

  const employeeId = formData.get("employeeId") as string;
  if (!employeeId) return { error: "ID karyawan tidak ditemukan." };

  if (user.role === "employee") {
    const { data: emp } = await supabaseAdmin
      .from("karyawan")
      .select("id")
      .eq("id", employeeId)
      .eq("email", user.email)
      .maybeSingle();
    if (!emp) return { error: "Akses ditolak: data bukan milik Anda." };
  }

  const full_name = (formData.get("full_name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim();
  const phone = (formData.get("phone") as string || "").trim() || null;
  const address = (formData.get("address") as string || "").trim() || null;
  const department = (formData.get("department") as string || "").trim();
  const position = (formData.get("position") as string || "").trim();

  if (!full_name) return { error: "Nama lengkap wajib diisi." };
  if (!email) return { error: "Email wajib diisi." };

  const updateData: Record<string, unknown> = { full_name, email, department: department || null, position: position || null };

  // Employees cannot change their own department, position, or email —
  // email especially: karyawan.email is the join key every self-service
  // ownership check compares against the session's pengguna.email (see the
  // requireRole("employee") guard above and every other action in this
  // file). Letting an employee change it here desyncs the two tables and
  // silently locks them out of their own record on the very next action.
  if (user.role === "employee") {
    delete updateData.department;
    delete updateData.position;
    delete updateData.email;
  }

  const { error } = await supabaseAdmin
    .from("karyawan")
    .update(updateData)
    .eq("id", employeeId);

  if (error) { console.error("[profile] saveBasicProfile error:", error.message); return { error: "Terjadi kesalahan internal. Silakan coba lagi." }; }

  // phone/address live in data_pribadi_karyawan now (keyed by the NEW email,
  // since this form can also change the email itself) — see saveEmployeeProfile.
  const dpEmail = email.toLowerCase();
  const { data: existing } = await supabaseAdmin.from("data_pribadi_karyawan").select("id").eq("email", dpEmail).maybeSingle();
  const dpId = (existing as { id: string } | null)?.id || ("dpk-" + crypto.randomUUID());
  const { error: dpErr } = await supabaseAdmin.from("data_pribadi_karyawan").upsert({
    id: dpId, email: dpEmail, phone, address, updated_at: new Date().toISOString(),
  }, { onConflict: "email" });
  if (dpErr && dpErr.code !== "42P01") console.error("[profile] saveBasicProfile data_pribadi error:", dpErr.message);

  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}
