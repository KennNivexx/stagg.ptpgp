import { describe, it, expect, vi, beforeEach } from "vitest";

// supabaseAdmin.from(table) returns a chainable query-builder mock. Every
// chain method returns itself so any call order (.select().eq() or
// .select().eq().maybeSingle()) works, and the object is thenable so a bare
// `await` on the chain resolves too — matching how supabase-js's real
// builder can be awaited directly or terminated with .maybeSingle()/.single().
function makeSupabaseMock(responses: Record<string, { data: unknown; error: { code?: string; message?: string } | null }>) {
  return {
    from: vi.fn((table: string) => {
      const result = responses[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
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
  get supabaseAdmin() {
    return mockSupabase;
  },
}));

const { getEmployeeSalaryComponentsCore, sumEmployeeComponentsByTypeCore } = await import("./payroll-components-core");

function komponenRow(komponen_id: string, jumlah: number, jenis: { nama: string; tipe: "tunjangan" | "potongan"; taxable?: boolean; formula_type?: string; formula_percent?: number | null }) {
  return { komponen_id, jumlah, jenis_komponen_gaji: jenis };
}

describe("getEmployeeSalaryComponentsCore", () => {
  beforeEach(() => { mockSupabase = makeSupabaseMock({}); });

  it("maps tunjangan and potongan rows to their correct tipe", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [
          komponenRow("komp-transport", 400000, { nama: "Tunjangan Transport", tipe: "tunjangan", taxable: true, formula_type: "fixed" }),
          komponenRow("komp-amal", 50000, { nama: "Potongan Amal Jariyah", tipe: "potongan", taxable: true, formula_type: "fixed" }),
        ],
        error: null,
      },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1", 5000000);
    expect(result).toHaveLength(2);
    expect(result.find(c => c.komponen_id === "komp-transport")).toMatchObject({ tipe: "tunjangan", jumlah: 400000 });
    expect(result.find(c => c.komponen_id === "komp-amal")).toMatchObject({ tipe: "potongan", jumlah: 50000 });
  });

  it("resolves a percent_of_basic component against the supplied basic salary, not the stored jumlah", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [komponenRow("komp-jabatan", 999999999, { nama: "Tunjangan Jabatan", tipe: "tunjangan", taxable: true, formula_type: "percent_of_basic", formula_percent: 10 })],
        error: null,
      },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1", 5000000);
    // 10% of 5,000,000 = 500,000 — the stored `jumlah` (999999999) must be ignored for percent-based components.
    expect(result[0].jumlah).toBe(500000);
  });

  it("resolves a percent_of_basic component to 0 when basicSalary is omitted (callers must always pass it)", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [komponenRow("komp-jabatan", 500000, { nama: "Tunjangan Jabatan", tipe: "tunjangan", formula_type: "percent_of_basic", formula_percent: 10 })],
        error: null,
      },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1"); // basicSalary defaults to 0
    expect(result[0].jumlah).toBe(0);
  });

  it("keeps a zero-amount component as a real 0, not dropped from the list", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [komponenRow("komp-lembur", 0, { nama: "Tunjangan Lembur Tetap", tipe: "tunjangan", formula_type: "fixed" })],
        error: null,
      },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1", 5000000);
    expect(result).toHaveLength(1);
    expect(result[0].jumlah).toBe(0);
  });

  it("clamps a negative fixed component to 0 (spec: negative components are never valid)", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [komponenRow("komp-salah-input", -250000, { nama: "Salah Input", tipe: "tunjangan", formula_type: "fixed" })],
        error: null,
      },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1", 5000000);
    expect(result[0].jumlah).toBe(0);
  });

  it("clamps a negative percent_of_basic resolution to 0 too", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [komponenRow("komp-negatif", 0, { nama: "Negatif", tipe: "tunjangan", formula_type: "percent_of_basic", formula_percent: -10 })],
        error: null,
      },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1", 5000000);
    expect(result[0].jumlah).toBe(0);
  });

  it("defaults taxable to true only when explicitly false is absent (undefined taxable -> taxable)", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [
          komponenRow("komp-a", 100000, { nama: "A", tipe: "tunjangan", formula_type: "fixed" }), // taxable omitted
          komponenRow("komp-b", 100000, { nama: "B", tipe: "tunjangan", taxable: false, formula_type: "fixed" }),
        ],
        error: null,
      },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1", 5000000);
    expect(result.find(c => c.komponen_id === "komp-a")?.taxable).toBe(true);
    expect(result.find(c => c.komponen_id === "komp-b")?.taxable).toBe(false);
  });

  it("falls back to legacy struktur_gaji fixed columns when struktur_gaji_komponen table is missing", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: { data: null, error: { code: "42P01", message: "relation \"struktur_gaji_komponen\" does not exist" } },
      struktur_gaji: {
        data: { transport_allowance: 300000, meal_allowance: 0, housing_allowance: 0, position_allowance: 0, kompensasi: 0, potongan_amal_jariyah: 20000 },
        error: null,
      },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1", 5000000);
    // Only non-zero legacy columns should surface, plus the amal-jariyah potongan.
    expect(result).toHaveLength(2);
    expect(result.find(c => c.komponen_id === "komp-transport")).toMatchObject({ jumlah: 300000, tipe: "tunjangan" });
    expect(result.find(c => c.komponen_id === "komp-amal-jariyah")).toMatchObject({ jumlah: 20000, tipe: "potongan" });
  });

  it("returns an empty list when the legacy struktur_gaji row itself doesn't exist", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: { data: null, error: { code: "42P01", message: "does not exist" } },
      struktur_gaji: { data: null, error: null },
    });
    const result = await getEmployeeSalaryComponentsCore("emp-1", 5000000);
    expect(result).toEqual([]);
  });
});

describe("sumEmployeeComponentsByTypeCore", () => {
  beforeEach(() => { mockSupabase = makeSupabaseMock({}); });

  it("sums tunjangan and potongan into separate totals", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [
          komponenRow("komp-a", 400000, { nama: "A", tipe: "tunjangan", taxable: true, formula_type: "fixed" }),
          komponenRow("komp-b", 300000, { nama: "B", tipe: "tunjangan", taxable: true, formula_type: "fixed" }),
          komponenRow("komp-c", 50000, { nama: "C", tipe: "potongan", taxable: true, formula_type: "fixed" }),
        ],
        error: null,
      },
    });
    const result = await sumEmployeeComponentsByTypeCore("emp-1", 5000000);
    expect(result.tunjangan).toBe(700000);
    expect(result.potongan).toBe(50000);
  });

  it("excludes non-taxable tunjangan from taxableTunjangan while still counting it in tunjangan (BPJS base vs PPh21 base)", async () => {
    mockSupabase = makeSupabaseMock({
      struktur_gaji_komponen: {
        data: [
          komponenRow("komp-taxed", 400000, { nama: "Kena Pajak", tipe: "tunjangan", taxable: true, formula_type: "fixed" }),
          komponenRow("komp-exempt", 200000, { nama: "Bebas Pajak", tipe: "tunjangan", taxable: false, formula_type: "fixed" }),
        ],
        error: null,
      },
    });
    const result = await sumEmployeeComponentsByTypeCore("emp-1", 5000000);
    expect(result.tunjangan).toBe(600000); // BPJS wage base includes both
    expect(result.taxableTunjangan).toBe(400000); // PPh21 base excludes the exempt one
  });

  it("returns all zeros when the employee has no components at all", async () => {
    mockSupabase = makeSupabaseMock({ struktur_gaji_komponen: { data: [], error: null } });
    const result = await sumEmployeeComponentsByTypeCore("emp-1", 5000000);
    expect(result).toEqual({ tunjangan: 0, potongan: 0, taxableTunjangan: 0 });
  });
});
