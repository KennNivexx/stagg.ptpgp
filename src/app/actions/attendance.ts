"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const uid = () => Date.now() + "-" + Math.random().toString(36).slice(2, 8);

export async function clockIn(formData: FormData) {
  const user = await requireRole("hrd", "superadmin", "employee");
  const employeeId = user.id;
  const notes = (formData.get("notes") as string || "").trim();

  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabaseAdmin.from("attendance").select("id").eq("employee_id", employeeId).eq("date", today).maybeSingle();
  if (existing) return { error: "Sudah clock-in hari ini." };

  const { data: emp } = await supabaseAdmin.from("employees").select("full_name, department").eq("email", user.email).maybeSingle();
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from("attendance").insert({
    id: uid(), employee_id: employeeId, employee_name: emp?.full_name || user.name, department: emp?.department || "",
    date: today, check_in: now, status: "Hadir", notes,
  });
  if (error) return { error: "Gagal clock-in." };

  revalidatePath("/hrd/attendance");
  revalidatePath("/employee");
  return { success: true, time: now };
}

export async function clockOut() {
  const user = await requireRole("hrd", "superadmin", "employee");
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin.from("attendance").update({ check_out: now }).eq("employee_id", user.id).eq("date", today);
  if (error) return { error: "Gagal clock-out." };

  revalidatePath("/hrd/attendance");
  return { success: true, time: now };
}

export async function getTodayAttendance() {
  const user = await requireRole("hrd", "superadmin", "employee");
  const today = new Date().toISOString().slice(0, 10);
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
