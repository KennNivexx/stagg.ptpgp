"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => Date.now() + "-" + Math.random().toString(36).slice(2, 8);

async function uploadPhoto(base64: string, employeeId: string): Promise<string | null> {
  try {
    const buffer = Buffer.from(base64.split(",")[1], "base64");
    const filename = `attendance/${employeeId}/${Date.now()}.jpg`;
    const { error } = await supabaseAdmin.storage
      .from("attendance-photos")
      .upload(filename, buffer, { contentType: "image/jpeg", upsert: true });
    if (error) return null;
    const { data: urlData } = supabaseAdmin.storage
      .from("attendance-photos")
      .getPublicUrl(filename);
    return urlData.publicUrl;
  } catch {
    return null;
  }
}

export async function clockIn(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const employeeId = user.id;
  const notes = (formData.get("notes") as string || "").trim();
  const photoUrl = (formData.get("photo_url") as string || "").trim();
  const latitude = (formData.get("latitude") as string || "").trim();
  const longitude = (formData.get("longitude") as string || "").trim();
  const locationName = (formData.get("location_name") as string || "").trim();

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data: existing } = await supabaseAdmin.from("attendance").select("id").eq("employee_id", employeeId).eq("date", today).maybeSingle();
  if (existing) return { error: "Sudah clock-in hari ini." };

  let storedPhotoUrl: string | null = null;
  if (photoUrl) {
    storedPhotoUrl = await uploadPhoto(photoUrl, employeeId);
  }

  const { data: emp } = await supabaseAdmin.from("employees").select("full_name, department").eq("email", user.email).maybeSingle();
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from("attendance").insert({
    id: uid(),
    employee_id: employeeId,
    employee_name: emp?.full_name || user.name,
    department: emp?.department || "",
    date: today,
    check_in: now,
    status: "Hadir",
    notes,
    photo_url: storedPhotoUrl,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    location_name: locationName || null,
  });
  if (error) {
    console.error("[clockIn] Supabase error:", error);
    return { error: `Gagal clock-in: ${error.message}` };
  }

  revalidatePath("/hrd/attendance");
  revalidatePath("/employee");
  return { success: true, time: now };
}

export async function clockOut(formData?: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const now = new Date().toISOString();

  let photoUrl: string | null = null;
  let latitude: string | null = null;
  let longitude: string | null = null;
  let locationName: string | null = null;

  if (formData) {
    const photo = (formData.get("photo_url") as string || "").trim();
    if (photo) {
      photoUrl = await uploadPhoto(photo, user.id);
    }
    latitude = (formData.get("latitude") as string || "").trim() || null;
    longitude = (formData.get("longitude") as string || "").trim() || null;
    locationName = (formData.get("location_name") as string || "").trim() || null;
  }

  const updateData: Record<string, unknown> = { check_out: now };
  if (photoUrl) Object.assign(updateData, { checkout_photo_url: photoUrl, checkout_latitude: latitude, checkout_longitude: longitude, checkout_location_name: locationName });
  else if (latitude) Object.assign(updateData, { checkout_latitude: latitude, checkout_longitude: longitude, checkout_location_name: locationName });

  const { error } = await supabaseAdmin.from("attendance").update(updateData).eq("employee_id", user.id).eq("date", today);
  if (error) {
    console.error("[clockOut] Supabase error:", error);
    return { error: `Gagal clock-out: ${error.message}` };
  }

  revalidatePath("/hrd/attendance");
  return { success: true, time: now };
}

export async function getTodayAttendance() {
  const user = await requireRole("hrd", "superadmin", "employee");
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const { data } = await supabaseAdmin.from("attendance").select("*").eq("employee_id", user.id).eq("date", today).maybeSingle();
  return data || null;
}

export async function getAllAttendance(params?: { date?: string; department?: string; search?: string }) {
  await requireRole("hrd", "superadmin");
  let q = supabaseAdmin.from("attendance").select("*").order("date", { ascending: false }).order("employee_name");
  if (params?.date) q = q.eq("date", params.date);
  if (params?.department) q = q.eq("department", params.department);
  if (params?.search) q = q.ilike("employee_name", `%${params.search}%`);
  const { data } = await q.limit(200);
  return (data || []);
}
