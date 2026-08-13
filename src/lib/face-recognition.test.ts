import { describe, it, expect } from "vitest";
import { euclideanDistance, averageDescriptors, matchFace, findBestFaceMatch } from "./face-recognition";

describe("euclideanDistance", () => {
  it("is 0 for identical vectors", () => {
    expect(euclideanDistance([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it("computes the exact distance for a simple known 3-4-5 case", () => {
    expect(euclideanDistance([0, 0], [3, 4])).toBe(5);
  });

  it("compares only the overlapping length when arrays differ in size, instead of throwing", () => {
    expect(euclideanDistance([0, 0, 0], [3, 4])).toBe(5);
  });
});

describe("averageDescriptors — regression guard for the NaN-poisoning bug", () => {
  const full = (fillValue: number) => new Array(128).fill(fillValue);

  it("averages multiple full-length (128-dim) descriptors element-wise", () => {
    const result = averageDescriptors([full(0), full(2)]);
    expect(result).toHaveLength(128);
    expect(result[0]).toBe(1);
    expect(result[127]).toBe(1);
  });

  it("filters out a short/corrupted descriptor instead of letting it poison the average with NaN", () => {
    const corrupted = [1, 2, 3]; // not 128-dim
    const result = averageDescriptors([full(4), corrupted]);
    expect(result).toHaveLength(128);
    // Only the one valid 128-dim descriptor should count — average of just itself.
    expect(result.every(v => v === 4)).toBe(true);
    expect(result.some(Number.isNaN)).toBe(false);
  });

  it("returns an empty array when no descriptor is the correct length", () => {
    expect(averageDescriptors([[1, 2, 3]])).toEqual([]);
  });
});

describe("matchFace — threshold boundaries (regression guard: must stay 0.45, not drift back to 0.65)", () => {
  // euclideanDistance([0], [d]) === d for a single-dimension vector, so these
  // construct descriptors with an EXACT known distance from the reference.
  const ref = [0];
  const at = (distance: number) => [distance];

  it("labels a very close match (< 0.35) as Sangat Cocok and matched", () => {
    const r = matchFace(at(0.30), ref);
    expect(r).toMatchObject({ matched: true, label: "Sangat Cocok" });
  });

  it("labels a distance just under 0.45 as Cocok and matched — this is the real accept threshold", () => {
    const r = matchFace(at(0.44), ref);
    expect(r).toMatchObject({ matched: true, label: "Cocok" });
  });

  it("rejects at exactly 0.45 (strictly-less-than semantics, not less-than-or-equal)", () => {
    const r = matchFace(at(0.45), ref);
    expect(r.matched).toBe(false);
    expect(r.label).toBe("Ragu");
  });

  it("labels 0.45-0.55 as Ragu (doubtful) and NOT matched", () => {
    const r = matchFace(at(0.50), ref);
    expect(r).toMatchObject({ matched: false, label: "Ragu" });
  });

  it("labels >= 0.55 as Tidak Cocok and not matched", () => {
    const r = matchFace(at(0.60), ref);
    expect(r).toMatchObject({ matched: false, label: "Tidak Cocok" });
  });

  it("would have incorrectly accepted a 0.60 distance under the old 0.65 threshold — confirms the fix actually took", () => {
    // Historical regression check: this exact case (distance 0.60) is the
    // kind of "visibly different face" that the old 0.65 threshold let through.
    const r = matchFace(at(0.60), ref);
    expect(r.matched).toBe(false);
  });
});

describe("findBestFaceMatch", () => {
  const refs = [
    { employeeId: "e1", employeeName: "Budi", descriptor: [0] },
    { employeeId: "e2", employeeName: "Siti", descriptor: [1] },
  ];

  it("picks the closest reference among several candidates", () => {
    const best = findBestFaceMatch([0.1], refs);
    expect(best?.employeeId).toBe("e1");
  });

  it("returns null when even the closest match is at or beyond the threshold", () => {
    const farFromBoth = [10];
    expect(findBestFaceMatch(farFromBoth, refs)).toBeNull();
  });

  it("respects a custom threshold override instead of the 0.45 default", () => {
    // Distance from [0.5] to ref e1 ([0]) is 0.5 — beyond the default 0.45,
    // but within a deliberately looser 0.6 threshold passed by the caller.
    const result = findBestFaceMatch([0.5], refs, 0.6);
    expect(result?.employeeId).toBe("e1");
  });

  it("returns null when given no reference descriptors at all", () => {
    expect(findBestFaceMatch([0], [])).toBeNull();
  });
});
