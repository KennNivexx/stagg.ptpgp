import { supabase } from "@/lib/supabase";

/**
 * Generic client-side upload to a Supabase Storage bucket. Mirrors the
 * pattern already used by src/app/superadmin/website/_lib/upload.ts
 * (uploadWebsiteImage), generalized for non-image buckets (e.g. videos).
 */
export async function uploadFileToStorage(
  file: File,
  bucket: string,
  folder: string,
  opts?: { acceptPrefix?: string; maxSizeMB?: number }
): Promise<{ url: string } | { error: string }> {
  try {
    if (opts?.acceptPrefix && !file.type.startsWith(opts.acceptPrefix)) {
      return { error: `File harus berupa ${opts.acceptPrefix.replace("/", " ")}.` };
    }
    const maxSizeMB = opts?.maxSizeMB ?? 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return { error: `Ukuran file maksimal ${maxSizeMB}MB.` };
    }

    const ext = file.name.split(".").pop() || "bin";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: true });

    if (error) {
      console.error(`[upload] ${bucket} error:`, error.message);
      if (/bucket not found/i.test(error.message)) {
        return { error: `Bucket penyimpanan "${bucket}" belum tersedia. Jalankan migrasi SQL terlebih dahulu.` };
      }
      return { error: "Gagal mengunggah file. Silakan coba lagi." };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e) {
    return { error: `Gagal mengunggah file: ${(e as Error).message}` };
  }
}
