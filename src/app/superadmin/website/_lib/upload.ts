import { supabase } from "@/lib/supabase";

const BUCKET = "website-images";

/**
 * Uploads an image file to the Supabase Storage "website-images" bucket and
 * returns its public URL. Mirrors the storage upload pattern already used
 * elsewhere in the app (see src/app/actions/attendance.ts uploadPhoto),
 * adapted for client-side use with public image assets.
 */
export async function uploadWebsiteImage(
  file: File,
  folder: string
): Promise<{ url: string } | { error: string }> {
  try {
    if (!file.type.startsWith("image/")) {
      return { error: "File harus berupa gambar." };
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error("[upload] uploadWebsiteImage error:", error.message);
      return { error: "Gagal mengunggah gambar. Silakan coba lagi." };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e) {
    return { error: `Gagal mengunggah gambar: ${(e as Error).message}` };
  }
}
