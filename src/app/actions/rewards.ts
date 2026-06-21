"use server";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-guard";

export async function saveSalaryStructure(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const basicSalary = parseInt(formData.get("basic_salary") as string || "0", 10) || 0;
  const transportAllowance = parseInt(formData.get("transport_allowance") as string || "0", 10) || 0;
  const mealAllowance = parseInt(formData.get("meal_allowance") as string || "0", 10) || 0;
  const housingAllowance = parseInt(formData.get("housing_allowance") as string || "0", 10) || 0;
  if (!employeeId) return { error: "Pilih karyawan terlebih dahulu." };
  const { error } = await supabaseAdmin.from("salary_structures").upsert({
    id: "sal-" + crypto.randomUUID(),
    employee_id: employeeId,
    basic_salary: basicSalary,
    transport_allowance: transportAllowance,
    meal_allowance: mealAllowance,
    housing_allowance: housingAllowance,
    updated_at: new Date().toISOString(),
  }, { onConflict: "employee_id" });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/rewards/salary");
  return { success: true };
}

export async function saveIncentivePayment(formData: FormData) {
  await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const program = (formData.get("program") as string || "").trim();
  const amount = parseInt(formData.get("amount") as string || "0", 10) || 0;
  const period = (formData.get("period") as string || "").trim() || null;
  if (!employeeId || !program) return { error: "Karyawan dan program wajib diisi." };
  if (amount <= 0) return { error: "Jumlah insentif harus lebih dari 0." };
  const { error } = await supabaseAdmin.from("incentive_payments").insert({
    id: "inc-" + crypto.randomUUID(), employee_id: employeeId,
    program, amount, period: period || null, status: "Pending",
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01") return { error: "Jalankan migrasi SQL 20260621002 terlebih dahulu." };
  if (error) return { error: "Gagal: " + error.message };
  revalidatePath("/hrd/rewards/incentives");
  return { success: true };
}
