"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

// ─────────────────────────────────────────────────────────────────────────────
// Shift Kerja
// ─────────────────────────────────────────────────────────────────────────────

export async function getShiftsData() {
  await requireRole("hrd", "superadmin");
  const [shiftsRes, employeesRes] = await Promise.all([
    supabaseAdmin.from("shifts").select("*").order("start_time"),
    supabaseAdmin
      .from("employees")
      .select("id, full_name, department, position")
      .not("status", "eq", "Resigned")
      .order("full_name"),
  ]);
  return {
    shifts: shiftsRes.data || [],
    employees: employeesRes.data || [],
  };
}

export async function getShiftSchedules(monthStart: string, monthEnd: string) {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("shift_schedules")
    .select("*")
    .gte("shift_date", monthStart)
    .lte("shift_date", monthEnd)
    .order("shift_date");
  if (error?.code === "42P01") return [];
  return data || [];
}

export async function saveShift(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const name = (formData.get("name") as string || "").trim();
  const startTime = (formData.get("start_time") as string || "").trim();
  const endTime = (formData.get("end_time") as string || "").trim();
  const hasBonus = formData.get("has_bonus") === "on" || formData.get("has_bonus") === "true";
  const bonusAmount = parseFloat(formData.get("bonus_amount") as string || "0") || 0;
  const color = (formData.get("color") as string || "amber").trim();
  if (!name || !startTime || !endTime) return { error: "Nama, jam mulai, dan jam selesai wajib diisi." };

  const { error } = await supabaseAdmin.from("shifts").insert({
    id: "shift-" + crypto.randomUUID(),
    name,
    start_time: startTime,
    end_time: endTime,
    has_bonus: hasBonus,
    bonus_amount: hasBonus ? bonusAmount : 0,
    color,
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260707001_shifts_locations_documents.sql terlebih dahulu." };
  if (error) { console.error("[infrastructure] saveShift error:", error.message); return { error: "Gagal menyimpan shift." }; }
  revalidatePath("/hrd/infrastructure/shifts");
  return { success: true };
}

export async function assignShift(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const shiftId = (formData.get("shift_id") as string || "").trim();
  const shiftDate = (formData.get("shift_date") as string || "").trim();
  const hasBonus = formData.get("has_bonus") === "on" || formData.get("has_bonus") === "true";
  const bonusAmount = parseFloat(formData.get("bonus_amount") as string || "0") || 0;
  const notes = (formData.get("notes") as string || "").trim();
  if (!employeeId || !shiftId || !shiftDate) return { error: "Karyawan, shift, dan tanggal wajib diisi." };

  const { error } = await supabaseAdmin.from("shift_schedules").upsert({
    id: `sched-${employeeId}-${shiftDate}`,
    employee_id: employeeId,
    shift_id: shiftId,
    shift_date: shiftDate,
    has_bonus: hasBonus,
    bonus_amount: hasBonus ? bonusAmount : 0,
    notes: notes || null,
  }, { onConflict: "employee_id,shift_date" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260707001_shifts_locations_documents.sql terlebih dahulu." };
  if (error) { console.error("[infrastructure] assignShift error:", error.message); return { error: "Gagal menyimpan penugasan shift." }; }
  revalidatePath("/hrd/infrastructure/shifts");
  return { success: true };
}

export async function deleteShiftSchedule(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("shift_schedules").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus penugasan shift." };
  revalidatePath("/hrd/infrastructure/shifts");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lokasi Kerja
// ─────────────────────────────────────────────────────────────────────────────

export async function getLocationsData() {
  await requireRole("hrd", "superadmin");
  const [locRes, empRes] = await Promise.all([
    supabaseAdmin.from("work_locations").select("*").order("name"),
    supabaseAdmin
      .from("employees")
      .select("id, full_name, department, position, location_id")
      .not("status", "eq", "Resigned")
      .order("full_name"),
  ]);
  return {
    locations: locRes.data || [],
    employees: empRes.data || [],
  };
}

export async function saveLocation(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const id = (formData.get("id") as string || "").trim();
  const name = (formData.get("name") as string || "").trim();
  const address = (formData.get("address") as string || "").trim();
  const type = (formData.get("type") as string || "Kantor").trim();
  const status = (formData.get("status") as string || "Aktif").trim();
  if (!name || !address) return { error: "Nama dan alamat lokasi wajib diisi." };

  const { error } = await supabaseAdmin.from("work_locations").upsert({
    id: id || "loc-" + crypto.randomUUID(),
    name,
    address,
    type,
    status,
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260707001_shifts_locations_documents.sql terlebih dahulu." };
  if (error) { console.error("[infrastructure] saveLocation error:", error.message); return { error: "Gagal menyimpan lokasi." }; }
  revalidatePath("/hrd/infrastructure/locations");
  return { success: true };
}

export async function deleteLocation(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("work_locations").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus lokasi." };
  revalidatePath("/hrd/infrastructure/locations");
  return { success: true };
}

export async function assignEmployeeLocation(employeeId: string, locationId: string | null) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin
    .from("employees")
    .update({ location_id: locationId })
    .eq("id", employeeId);
  if (error) return { error: "Gagal menugaskan lokasi karyawan." };
  revalidatePath("/hrd/infrastructure/locations");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dokumen Perusahaan
// ─────────────────────────────────────────────────────────────────────────────

export async function getDocumentsData() {
  await requireRole("hrd", "superadmin");
  const { data, error } = await supabaseAdmin
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error?.code === "42P01") return [];
  return data || [];
}

export async function saveDocument(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const title = (formData.get("title") as string || "").trim();
  const category = (formData.get("category") as string || "Lainnya").trim();
  const visibleToEmployee = formData.get("visible_to_employee") === "on" || formData.get("visible_to_employee") === "true";
  const visibleToDeptHead = formData.get("visible_to_department_head") === "on" || formData.get("visible_to_department_head") === "true";
  if (!title) return { error: "Judul dokumen wajib diisi." };

  const { error } = await supabaseAdmin.from("documents").insert({
    id: "doc-" + crypto.randomUUID(),
    title,
    category,
    status: "Aktif",
    visible_to_employee: visibleToEmployee,
    visible_to_department_head: visibleToDeptHead,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260707001_shifts_locations_documents.sql terlebih dahulu." };
  if (error) { console.error("[infrastructure] saveDocument error:", error.message); return { error: "Gagal menyimpan dokumen." }; }
  revalidatePath("/hrd/infrastructure/documents");
  revalidatePath("/employee/documents");
  revalidatePath("/department/documents");
  return { success: true };
}

export async function updateDocumentVisibility(id: string, field: "visible_to_employee" | "visible_to_department_head", value: boolean) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin
    .from("documents")
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) { console.error("[infrastructure] updateDocumentVisibility error:", error.message); return { error: "Gagal memperbarui visibilitas dokumen." }; }
  revalidatePath("/hrd/infrastructure/documents");
  revalidatePath("/employee/documents");
  revalidatePath("/department/documents");
  return { success: true };
}

export async function deleteDocument(id: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("documents").delete().eq("id", id);
  if (error) return { error: "Gagal menghapus dokumen." };
  revalidatePath("/hrd/infrastructure/documents");
  revalidatePath("/employee/documents");
  revalidatePath("/department/documents");
  return { success: true };
}
