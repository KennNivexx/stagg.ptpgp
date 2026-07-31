"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";

const BUCKET = "profile-photos";
const MAX_SIZE_MB = 5;

// Every role (employee, department_manager, hrd, director, superadmin) can
// set their own profile photo from here — no role restriction beyond being
// logged in. Session identity can resolve to either `pengguna.id` (primary
// login path) or `karyawan.id` (legacy fallback auth — see auth.ts
// tryEmployeesAuth), so the photo is written to both tables by email,
// matching the dual-table-identity pattern used elsewhere in this app
// (see resolveFaceIdentity in forgot-password.ts).
export async function uploadMyProfilePhoto(formData: FormData): Promise<{ url: string } | { error: string }> {
  const session = await requireAuth();

  const file = formData.get("file") as File | null;
  if (!file) return { error: "File tidak ditemukan." };
  if (!file.type.startsWith("image/")) return { error: "File harus berupa gambar." };
  if (file.size > MAX_SIZE_MB * 1024 * 1024) return { error: `Ukuran file maksimal ${MAX_SIZE_MB}MB.` };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${session.id}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  // Uses supabaseAdmin (service role) rather than a client-side public
  // upload — bypasses RLS entirely, so no public-insert storage policy is
  // needed for this bucket, unlike the website-images CMS bucket.
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("[profile-photo] upload error:", uploadError.message);
    if (/bucket not found/i.test(uploadError.message)) {
      return { error: `Bucket penyimpanan "${BUCKET}" belum tersedia. Jalankan migrasi 20260730002_profile_photos.sql terlebih dahulu.` };
    }
    return { error: "Gagal mengunggah foto. Silakan coba lagi." };
  }

  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  if (!session.email) return { error: "Foto terunggah tapi profil tidak dapat ditemukan (email sesi kosong)." };

  const [penggunaResult, karyawanResult] = await Promise.all([
    supabaseAdmin.from("pengguna").update({ photo_url: url }).eq("email", session.email).select("id"),
    supabaseAdmin.from("karyawan").update({ photo_url: url }).eq("email", session.email).select("id"),
  ]);

  const penggunaUpdated = (penggunaResult.data || []).length > 0;
  const karyawanUpdated = (karyawanResult.data || []).length > 0;
  if (penggunaResult.error && karyawanResult.error) {
    console.error("[profile-photo] db update failed on both tables:", penggunaResult.error.message, karyawanResult.error.message);
    return { error: "Foto terunggah tapi gagal menyimpan ke profil. Coba lagi." };
  }
  if (!penggunaUpdated && !karyawanUpdated) {
    console.error("[profile-photo] no matching row in pengguna or karyawan for email:", session.email);
    return { error: "Foto terunggah tapi profil tidak ditemukan. Hubungi HRD." };
  }

  revalidatePath("/", "layout");
  return { url };
}
