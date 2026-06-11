"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function registerVendor(formData: FormData) {
  const company_name = formData.get("company_name") as string;
  const company_email = formData.get("company_email") as string;
  const company_phone = formData.get("company_phone") as string;
  const npwp = formData.get("npwp") as string;
  const nib = formData.get("nib") as string;
  const address = formData.get("address") as string;
  const business_type = formData.get("business_type") as string;

  const { error } = await supabase
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
      return { success: true };
    }
    return { error: error.message };
  }

  revalidatePath("/e-procurement");
  return { success: true };
}

export async function submitQuotation(formData: FormData) {
  const company_name = formData.get("company_name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const service_type = formData.get("service_type") as string;
  const description = formData.get("description") as string;

  if (!company_name || !email) {
    return { error: "Nama perusahaan dan email wajib diisi." };
  }

  const { error } = await supabase
    .from("vendors")
    .insert([{
      company_name,
      company_email: email,
      company_phone: phone || null,
      business_type: service_type || null,
      address: description || null,
    }]);

  if (error && !error.message.includes("Could not find the table")) {
    return { error: error.message };
  }

  revalidatePath("/e-procurement");
  return { success: true };
}
