"use server";

import { supabaseAdmin } from "@/lib/supabase";

export async function submitContact(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const company = formData.get("company") as string;
  const subject = formData.get("subject") as string;
  const message = formData.get("message") as string;

  if (!name || !email || !message) {
    return { error: "Nama, email, dan pesan wajib diisi." };
  }

  const { error } = await supabaseAdmin.from("contact_messages").insert([
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
