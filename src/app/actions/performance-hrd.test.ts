import { describe, it, expect, vi, beforeEach } from "vitest";

let capturedUpdate: Record<string, unknown> | null = null;

function makeSupabaseMock(responses: Record<string, { data?: unknown; error?: unknown }>) {
  return {
    from: vi.fn((table: string) => {
      const result = responses[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        in: () => builder,
        is: () => builder,
        not: () => builder,
        update: (payload: Record<string, unknown>) => {
          if (table === "evaluasi_kpi") capturedUpdate = payload;
          return builder;
        },
        maybeSingle: () => Promise.resolve(result),
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

const { recomputeFinalScore } = await import("./performance-hrd");

const NO_JABATAN = { karyawan: { data: { formasi_id: null } } };

describe("recomputeFinalScore", () => {
  beforeEach(() => {
    mockSupabase = makeSupabaseMock({});
    capturedUpdate = null;
  });

  it("does nothing when there is no KPI evaluation for that employee/period", async () => {
    mockSupabase = makeSupabaseMock({ evaluasi_kpi: { data: null } });
    await recomputeFinalScore("emp-1", "07/2026");
    expect(capturedUpdate).toBeNull();
  });

  it("does nothing when employeeId or period is missing", async () => {
    await recomputeFinalScore("", "07/2026");
    await recomputeFinalScore("emp-1", "");
    expect(capturedUpdate).toBeNull();
  });

  it("falls back to the hardcoded 70/30 split when no framework (jabatan-specific or default) is configured", async () => {
    mockSupabase = makeSupabaseMock({
      evaluasi_kpi: { data: { id: "kpi-1", score: 80 } },
      ...NO_JABATAN,
      performance_framework: { data: null },
      umpan_balik_kinerja: { data: [] },
    });
    await recomputeFinalScore("emp-1", "07/2026");
    // No feedback -> cultureScore 0 -> final = 80 * 0.7 + 0 * 0.3 = 56
    expect(capturedUpdate).toMatchObject({ final_score: 56, ta_weight_used: 70, culture_weight_used: 30, culture_score: null });
  });

  it("uses a jabatan-specific framework when one is configured, ignoring the global default", async () => {
    mockSupabase = makeSupabaseMock({
      evaluasi_kpi: { data: { id: "kpi-1", score: 100 } },
      karyawan: { data: { formasi_id: "form-1" } },
      formasi_jabatan: { data: { jabatan_id: "jab-sales" } },
      performance_framework: { data: { ta_weight_pct: 90, culture_weight_pct: 10 } }, // jabatan-specific: sales weighs KPI heavily
      umpan_balik_kinerja: { data: [] },
    });
    await recomputeFinalScore("emp-1", "07/2026");
    expect(capturedUpdate).toMatchObject({ final_score: 90, ta_weight_used: 90, culture_weight_used: 10 }); // 100*0.9 + 0*0.1
  });

  it("weights culture score by each core value's bobot_default instead of a flat average across all feedback", async () => {
    mockSupabase = makeSupabaseMock({
      evaluasi_kpi: { data: { id: "kpi-1", score: 0 } }, // isolate the culture-score math by zeroing out the KPI side
      ...NO_JABATAN,
      performance_framework: { data: { ta_weight_pct: 0, culture_weight_pct: 100 } },
      umpan_balik_kinerja: {
        data: [
          { rating: 5, budaya_id: "integritas" }, // 5*20 = 100
          { rating: 3, budaya_id: "teamwork" },   // 3*20 = 60
        ],
      },
      budaya_perusahaan: {
        data: [
          { id: "integritas", bobot_default: 30 },
          { id: "teamwork", bobot_default: 10 },
        ],
      },
    });
    await recomputeFinalScore("emp-1", "07/2026");
    // weighted = (100*30 + 60*10) / (30+10) = (3000+600)/40 = 90
    expect(capturedUpdate).toMatchObject({ final_score: 90, culture_score: 90 });
  });

  it("averages multiple feedback entries tagged to the SAME core value before applying that value's weight", async () => {
    mockSupabase = makeSupabaseMock({
      evaluasi_kpi: { data: { id: "kpi-1", score: 0 } },
      ...NO_JABATAN,
      performance_framework: { data: { ta_weight_pct: 0, culture_weight_pct: 100 } },
      umpan_balik_kinerja: {
        data: [
          { rating: 5, budaya_id: "integritas" }, // 100
          { rating: 3, budaya_id: "integritas" }, // 60 -> avg for integritas = 80
        ],
      },
      budaya_perusahaan: { data: [{ id: "integritas", bobot_default: 30 }] },
    });
    await recomputeFinalScore("emp-1", "07/2026");
    expect(capturedUpdate).toMatchObject({ final_score: 80, culture_score: 80 });
  });

  it("saves culture_score as null (not 0) when there was no feedback at all — 0 must not look like a real bad score", async () => {
    mockSupabase = makeSupabaseMock({
      evaluasi_kpi: { data: { id: "kpi-1", score: 75 } },
      ...NO_JABATAN,
      performance_framework: { data: { ta_weight_pct: 70, culture_weight_pct: 30 } },
      umpan_balik_kinerja: { data: [] },
    });
    await recomputeFinalScore("emp-1", "07/2026");
    expect(capturedUpdate?.culture_score).toBeNull();
    expect(capturedUpdate?.final_score).toBe(53); // round(75*0.7 + 0*0.3) = round(52.5) = 53 (banker's? Math.round -> 53)
  });

  it("rounds the final blended score to the nearest integer", async () => {
    mockSupabase = makeSupabaseMock({
      evaluasi_kpi: { data: { id: "kpi-1", score: 83 } },
      ...NO_JABATAN,
      performance_framework: { data: { ta_weight_pct: 65, culture_weight_pct: 35 } },
      umpan_balik_kinerja: {
        data: [{ rating: 4, budaya_id: "integritas" }], // 80
      },
      budaya_perusahaan: { data: [{ id: "integritas", bobot_default: 20 }] },
    });
    await recomputeFinalScore("emp-1", "07/2026");
    // 83*0.65 + 80*0.35 = 53.95 + 28 = 81.95 -> rounds to 82
    expect(capturedUpdate?.final_score).toBe(82);
  });
});
