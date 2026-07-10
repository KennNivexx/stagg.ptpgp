"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { rateLimit } from "@/lib/rate-limit";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function submitContact(formData: FormData) {
  const name = (formData.get("name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const company = (formData.get("company") as string || "").trim();
  const subject = (formData.get("subject") as string || "").trim();
  const message = (formData.get("message") as string || "").trim();

  if (!name || !email || !message) {
    return { error: "Nama, email, dan pesan wajib diisi." };
  }
  if (name.length > 150) return { error: "Nama terlalu panjang (maksimal 150 karakter)." };
  if (email.length > 254) return { error: "Email terlalu panjang." };
  if (!isValidEmail(email)) return { error: "Format email tidak valid." };
  if (message.length > 5000) return { error: "Pesan terlalu panjang (maksimal 5000 karakter)." };

  const rlResult = await rateLimit(`contact:${email}`, 5, 60 * 60 * 1000);
  if (rlResult.limited) return { error: "Terlalu banyak pesan. Silakan coba lagi nanti." };

  const { error } = await supabaseAdmin.from("pesan_kontak").insert([
    {
      name,
      email,
      company: company || null,
      subject: subject || "General Inquiry",
      message,
    },
  ]);

  if (error && !error.message.includes("Could not find the table")) {
    return { error: "Gagal mengirim pesan. Silakan coba lagi." };
  }

  return { success: true };
}
