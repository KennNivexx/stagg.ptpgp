"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { rateLimit } from "@/lib/rate-limit";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerVendor(formData: FormData) {
  const company_name = (formData.get("company_name") as string || "").trim();
  const company_email = (formData.get("company_email") as string || "").trim().toLowerCase();
  const company_phone = (formData.get("company_phone") as string || "").trim();
  const npwp = (formData.get("npwp") as string || "").trim();
  const nib = (formData.get("nib") as string || "").trim();
  const address = (formData.get("address") as string || "").trim();
  const business_type = (formData.get("business_type") as string || "").trim();

  if (!company_name || !company_email) {
    return { error: "Nama perusahaan dan email wajib diisi." };
  }
  if (company_name.length > 200) return { error: "Nama perusahaan terlalu panjang." };
  if (company_phone.length > 30) return { error: "Nomor telepon terlalu panjang." };
  if (address.length > 500) return { error: "Alamat terlalu panjang." };
  if (!isValidEmail(company_email)) return { error: "Format email tidak valid." };

  const rlResult = await rateLimit(`vendor:${company_email}`, 3, 24 * 60 * 60 * 1000);
  if (rlResult.limited) return { error: "Terlalu banyak pendaftaran. Silakan coba lagi besok." };

  const { error } = await supabaseAdmin
    .from("vendors")
    .insert([
      {
        company_name,
        company_email,
        company_phone,
        npwp,
        nib,
        address,
        business_type,
      },
    ]);

  if (error) {
    if (error.message.includes("Could not find the table")) {
      console.error("[vendor] registerVendor error: vendors table missing");
      return { error: "Fitur pendaftaran vendor belum aktif. Hubungi admin untuk menjalankan migrasi." };
    }
    if (error.code === "23505") {
      return { error: "Perusahaan dengan email ini sudah terdaftar." };
    }
    console.error("[vendor] registerVendor error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/e-procurement");
  return { success: true };
}

export async function submitQuotation(formData: FormData) {
  const company_name = (formData.get("company_name") as string || "").trim();
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const phone = (formData.get("phone") as string || "").trim();
  const service_type = (formData.get("service_type") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();

  if (!company_name || !email) {
    return { error: "Nama perusahaan dan email wajib diisi." };
  }
  if (!isValidEmail(email)) return { error: "Format email tidak valid." };

  const rlResult = await rateLimit(`quotation:${email}`, 5, 24 * 60 * 60 * 1000);
  if (rlResult.limited) return { error: "Terlalu banyak pengiriman. Silakan coba lagi besok." };

  const { error } = await supabaseAdmin
    .from("vendors")
    .insert([{
      company_name,
      company_email: email,
      company_phone: phone || null,
      business_type: service_type || null,
      address: description || null,
    }]);

  if (error) {
    if (error.message.includes("Could not find the table")) {
      console.error("[vendor] submitQuotation error: vendors table missing");
      return { error: "Fitur pengajuan penawaran belum aktif. Hubungi admin untuk menjalankan migrasi." };
    }
    console.error("[vendor] submitQuotation error:", error.message);
    return { error: "Terjadi kesalahan internal. Silakan coba lagi." };
  }

  revalidatePath("/e-procurement");
  return { success: true };
}
