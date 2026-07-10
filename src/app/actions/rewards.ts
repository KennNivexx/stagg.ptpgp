"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

const MISSING_REWARDS_SCHEMA = (error: { code?: string; message?: string } | null) =>
  !!error && (error.code === "PGRST204" || /column .* does not exist|could not find the .* column/i.test(error.message || ""));
const REWARDS_SCHEMA_ERROR = "Jalankan migrasi 20260704006_rewards_payroll_bonus_schema.sql terlebih dahulu.";

export async function getSalaryStructureByEmployee(employeeId: string) {
  await requireRole("hrd", "superadmin");
  if (!employeeId) return null;
  const { data, error } = await supabaseAdmin
    .from("struktur_gaji")
    .select("*")
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function saveSalaryStructure(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const basicSalary = parseInt(formData.get("basic_salary") as string || "0", 10) || 0;
  const transportAllowance = parseInt(formData.get("transport_allowance") as string || "0", 10) || 0;
  const mealAllowance = parseInt(formData.get("meal_allowance") as string || "0", 10) || 0;
  const housingAllowance = parseInt(formData.get("housing_allowance") as string || "0", 10) || 0;
  const positionAllowance = parseInt(formData.get("position_allowance") as string || "0", 10) || 0;
  const ptkpStatus = (formData.get("ptkp_status") as string || "TK/0").trim();
  if (!employeeId) return { error: "Pilih karyawan terlebih dahulu." };

  const { data: existing } = await supabaseAdmin
    .from("struktur_gaji")
    .select("id")
    .eq("employee_id", employeeId)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("struktur_gaji").upsert({
    id: (existing as { id: string } | null)?.id || ("sal-" + crypto.randomUUID()),
    employee_id: employeeId,
    basic_salary: basicSalary,
    transport_allowance: transportAllowance,
    meal_allowance: mealAllowance,
    housing_allowance: housingAllowance,
    position_allowance: positionAllowance,
    ptkp_status: ptkpStatus,
    updated_at: new Date().toISOString(),
  }, { onConflict: "employee_id" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) { console.error("[rewards] saveSalaryStructure error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/salary");
  return { success: true };
}

export async function saveIncentivePayment(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const program = (formData.get("program") as string || "").trim();
  const amount = parseInt(formData.get("amount") as string || "0", 10) || 0;
  const period = (formData.get("period") as string || "").trim() || null;
  const notes = (formData.get("notes") as string || "").trim() || null;
  if (!employeeId || !program) return { error: "Karyawan dan program wajib diisi." };
  if (amount <= 0) return { error: "Jumlah insentif harus lebih dari 0." };
  const { error } = await supabaseAdmin.from("insentif").insert({
    id: "inc-" + crypto.randomUUID(), employee_id: employeeId,
    program, amount, period: period || null, notes, type: "incentive", status: "Pending",
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (MISSING_REWARDS_SCHEMA(error)) return { error: REWARDS_SCHEMA_ERROR };
  if (error) { console.error("[rewards] saveIncentivePayment error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/incentives");
  return { success: true };
}

export async function updateIncentiveStatus(id: string, status: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("insentif").update({ status }).eq("id", id).eq("type", "incentive");
  if (error) { console.error("[rewards] updateIncentiveStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/incentives");
  return { success: true };
}

export async function getAwards() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("penghargaan_karyawan").select("*").order("created_at", { ascending: false }).limit(100);
  return (data || []) as Array<Record<string, unknown>>;
}

export async function nominateAward(formData: FormData) {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const category = (formData.get("category") as string || "").trim();
  const description = (formData.get("description") as string || "").trim();
  const awardDate = (formData.get("award_date") as string || new Date().toISOString().slice(0, 7)).trim();
  if (!employeeId || !category) return { error: "Karyawan dan kategori wajib dipilih." };
  const { data: emp } = await supabaseAdmin.from("karyawan").select("full_name, department").eq("id", employeeId).maybeSingle();
  const e = emp as Record<string, unknown> | null;
  const { error } = await supabaseAdmin.from("penghargaan_karyawan").insert({
    id: "awd-" + crypto.randomUUID(), employee_id: employeeId,
    employee_name: e?.full_name as string || "",
    department: e?.department as string || "",
    category, description, award_date: awardDate,
    given_by: user.name || user.email, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi 20260625_employee_awards.sql terlebih dahulu." };
  if (error) { console.error("[rewards] nominateAward error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/awards");
  return { success: true };
}

export async function getBonuses() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("insentif").select("*, karyawan!employee_id(full_name, department, position)").eq("type", "bonus").order("created_at", { ascending: false }).limit(100);
  return (data || []) as Array<Record<string, unknown>>;
}

export async function addBonus(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const program = (formData.get("program") as string || "").trim();
  const rawAmount = (formData.get("amount") as string || "0").replace(/\D/g, "");
  const amount = parseInt(rawAmount, 10) || 0;
  const period = (formData.get("period") as string || "").trim();
  const status = (formData.get("status") as string || "Pending").trim();
  if (!employeeId || !program || amount <= 0) return { error: "Karyawan, program, dan jumlah wajib diisi." };
  const { error } = await supabaseAdmin.from("insentif").insert({
    id: "inc-" + crypto.randomUUID(), employee_id: employeeId,
    program, amount, period: period || null, status, type: "bonus", created_at: new Date().toISOString(),
  });
  if (MISSING_REWARDS_SCHEMA(error)) return { error: REWARDS_SCHEMA_ERROR };
  if (error) { console.error("[rewards] addBonus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/bonuses");
  return { success: true };
}

export async function updateBonusStatus(id: string, status: string) {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("insentif").update({ status }).eq("id", id).eq("type", "bonus");
  if (error) { console.error("[rewards] updateBonusStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/bonuses");
  return { success: true };
}
