"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

/**
 * Standalone personal-data store (data_pribadi_karyawan) — deliberately not
 * foreign-keyed to karyawan or anything else, keyed only by email. Both HRD
 * (Employee 360°) and the employee themselves (self-service) can read/write
 * it; ownership for the employee role is enforced by session email, not by
 * any DB-level link.
 */
export interface DataPribadi {
  id: string;
  email: string;
  nik: string | null;
  birth_place: string | null;
  birth_date: string | null;
  religion: string | null;
  blood_type: string | null;
  marital_status: string | null;
  spouse_name: string | null;
  children_count: number | null;
  ktp_address: string | null;
  last_education: string | null;
  phone: string | null;
  address: string | null;
  emergency_name: string | null;
  emergency_phone: string | null;
}

async function assertAccess(targetEmail: string) {
  const user = await requireRole("employee", "hrd", "superadmin");
  if (user.role === "employee" && user.email.toLowerCase() !== targetEmail.toLowerCase()) {
    throw new Error("Akses ditolak: data bukan milik Anda.");
  }
  return user;
}

export async function getDataPribadi(email: string): Promise<DataPribadi | null> {
  if (!email) return null;
  const { data } = await supabaseAdmin.from("data_pribadi_karyawan").select("*").eq("email", email.toLowerCase()).maybeSingle();
  return (data as DataPribadi) || null;
}

export async function saveDataPribadi(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  if (!email) return { error: "Email wajib diisi." };

  try {
    await assertAccess(email);
  } catch (e) {
    return { error: (e as Error).message };
  }

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
  const phone = (formData.get("phone") as string || "").trim() || null;
  const address = (formData.get("address") as string || "").trim() || null;
  const emergency_name = (formData.get("emergency_name") as string || "").trim() || null;
  const emergency_phone = (formData.get("emergency_phone") as string || "").trim() || null;

  const { data: existing } = await supabaseAdmin.from("data_pribadi_karyawan").select("id").eq("email", email).maybeSingle();
  const id = (existing as { id: string } | null)?.id || ("dpk-" + crypto.randomUUID());

  const { error } = await supabaseAdmin.from("data_pribadi_karyawan").upsert({
    id, email, nik, birth_place, birth_date, religion, blood_type, marital_status,
    spouse_name, children_count, ktp_address, last_education, phone, address,
    emergency_name, emergency_phone, updated_at: new Date().toISOString(),
  }, { onConflict: "email" });

  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260713001_data_pribadi_standalone.sql terlebih dahulu." };
  if (error) { console.error("saveDataPribadi error:", error); return { error: "Gagal menyimpan data pribadi." }; }

  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}

/* ─────── Keluarga (now keyed by email, not karyawan_id) ─────── */
export async function addFamilyMemberByEmail(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  if (!email) return { error: "Email wajib diisi." };
  try { await assertAccess(email); } catch (e) { return { error: (e as Error).message }; }

  const nama = (formData.get("nama") as string || "").trim();
  const hubungan = (formData.get("hubungan") as string || "").trim();
  const tanggal_lahir = (formData.get("tanggal_lahir") as string || "").trim() || null;
  const pekerjaan = (formData.get("pekerjaan") as string || "").trim() || null;
  if (!nama || !hubungan) return { error: "Nama dan hubungan wajib diisi." };

  const { error } = await supabaseAdmin.from("keluarga_karyawan").insert({
    id: "fam-" + crypto.randomUUID(), karyawan_email: email, nama, hubungan, tanggal_lahir, pekerjaan,
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan data keluarga." };

  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}

export async function deleteFamilyMemberByEmail(id: string, email: string) {
  await assertAccess(email);
  await supabaseAdmin.from("keluarga_karyawan").delete().eq("id", id).eq("karyawan_email", email.toLowerCase());
  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}

export async function getFamilyByEmail(email: string) {
  if (!email) return [];
  const { data } = await supabaseAdmin.from("keluarga_karyawan").select("*").eq("karyawan_email", email.toLowerCase()).order("created_at", { ascending: false });
  return data || [];
}

/* ─────── Pendidikan (now keyed by email, not karyawan_id) ─────── */
export async function addEducationByEmail(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  if (!email) return { error: "Email wajib diisi." };
  try { await assertAccess(email); } catch (e) { return { error: (e as Error).message }; }

  const jenjang = (formData.get("jenjang") as string || "").trim();
  const institusi = (formData.get("institusi") as string || "").trim();
  const jurusan = (formData.get("jurusan") as string || "").trim() || null;
  const tahun_lulus = (formData.get("tahun_lulus") as string || "").trim() || null;
  if (!jenjang || !institusi) return { error: "Jenjang dan institusi wajib diisi." };

  const { error } = await supabaseAdmin.from("pendidikan_karyawan").insert({
    id: "edu-" + crypto.randomUUID(), karyawan_email: email, jenjang, institusi, jurusan, tahun_lulus,
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan pendidikan." };

  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}

export async function deleteEducationByEmail(id: string, email: string) {
  await assertAccess(email);
  await supabaseAdmin.from("pendidikan_karyawan").delete().eq("id", id).eq("karyawan_email", email.toLowerCase());
  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}

export async function getEducationByEmail(email: string) {
  if (!email) return [];
  const { data } = await supabaseAdmin.from("pendidikan_karyawan").select("*").eq("karyawan_email", email.toLowerCase()).order("created_at", { ascending: false });
  return data || [];
}

/* ─────── Generic standalone notes (catatan_karyawan) ───────
 * Backs Employee 360° sections that used to just link out to an existing
 * module (Sertifikasi, Pelatihan Diikuti, ...) — one flexible table, keyed
 * by email + kategori, no FK to anything, same pattern as the tables above.
 */
export interface CatatanKaryawan {
  id: string;
  email: string;
  kategori: string;
  judul: string;
  subjudul: string | null;
  tanggal: string | null;
  status: string | null;
  catatan: string | null;
}

export async function getCatatanByKategori(email: string, kategori: string): Promise<CatatanKaryawan[]> {
  if (!email) return [];
  const { data } = await supabaseAdmin
    .from("catatan_karyawan")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("kategori", kategori)
    .order("created_at", { ascending: false });
  return (data as CatatanKaryawan[]) || [];
}

export async function addCatatan(formData: FormData) {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const kategori = (formData.get("kategori") as string || "").trim();
  if (!email || !kategori) return { error: "Email dan kategori wajib diisi." };
  try { await assertAccess(email); } catch (e) { return { error: (e as Error).message }; }

  const judul = (formData.get("judul") as string || "").trim();
  const subjudul = (formData.get("subjudul") as string || "").trim() || null;
  const tanggal = (formData.get("tanggal") as string || "").trim() || null;
  const status = (formData.get("status") as string || "").trim() || null;
  const catatan = (formData.get("catatan") as string || "").trim() || null;
  if (!judul) return { error: "Judul wajib diisi." };

  const { error } = await supabaseAdmin.from("catatan_karyawan").insert({
    id: "cat-" + crypto.randomUUID(), email, kategori, judul, subjudul, tanggal, status, catatan,
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260713002_catatan_karyawan_generic.sql terlebih dahulu." };
  if (error) return { error: "Gagal menyimpan data." };

  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}

export async function deleteCatatan(id: string, email: string) {
  await assertAccess(email);
  await supabaseAdmin.from("catatan_karyawan").delete().eq("id", id).eq("email", email.toLowerCase());
  revalidatePath("/employee/profile");
  revalidatePath("/hrd/infrastructure/employees");
  return { success: true };
}
