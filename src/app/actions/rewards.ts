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

// ── Reward Rule Engine ─────────────────────────────────────────────────────
// Reward tidak diinput manual — HRD mendefinisikan syarat di sini, lalu
// evaluateRewardRules() men-generate SARAN (draft insentif, status "Pending")
// untuk karyawan yang memenuhi syarat. HRD tetap approve manual di halaman
// Bonus/Insentif yang sudah ada — engine ini tidak pernah auto-pay.

export async function getRewardRules() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("aturan_reward").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function saveRewardRule(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const nama = (formData.get("nama") as string || "").trim();
  const minKpiScore = formData.get("min_kpi_score") ? Number(formData.get("min_kpi_score")) : null;
  const minAttendancePct = formData.get("min_attendance_pct") ? Number(formData.get("min_attendance_pct")) : null;
  const noActiveWarning = formData.get("no_active_warning") === "on";
  const minTrainingCompletionPct = formData.get("min_training_completion_pct") ? Number(formData.get("min_training_completion_pct")) : null;
  const rewardType = (formData.get("reward_type") as string || "bonus").trim();
  const calcMethod = (formData.get("calc_method") as string || "percent_basic").trim();
  const calcValue = Number(formData.get("calc_value")) || 0;
  if (!nama) return { error: "Nama aturan wajib diisi." };
  if (calcValue <= 0) return { error: "Nilai perhitungan harus lebih dari 0." };

  const { error } = await supabaseAdmin.from("aturan_reward").insert({
    id: "rule-" + crypto.randomUUID(), nama,
    min_kpi_score: minKpiScore, min_attendance_pct: minAttendancePct,
    no_active_warning: noActiveWarning, min_training_completion_pct: minTrainingCompletionPct,
    reward_type: rewardType, calc_method: calcMethod, calc_value: calcValue, aktif: true,
    created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260719001_reward_engine.sql terlebih dahulu." };
  if (error) { console.error("[rewards] saveRewardRule error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/formula");
  return { success: true };
}

export async function deleteRewardRule(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("aturan_reward").delete().eq("id", id);
  if (error) { console.error("[rewards] deleteRewardRule error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/formula");
  return { success: true };
}

/** % kehadiran karyawan pada periode "MM/YYYY" tertentu: hari dengan
 * check_in terisi dibagi jumlah hari kerja (Senin-Jumat) di bulan itu.
 * absensi.employee_id disimpan sebagai pengguna.id (session user, lihat
 * clockIn() -> clockInForEmployee({employeeId: user.id})) — BUKAN
 * karyawan.id. Resolve via email dulu, jangan query pakai karyawan.id
 * langsung (akan selalu 0 hasil kalau begitu). */
async function computeAttendancePct(email: string, period: string): Promise<number> {
  if (!email) return 0;
  const [mm, yyyy] = period.split("/").map(Number);
  if (!mm || !yyyy) return 0;

  const { data: usr } = await supabaseAdmin.from("pengguna").select("id").eq("email", email).maybeSingle();
  const penggunaId = (usr as { id: string } | null)?.id;
  if (!penggunaId) return 0;

  const start = `${yyyy}-${String(mm).padStart(2, "0")}-01`;
  const lastDay = new Date(yyyy, mm, 0).getDate();
  const end = `${yyyy}-${String(mm).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  let workingDays = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(yyyy, mm - 1, d).getDay();
    if (dow !== 0 && dow !== 6) workingDays++;
  }
  if (workingDays === 0) return 0;

  const { count } = await supabaseAdmin.from("absensi").select("*", { count: "exact", head: true })
    .eq("employee_id", penggunaId).gte("date", start).lte("date", end).not("check_in", "is", null);
  return Math.round(((count || 0) / workingDays) * 100);
}

export async function evaluateRewardRules(period: string): Promise<{ error: string } | { success: true; generated: number; evaluated: number }> {
  await requireRole("hrd", "superadmin");
  if (!period) return { error: "Periode wajib diisi (format MM/YYYY)." };

  const { data: rulesRaw } = await supabaseAdmin.from("aturan_reward").select("*").eq("aktif", true);
  const rules = (rulesRaw || []) as Array<Record<string, unknown>>;
  if (rules.length === 0) return { error: "Belum ada aturan reward aktif." };

  const { data: employeesRaw } = await supabaseAdmin.from("karyawan").select("id, department, email").neq("status", "Inactive");
  const employees = (employeesRaw || []) as { id: string; department: string | null; email: string | null }[];

  let generated = 0;
  for (const rule of rules) {
    for (const emp of employees) {
      // Skor KPI: ambil evaluasi periode ini kalau ada, kalau tidak fallback ke terbaru.
      let kpiScore: number | null = null;
      if (rule.min_kpi_score != null) {
        const { data: evalRow } = await supabaseAdmin.from("evaluasi_kpi").select("final_score, score")
          .eq("employee_id", emp.id).eq("period", period).maybeSingle();
        const e = evalRow as { final_score: number | null; score: number | null } | null;
        kpiScore = e ? (e.final_score ?? e.score) : null;
        if (kpiScore == null || kpiScore < Number(rule.min_kpi_score)) continue;
      }

      if (rule.min_attendance_pct != null) {
        const pct = await computeAttendancePct(emp.email || "", period);
        if (pct < Number(rule.min_attendance_pct)) continue;
      }

      if (rule.no_active_warning) {
        const { count } = await supabaseAdmin.from("surat_peringatan").select("*", { count: "exact", head: true })
          .eq("employee_id", emp.id).eq("status", "Aktif");
        if ((count || 0) > 0) continue;
      }

      if (rule.min_training_completion_pct != null) {
        const { data: enrollRows } = await supabaseAdmin.from("peserta_pelatihan").select("status").eq("employee_id", emp.id);
        const rows = (enrollRows || []) as { status: string }[];
        const pct = rows.length > 0 ? Math.round((rows.filter(r => r.status === "Completed").length / rows.length) * 100) : 0;
        if (pct < Number(rule.min_training_completion_pct)) continue;
      }

      // Semua syarat lolos — jangan duplikat kalau sudah pernah digenerate untuk periode+rule ini.
      const { data: existing } = await supabaseAdmin.from("insentif").select("id")
        .eq("employee_id", emp.id).eq("period", period).eq("program", `Aturan: ${rule.nama}`).maybeSingle();
      if (existing) continue;

      const { data: salaryRow } = await supabaseAdmin.from("struktur_gaji").select("basic_salary").eq("employee_id", emp.id).maybeSingle();
      const basic = Number((salaryRow as { basic_salary?: number } | null)?.basic_salary) || 0;
      const amount = rule.calc_method === "fixed_amount"
        ? Number(rule.calc_value)
        : Math.round(basic * (Number(rule.calc_value) / 100));
      if (amount <= 0) continue;

      const { error: insErr } = await supabaseAdmin.from("insentif").insert({
        id: "inc-" + crypto.randomUUID(), employee_id: emp.id,
        program: `Aturan: ${rule.nama}`, amount, period, status: "Pending",
        type: rule.reward_type, notes: "Digenerate otomatis oleh Reward Rule Engine.",
        created_at: new Date().toISOString(),
      });
      if (!insErr) generated++;
    }
  }

  revalidatePath("/hrd/rewards/incentives");
  revalidatePath("/hrd/rewards/bonuses");
  return { success: true, generated, evaluated: employees.length * rules.length };
}

// ── Merit Matrix ────────────────────────────────────────────────────────────

export async function getMeritMatrix() {
  await requireRole("hrd", "superadmin");
  const { data } = await supabaseAdmin.from("merit_matrix").select("*, grade_jabatan(nama)").order("performance_min", { ascending: false });
  return data || [];
}

export async function saveMeritMatrix(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const performanceMin = Number(formData.get("performance_min"));
  const performanceMax = Number(formData.get("performance_max"));
  const gradeId = (formData.get("grade_id") as string || "").trim() || null;
  const meritPct = Number(formData.get("merit_pct"));
  if (!Number.isFinite(performanceMin) || !Number.isFinite(performanceMax) || performanceMin >= performanceMax) {
    return { error: "Rentang skor performa tidak valid." };
  }
  if (!Number.isFinite(meritPct) || meritPct < 0) return { error: "Persentase merit tidak valid." };

  const { error } = await supabaseAdmin.from("merit_matrix").insert({
    id: "merit-" + crypto.randomUUID(), performance_min: performanceMin, performance_max: performanceMax,
    grade_id: gradeId, merit_pct: meritPct, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260719001_reward_engine.sql terlebih dahulu." };
  if (error) { console.error("[rewards] saveMeritMatrix error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/salary-review");
  return { success: true };
}

export async function deleteMeritMatrix(id: string): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const { error } = await supabaseAdmin.from("merit_matrix").delete().eq("id", id);
  if (error) { console.error("[rewards] deleteMeritMatrix error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/salary-review");
  return { success: true };
}

/** Resolve grade via Employee Assignment chain (formasi_id -> jabatan.grade_id
 * — same pattern used across Competency/Learning/Performance this session),
 * cari skor KPI terbaru, lalu cocokkan ke band Merit Matrix yang sesuai. */
export async function recommendMeritPct(karyawanId: string): Promise<{ meritPct: number; gradeId: string | null; kpiScore: number | null }> {
  await requireRole("hrd", "superadmin", "director");

  const { data: emp } = await supabaseAdmin.from("karyawan").select("formasi_id").eq("id", karyawanId).maybeSingle();
  const formasiId = (emp as { formasi_id: string | null } | null)?.formasi_id;
  let gradeId: string | null = null;
  if (formasiId) {
    const { data: formasi } = await supabaseAdmin.from("formasi_jabatan").select("jabatan_id").eq("id", formasiId).maybeSingle();
    const jabatanId = (formasi as { jabatan_id: string } | null)?.jabatan_id;
    if (jabatanId) {
      const { data: jabatan } = await supabaseAdmin.from("jabatan").select("grade_id").eq("id", jabatanId).maybeSingle();
      gradeId = (jabatan as { grade_id: string | null } | null)?.grade_id || null;
    }
  }

  const { data: latestEval } = await supabaseAdmin.from("evaluasi_kpi").select("final_score, score")
    .eq("employee_id", karyawanId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  const e = latestEval as { final_score: number | null; score: number | null } | null;
  const kpiScore = e ? (e.final_score ?? e.score) : null;
  if (kpiScore == null) return { meritPct: 0, gradeId, kpiScore: null };

  const { data: matrixRaw } = await supabaseAdmin.from("merit_matrix").select("*")
    .lte("performance_min", kpiScore).gte("performance_max", kpiScore);
  const bands = (matrixRaw || []) as { grade_id: string | null; merit_pct: number }[];
  // Grade-specific band menang atas band umum (grade_id null = berlaku semua grade).
  const match = bands.find(b => b.grade_id === gradeId) || bands.find(b => b.grade_id === null);
  return { meritPct: match?.merit_pct || 0, gradeId, kpiScore };
}

// ── Salary Review ───────────────────────────────────────────────────────────
// Dibangun di atas mutasi_karir yang sudah ada (bukan tabel baru) — dibedakan
// dari mutasi/rotasi biasa lewat kolom review_type. getMutations() di
// career-hrd.ts sudah difilter agar tidak menampilkan baris ini.

export async function getSalaryReviews() {
  await requireRole("hrd", "superadmin", "director");
  const { data } = await supabaseAdmin.from("mutasi_karir")
    .select("*, karyawan!inner(full_name, position, department)")
    .not("review_type", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);
  return data || [];
}

export async function saveSalaryReview(formData: FormData): Promise<{ error: string } | { success: true }> {
  const user = await requireRole("hrd", "superadmin");
  const employeeId = (formData.get("employee_id") as string || "").trim();
  const reviewType = (formData.get("review_type") as string || "").trim();
  const salaryBefore = Number(formData.get("salary_before")) || 0;
  const salaryAfter = Number(formData.get("salary_after")) || 0;
  const gradeBefore = (formData.get("grade_before") as string || "").trim() || null;
  const gradeAfter = (formData.get("grade_after") as string || "").trim() || null;
  const reason = (formData.get("reason") as string || "").trim() || null;
  const effectiveDate = (formData.get("effective_date") as string) || null;
  if (!employeeId || !reviewType) return { error: "Karyawan dan jenis review wajib diisi." };
  if (salaryAfter <= 0) return { error: "Gaji baru harus lebih dari 0." };

  const { data: emp } = await supabaseAdmin.from("karyawan").select("department").eq("id", employeeId).maybeSingle();
  const dept = (emp as { department: string | null } | null)?.department || "";

  const { error } = await supabaseAdmin.from("mutasi_karir").insert({
    id: "sr-" + crypto.randomUUID(), employee_id: employeeId,
    from_department: dept, to_department: dept, // review gaji tidak memindahkan departemen
    effective_date: effectiveDate, reason, status: "Menunggu", requested_by: user.email,
    review_type: reviewType, salary_before: salaryBefore, salary_after: salaryAfter,
    grade_before: gradeBefore, grade_after: gradeAfter, created_at: new Date().toISOString(),
  });
  if (error?.code === "42P01" || error?.code === "PGRST205" || error?.code === "PGRST204") {
    return { error: "Jalankan migrasi 20260719001_reward_engine.sql terlebih dahulu." };
  }
  if (error) { console.error("[rewards] saveSalaryReview error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/salary-review");
  return { success: true };
}

export async function updateSalaryReviewStatus(id: string, approve: boolean): Promise<{ error: string } | { success: true }> {
  await requireRole("director", "superadmin");

  const { data: reviewRow } = await supabaseAdmin.from("mutasi_karir").select("*").eq("id", id).not("review_type", "is", null).maybeSingle();
  if (!reviewRow) return { error: "Data salary review tidak ditemukan." };
  const review = reviewRow as { employee_id: string; salary_after: number; status: string };
  if (review.status !== "Menunggu") return { error: `Review ini sudah diproses sebelumnya (${review.status}).` };

  if (approve) {
    // Terapkan gaji baru ke struktur_gaji SEBELUM mengubah status ke
    // Disetujui — kalau ini gagal, status tidak berubah sehingga tidak ada
    // approval "sukses" tanpa perubahan gaji yang benar-benar terjadi.
    const { data: existing } = await supabaseAdmin.from("struktur_gaji").select("id").eq("employee_id", review.employee_id).maybeSingle();
    const { error: salaryErr } = await supabaseAdmin.from("struktur_gaji").upsert({
      id: (existing as { id: string } | null)?.id || ("sal-" + crypto.randomUUID()),
      employee_id: review.employee_id, basic_salary: review.salary_after, updated_at: new Date().toISOString(),
    }, { onConflict: "employee_id" });
    if (salaryErr) {
      console.error("[rewards] updateSalaryReviewStatus salary update error:", salaryErr.message);
      return { error: "Gagal memperbarui struktur gaji. Status review tidak diubah." };
    }
  }

  const { error } = await supabaseAdmin.from("mutasi_karir").update({ status: approve ? "Disetujui" : "Ditolak" }).eq("id", id);
  if (error) { console.error("[rewards] updateSalaryReviewStatus error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/salary-review");
  revalidatePath("/hrd/rewards/salary");
  return { success: true };
}

// ── Total Rewards Statement ─────────────────────────────────────────────────
// Murni agregasi read-only dari tabel yang sudah ada — tidak ada tabel baru.
// Catatan: bpjs_config di admin.ts cuma punya persentase sisi KARYAWAN (yang
// dipotong dari gaji), tidak ada konfigurasi kontribusi sisi PERUSAHAAN di
// mana pun di app ini — jadi statement ini menampilkan apa yang benar-benar
// ada datanya (gaji, tunjangan, bonus/insentif disetujui, total dari slip
// gaji yang sudah digenerate), bukan mengarang angka "BPJS dibayar perusahaan".

export async function getTotalRewardsStatement(karyawanId: string, year: number) {
  await requireRole("hrd", "superadmin", "director");

  const [{ data: salaryRow }, { data: incentiveRows }, { data: payslipRows }, { data: emp }] = await Promise.all([
    supabaseAdmin.from("struktur_gaji").select("*").eq("employee_id", karyawanId).maybeSingle(),
    // period disimpan sebagai teks "MM/YYYY" (mis. "03/2026") — .gte/.lte di
    // sini akan jadi perbandingan string leksikografis yang salah (membanding-
    // kan digit bulan duluan, bukan tahun), jadi bocor data dari tahun lain.
    // .like("%/YYYY") cocok persis dengan suffix tahun, benar untuk semua bulan.
    supabaseAdmin.from("insentif").select("*").eq("employee_id", karyawanId).in("status", ["Disetujui", "Dibayarkan"])
      .like("period", `%/${year}`),
    supabaseAdmin.from("penggajian").select("*").eq("employee_id", karyawanId).eq("year", year),
    supabaseAdmin.from("karyawan").select("full_name, position, department").eq("id", karyawanId).maybeSingle(),
  ]);

  const salary = salaryRow as Record<string, unknown> | null;
  const basicMonthly = Number(salary?.basic_salary) || 0;
  const allowancesMonthly = (Number(salary?.transport_allowance) || 0) + (Number(salary?.meal_allowance) || 0)
    + (Number(salary?.housing_allowance) || 0) + (Number(salary?.position_allowance) || 0);

  const incentives = (incentiveRows || []) as { amount: number; type: string; program: string }[];
  const bonusTotal = incentives.filter(i => i.type === "bonus").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const incentiveTotal = incentives.filter(i => i.type === "incentive").reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const payslips = (payslipRows || []) as Array<Record<string, unknown>>;
  const monthsPaid = payslips.length;
  const totalNetPaid = payslips.reduce((s, p) => s + (Number(p.net_salary) || 0), 0);
  const totalTaxPaid = payslips.reduce((s, p) => s + (Number(p.tax) || 0), 0);
  const totalBpjsDeducted = payslips.reduce((s, p) => s + (Number(p.bpjs_health) || 0) + (Number(p.bpjs_employment) || 0), 0);

  const annualBasicRecurring = basicMonthly * 12;
  const annualAllowancesRecurring = allowancesMonthly * 12;
  const totalCompensation = annualBasicRecurring + annualAllowancesRecurring + bonusTotal + incentiveTotal;

  return {
    employee: emp as { full_name: string; position: string; department: string } | null,
    year,
    basicMonthly, allowancesMonthly,
    annualBasicRecurring, annualAllowancesRecurring,
    bonusTotal, incentiveTotal,
    monthsPaid, totalNetPaid, totalTaxPaid, totalBpjsDeducted,
    totalCompensation,
  };
}

// ── Reward Budget Control ───────────────────────────────────────────────────
// Pagu per departemen per periode — dicek sebagai indikator/warning saat
// approve bonus/insentif, bukan blocking keras.

export async function saveRewardBudget(formData: FormData): Promise<{ error: string } | { success: true }> {
  await requireRole("hrd", "superadmin");
  const department = (formData.get("department") as string || "").trim();
  const period = (formData.get("period") as string || "").trim();
  const budgetAmount = Number(formData.get("budget_amount")) || 0;
  if (!department || !period) return { error: "Departemen dan periode wajib diisi." };
  if (budgetAmount < 0) return { error: "Anggaran tidak valid." };

  const { data: existing } = await supabaseAdmin.from("reward_budget").select("id").eq("department", department).eq("period", period).maybeSingle();
  const { error } = await supabaseAdmin.from("reward_budget").upsert({
    id: (existing as { id: string } | null)?.id || ("rb-" + crypto.randomUUID()),
    department, period, budget_amount: budgetAmount,
  }, { onConflict: "department,period" });
  if (error?.code === "42P01" || error?.code === "PGRST205") return { error: "Jalankan migrasi 20260719001_reward_engine.sql terlebih dahulu." };
  if (error) { console.error("[rewards] saveRewardBudget error:", error.message); return { error: "Gagal memproses. Silakan coba lagi." }; }
  revalidatePath("/hrd/rewards/bonuses");
  revalidatePath("/hrd/rewards/incentives");
  return { success: true };
}

export async function getRewardBudgetStatus(department: string, period: string): Promise<{ budgetAmount: number; usedAmount: number } | null> {
  await requireRole("hrd", "superadmin");
  if (!department || !period) return null;

  const [{ data: budgetRow }, { data: usedRows }] = await Promise.all([
    supabaseAdmin.from("reward_budget").select("budget_amount").eq("department", department).eq("period", period).maybeSingle(),
    supabaseAdmin.from("insentif").select("amount, karyawan!employee_id(department)").eq("period", period).in("status", ["Disetujui", "Dibayarkan"]),
  ]);
  if (!budgetRow) return null;

  const used = ((usedRows || []) as Array<{ amount: number; karyawan?: { department?: string } | { department?: string }[] }>)
    .filter(r => {
      const k = Array.isArray(r.karyawan) ? r.karyawan[0] : r.karyawan;
      return k?.department === department;
    })
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);

  return { budgetAmount: Number((budgetRow as { budget_amount: number }).budget_amount) || 0, usedAmount: used };
}
