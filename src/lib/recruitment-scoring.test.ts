import { describe, it, expect, vi, beforeEach } from "vitest";

function makeSupabaseMock(responses: Record<string, { data?: unknown; error?: unknown }>) {
  return {
    from: vi.fn((table: string) => {
      const result = responses[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        update: () => builder,
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

const { computeMatchScoreCore, applyAutoScreening, yearsFromExperiences } = await import("./recruitment-scoring");

function pelamarRow(profile: Record<string, unknown>, jobId: string | null = "job-1") {
  return { resume_url: JSON.stringify(profile), job_id: jobId };
}

describe("yearsFromExperiences", () => {
  it("computes whole+fractional years from a closed date range", () => {
    const years = yearsFromExperiences([{ company: "A", position: "Staff", start: "2020-01-01", end: "2022-07-01", current: false }]);
    expect(years).toBeCloseTo(2.5, 1);
  });

  it("treats a current job (current: true) as running through today", () => {
    const years = yearsFromExperiences([{ company: "A", position: "Staff", start: "2015-01-01", end: "", current: true }]);
    expect(years).toBeGreaterThan(5); // well over a decade by now regardless of exact "today"
  });

  it("skips an entry with no start date instead of throwing or counting it", () => {
    const years = yearsFromExperiences([{ company: "A", position: "Staff", start: "", end: "", current: false }]);
    expect(years).toBe(0);
  });

  it("sums multiple non-overlapping jobs", () => {
    const years = yearsFromExperiences([
      { company: "A", position: "Staff", start: "2018-01-01", end: "2019-01-01", current: false },
      { company: "B", position: "Staff", start: "2019-06-01", end: "2020-06-01", current: false },
    ]);
    expect(years).toBeCloseTo(2, 1);
  });
});

describe("computeMatchScoreCore", () => {
  beforeEach(() => { mockSupabase = makeSupabaseMock({}); });

  it("returns an error when the application doesn't exist", async () => {
    mockSupabase = makeSupabaseMock({ pelamar: { data: null } });
    const result = await computeMatchScoreCore("app-missing");
    expect(result).toEqual({ error: "Lamaran tidak ditemukan." });
  });

  it("scores all three dimensions when candidate data and job requirements are both complete", async () => {
    mockSupabase = makeSupabaseMock({
      pelamar: { data: pelamarRow({
        skills: ["React", "TypeScript"],
        experiences: [{ company: "A", position: "Dev", start: "2020-01-01", end: "2023-01-01", current: false }],
        educations: [{ school: "ITB", degree: "S1", field: "Informatika", start: "2015", end: "2019" }],
      }) },
      lowongan_kerja: { data: { education: "S1", experience: "2 tahun", requirements: "Menguasai React dan TypeScript", description: "" } },
    });
    const result = await computeMatchScoreCore("app-1");
    expect(result).toMatchObject({ success: true });
    if ("success" in result) {
      const byKey = Object.fromEntries(result.result.components.map(c => [c.key, c]));
      expect(byKey.education.weight).toBe(25);
      expect(byKey.education.score).toBe(100); // S1 candidate meets S1 requirement
      expect(byKey.experience.weight).toBe(35);
      expect(byKey.skills.weight).toBe(40);
      expect(byKey.skills.score).toBe(100); // both skills mentioned in requirements text
      expect(result.result.score).toBeGreaterThan(0);
    }
  });

  it("zeroes out (not fakes) the skills component when the candidate listed no skills", async () => {
    mockSupabase = makeSupabaseMock({
      pelamar: { data: pelamarRow({
        skills: [],
        experiences: [{ company: "A", position: "Dev", start: "2020-01-01", end: "2023-01-01", current: false }],
        educations: [{ school: "ITB", degree: "S1", field: "Informatika", start: "2015", end: "2019" }],
      }) },
      lowongan_kerja: { data: { education: "S1", experience: "2 tahun", requirements: "React", description: "" } },
    });
    const result = await computeMatchScoreCore("app-1");
    if ("success" in result) {
      const skills = result.result.components.find(c => c.key === "skills")!;
      expect(skills.weight).toBe(0);
      expect(skills.score).toBe(0);
      // Final score must be the weighted average of ONLY the comparable components,
      // not dragged down by treating the incomparable one as a real 0-out-of-40.
      const comparable = result.result.components.filter(c => c.weight > 0);
      const expected = Math.round(comparable.reduce((s, c) => s + c.score * c.weight, 0) / comparable.reduce((s, c) => s + c.weight, 0));
      expect(result.result.score).toBe(expected);
    }
  });

  it("zeroes out the education component when the job has no education requirement", async () => {
    mockSupabase = makeSupabaseMock({
      pelamar: { data: pelamarRow({
        skills: ["React"],
        experiences: [{ company: "A", position: "Dev", start: "2020-01-01", end: "2023-01-01", current: false }],
        educations: [{ school: "ITB", degree: "S1", field: "Informatika", start: "2015", end: "2019" }],
      }) },
      lowongan_kerja: { data: { education: "", experience: "2 tahun", requirements: "React", description: "" } },
    });
    const result = await computeMatchScoreCore("app-1");
    if ("success" in result) {
      const education = result.result.components.find(c => c.key === "education")!;
      expect(education.weight).toBe(0);
    }
  });

  it("returns an overall score of 0, not an error, when the applicant profile and job requirements are entirely empty", async () => {
    mockSupabase = makeSupabaseMock({
      pelamar: { data: pelamarRow({}, null) }, // no job_id at all
      lowongan_kerja: { data: null },
    });
    const result = await computeMatchScoreCore("app-1");
    expect(result).toMatchObject({ success: true });
    if ("success" in result) {
      expect(result.result.score).toBe(0);
      expect(result.result.components.every(c => c.weight === 0)).toBe(true);
    }
  });
});

describe("applyAutoScreening", () => {
  const makeResult = (overrides: Partial<Record<"education" | "experience", { score: number; weight: number }>>) => ({
    score: 50,
    computedAt: new Date().toISOString(),
    components: [
      { key: "education", label: "Pendidikan", weight: overrides.education?.weight ?? 25, score: overrides.education?.score ?? 100, note: "catatan pendidikan" },
      { key: "experience", label: "Pengalaman Kerja", weight: overrides.experience?.weight ?? 35, score: overrides.experience?.score ?? 100, note: "catatan pengalaman" },
      { key: "skills", label: "Kecocokan Skill", weight: 40, score: 100, note: "catatan skill" },
    ],
  });

  beforeEach(() => { mockSupabase = makeSupabaseMock({ pelamar: { data: {}, error: null } }); });

  it("rejects when education score is a REAL below-50 with weight > 0 (data was actually comparable)", async () => {
    const result = await applyAutoScreening("app-1", makeResult({ education: { score: 40, weight: 25 } }));
    expect(result.rejected).toBe(true);
    expect(result.reason).toContain("catatan pendidikan");
  });

  it("rejects when experience score is a REAL below-40 with weight > 0", async () => {
    const result = await applyAutoScreening("app-1", makeResult({ experience: { score: 20, weight: 35 } }));
    expect(result.rejected).toBe(true);
    expect(result.reason).toContain("catatan pengalaman");
  });

  it("does NOT reject on a 0 education score when weight is 0 (data was missing, not actually failing)", async () => {
    // This is the exact case the spec calls out: score defaults to 0 when
    // there's nothing to compare, and that must never be treated the same
    // as a candidate who was compared and genuinely scored below threshold.
    const result = await applyAutoScreening("app-1", makeResult({ education: { score: 0, weight: 0 } }));
    expect(result.rejected).toBe(false);
  });

  it("does NOT reject on a 0 experience score when weight is 0", async () => {
    const result = await applyAutoScreening("app-1", makeResult({ experience: { score: 0, weight: 0 } }));
    expect(result.rejected).toBe(false);
  });

  it("does not reject when both scores comfortably clear their thresholds", async () => {
    const result = await applyAutoScreening("app-1", makeResult({ education: { score: 80, weight: 25 }, experience: { score: 60, weight: 35 } }));
    expect(result.rejected).toBe(false);
  });

  it("combines both reasons when education AND experience genuinely fail together", async () => {
    const result = await applyAutoScreening("app-1", makeResult({ education: { score: 10, weight: 25 }, experience: { score: 10, weight: 35 } }));
    expect(result.rejected).toBe(true);
    expect(result.reason).toContain("catatan pendidikan");
    expect(result.reason).toContain("catatan pengalaman");
  });

  it("treats a score exactly at the threshold as passing (only strictly-below fails)", async () => {
    const result = await applyAutoScreening("app-1", makeResult({ education: { score: 50, weight: 25 }, experience: { score: 40, weight: 35 } }));
    expect(result.rejected).toBe(false);
  });
});
