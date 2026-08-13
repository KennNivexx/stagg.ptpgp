import { describe, it, expect, vi, beforeEach } from "vitest";

function makeSupabaseMock(responses: Record<string, { data?: unknown; error?: unknown }>) {
  return {
    from: vi.fn((table: string) => {
      const result = responses[table] ?? { data: null, error: null };
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: () => builder,
        lte: () => builder,
        gte: () => builder,
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

const { haversineMeters, checkGeofenceForEmployee } = await import("./geofence");

describe("haversineMeters", () => {
  it("returns ~0 for the same coordinate", () => {
    expect(haversineMeters(-6.2, 106.8, -6.2, 106.8)).toBeCloseTo(0, 3);
  });

  it("matches a known real-world distance (Monas to Bundaran HI, Jakarta, ~2.9km)", () => {
    const monas = { lat: -6.1754, lng: 106.8272 };
    const bundaranHI = { lat: -6.1953, lng: 106.8230 };
    const distance = haversineMeters(monas.lat, monas.lng, bundaranHI.lat, bundaranHI.lng);
    expect(distance).toBeGreaterThan(2000);
    expect(distance).toBeLessThan(3500);
  });

  it("is symmetric — order of points doesn't change the result", () => {
    const a = haversineMeters(-6.2, 106.8, -6.9, 107.6);
    const b = haversineMeters(-6.9, 107.6, -6.2, 106.8);
    expect(a).toBeCloseTo(b, 6);
  });
});

describe("checkGeofenceForEmployee", () => {
  beforeEach(() => { mockSupabase = makeSupabaseMock({}); });

  it("bypasses the geofence entirely when the employee has an approved business trip covering today", () => {
    mockSupabase = makeSupabaseMock({
      perjalanan_dinas: { data: { id: "trip-1" } },
    });
    return checkGeofenceForEmployee({ employeeId: "e1", employeeEmail: "budi@ptpgp.co.id", latitude: "0", longitude: "0" })
      .then(result => {
        expect(result).toMatchObject({ blocked: false, isBusinessTrip: true });
      });
  });

  it("fails open (does not block) when the employee has no assigned work location", () => {
    mockSupabase = makeSupabaseMock({
      perjalanan_dinas: { data: null },
      karyawan: { data: { location_id: null } },
    });
    return checkGeofenceForEmployee({ employeeId: "e1", employeeEmail: "budi@ptpgp.co.id", latitude: "0", longitude: "0" })
      .then(result => {
        expect(result).toMatchObject({ blocked: false, isBusinessTrip: false, distanceMeters: null });
      });
  });

  it("fails open when the assigned location has no coordinates configured yet", () => {
    mockSupabase = makeSupabaseMock({
      perjalanan_dinas: { data: null },
      karyawan: { data: { location_id: "loc-1" } },
      lokasi_kerja: { data: { latitude: null, longitude: null, name: "Kantor Pusat" } },
    });
    return checkGeofenceForEmployee({ employeeId: "e1", employeeEmail: "budi@ptpgp.co.id", latitude: "0", longitude: "0" })
      .then(result => {
        expect(result.blocked).toBe(false);
      });
  });

  it("blocks with a clear message when GPS coordinates weren't captured", () => {
    mockSupabase = makeSupabaseMock({
      perjalanan_dinas: { data: null },
      karyawan: { data: { location_id: "loc-1" } },
      lokasi_kerja: { data: { latitude: -6.2, longitude: 106.8, radius_meters: 200, name: "Kantor Pusat" } },
    });
    return checkGeofenceForEmployee({ employeeId: "e1", employeeEmail: "budi@ptpgp.co.id", latitude: "", longitude: "" })
      .then(result => {
        expect(result.blocked).toBe(true);
        if (result.blocked) expect(result.error).toContain("GPS");
      });
  });

  it("blocks when the employee is outside the configured radius", () => {
    mockSupabase = makeSupabaseMock({
      perjalanan_dinas: { data: null },
      karyawan: { data: { location_id: "loc-1" } },
      lokasi_kerja: { data: { latitude: -6.2, longitude: 106.8, radius_meters: 200, name: "Kantor Pusat" } },
    });
    // ~1.1km away — well outside a 200m radius.
    return checkGeofenceForEmployee({ employeeId: "e1", employeeEmail: "budi@ptpgp.co.id", latitude: "-6.21", longitude: "106.8" })
      .then(result => {
        expect(result.blocked).toBe(true);
        if (result.blocked) expect(result.error).toContain("Kantor Pusat");
      });
  });

  it("allows clock-in when the employee is within the configured radius", () => {
    mockSupabase = makeSupabaseMock({
      perjalanan_dinas: { data: null },
      karyawan: { data: { location_id: "loc-1" } },
      lokasi_kerja: { data: { latitude: -6.2, longitude: 106.8, radius_meters: 200, name: "Kantor Pusat" } },
    });
    return checkGeofenceForEmployee({ employeeId: "e1", employeeEmail: "budi@ptpgp.co.id", latitude: "-6.2001", longitude: "106.8001" })
      .then(result => {
        expect(result.blocked).toBe(false);
        if (!result.blocked) expect(result.withinGeofence).toBe(true);
      });
  });
});
