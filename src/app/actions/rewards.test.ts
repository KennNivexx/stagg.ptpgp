import { describe, it, expect, vi, beforeEach } from "vitest";

// One employee + one rule per test keeps this a static, table-keyed mock
// (no need to differentiate by row inside a table) while still exercising
// each gate for real — evaluateRewardRules loops rules x employees and
// makes several sequential supabaseAdmin calls per pair.
function makeSupabaseMock(responses: Record<string, { data?: unknown; error?: unknown; count?: number }>) {
  return {
    from: vi.fn((table: string) => {
      const result = responses[table] ?? { data: null, error: null, count: 0 };
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        neq: () => builder,
        gte: () => builder,
        lte: () => builder,
        not: () => builder,
        order: () => builder,
        limit: () => builder,
        insert: () => Promise.resolve({ data: null, error: (result as { error?: unknown }).error ?? null }),
        maybeSingle: () => Promise.resolve(result),
        single: () => Promise.resolve(result),
        then: (resolve: (r: unknown) => void) => resolve(result),
      };
      return builder;
    }),
  };
}

let mockSupabase = makeSupabaseMock({});

vi.mock("@/lib/supabase", () => ({
  get supabaseAdmin() { return mockSupabase; },
}));
vi.mock("@/lib/auth-guard", () => ({
  requireRole: vi.fn(async () => ({ id: "u1", role: "hrd", name: "HRD Test", email: "hrd@ptpgp.co.id" })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dept-resolve", () => ({ resolveManagerDepartment: vi.fn(async () => null) }));

const { evaluateRewardRules, recommendMeritPct } = await import("./rewards");

const ONE_EMPLOYEE = [{ id: "emp-1", department: "Divisi Operasional", email: "budi@ptpgp.co.id" }];

describe("evaluateRewardRules", () => {
  beforeEach(() => { mockSupabase = makeSupabaseMock({}); });

  it("skips an employee whose KPI score is below the rule's minimum", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Kinerja", aktif: true, min_kpi_score: 85, calc_method: "fixed_amount", calc_value: 500000, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      evaluasi_kpi: { data: { final_score: 80, score: 80 } }, // below 85
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 0 });
  });

  it("generates an incentive when KPI score meets the minimum and no other gate is set", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Kinerja", aktif: true, min_kpi_score: 85, calc_method: "fixed_amount", calc_value: 500000, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      evaluasi_kpi: { data: { final_score: 90, score: 90 } },
      insentif: { data: null }, // no existing duplicate
      struktur_gaji: { data: { basic_salary: 6000000 } },
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 1 });
  });

  it("skips an employee below the required attendance percentage", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Kehadiran", aktif: true, min_attendance_pct: 95, calc_method: "fixed_amount", calc_value: 200000, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      pengguna: { data: { id: "usr-1" } },
      absensi: { data: null, count: 5 }, // ~5/23 working days -> well under 95%
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 0 });
  });

  it("skips an employee who has an active warning letter when the rule requires none", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Disiplin", aktif: true, no_active_warning: true, calc_method: "fixed_amount", calc_value: 200000, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      surat_peringatan: { data: null, count: 1 }, // has an active SP
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 0 });
  });

  it("passes an employee with zero active warnings when the rule requires none", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Disiplin", aktif: true, no_active_warning: true, calc_method: "fixed_amount", calc_value: 200000, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      surat_peringatan: { data: null, count: 0 },
      insentif: { data: null },
      struktur_gaji: { data: { basic_salary: 6000000 } },
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 1 });
  });

  it("skips an employee whose training completion rate is below the rule's minimum", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Pembelajaran", aktif: true, min_training_completion_pct: 80, calc_method: "fixed_amount", calc_value: 150000, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      peserta_pelatihan: { data: [{ status: "Completed" }, { status: "Ongoing" }, { status: "Ongoing" }, { status: "Ongoing" }] }, // 1/4 = 25%
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 0 });
  });

  it("passes an employee whose training completion rate meets the minimum", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Pembelajaran", aktif: true, min_training_completion_pct: 80, calc_method: "fixed_amount", calc_value: 150000, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      peserta_pelatihan: { data: [{ status: "Completed" }, { status: "Completed" }] },
      insentif: { data: null },
      struktur_gaji: { data: { basic_salary: 6000000 } },
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 1 });
  });

  it("does not generate a duplicate incentive for the same employee/rule/period", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Kinerja", aktif: true, min_kpi_score: 85, calc_method: "fixed_amount", calc_value: 500000, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      evaluasi_kpi: { data: { final_score: 90, score: 90 } },
      insentif: { data: { id: "inc-existing" } }, // already generated before
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 0 });
  });

  it("does not create an incentive when the computed amount is zero or negative", async () => {
    mockSupabase = makeSupabaseMock({
      aturan_reward: { data: [{ nama: "Bonus Nol", aktif: true, calc_method: "fixed_amount", calc_value: 0, reward_type: "bonus" }] },
      karyawan: { data: ONE_EMPLOYEE },
      insentif: { data: null },
      struktur_gaji: { data: { basic_salary: 6000000 } },
    });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toMatchObject({ success: true, generated: 0 });
  });

  it("returns an error when there are no active reward rules", async () => {
    mockSupabase = makeSupabaseMock({ aturan_reward: { data: [] } });
    const result = await evaluateRewardRules("07/2026");
    expect(result).toEqual({ error: "Belum ada aturan reward aktif." });
  });

  it("requires a period before doing any work", async () => {
    const result = await evaluateRewardRules("");
    expect(result).toEqual({ error: "Periode wajib diisi (format MM/YYYY)." });
  });
});

describe("recommendMeritPct", () => {
  beforeEach(() => { mockSupabase = makeSupabaseMock({}); });

  const EMP_WITH_GRADE = {
    karyawan: { data: { formasi_id: "form-1" } },
    formasi_jabatan: { data: { jabatan_id: "jab-1" } },
    jabatan: { data: { grade_id: "grade-g05" } },
  };

  it("prefers a grade-specific band over a generic (grade_id null) band", async () => {
    mockSupabase = makeSupabaseMock({
      ...EMP_WITH_GRADE,
      evaluasi_kpi: { data: { final_score: 88, score: 88 } },
      merit_matrix: {
        data: [
          { grade_id: null, merit_pct: 3 },
          { grade_id: "grade-g05", merit_pct: 7 },
        ],
      },
    });
    const result = await recommendMeritPct("emp-1");
    expect(result).toEqual({ meritPct: 7, gradeId: "grade-g05", kpiScore: 88 });
  });

  it("falls back to the generic band when no grade-specific band matches", async () => {
    mockSupabase = makeSupabaseMock({
      ...EMP_WITH_GRADE,
      evaluasi_kpi: { data: { final_score: 88, score: 88 } },
      merit_matrix: { data: [{ grade_id: null, merit_pct: 3 }] },
    });
    const result = await recommendMeritPct("emp-1");
    expect(result).toEqual({ meritPct: 3, gradeId: "grade-g05", kpiScore: 88 });
  });

  it("returns meritPct 0 when the employee has no KPI evaluation at all", async () => {
    mockSupabase = makeSupabaseMock({
      ...EMP_WITH_GRADE,
      evaluasi_kpi: { data: null },
    });
    const result = await recommendMeritPct("emp-1");
    expect(result).toEqual({ meritPct: 0, gradeId: "grade-g05", kpiScore: null });
  });

  it("returns meritPct 0 when a KPI score exists but no band covers it", async () => {
    mockSupabase = makeSupabaseMock({
      ...EMP_WITH_GRADE,
      evaluasi_kpi: { data: { final_score: 40, score: 40 } },
      merit_matrix: { data: [] }, // no band covers a score this low
    });
    const result = await recommendMeritPct("emp-1");
    expect(result.meritPct).toBe(0);
    expect(result.kpiScore).toBe(40);
  });
});
