import { describe, it, expect } from "vitest";
import { normalizeWaNumber } from "@/lib/whatsapp";

describe("normalizeWaNumber", () => {
  it("converts a local 08xx number to 62xx", () => {
    expect(normalizeWaNumber("081234567890")).toEqual({ number: "6281234567890" });
  });

  it("passes through an already-international 62xx number", () => {
    expect(normalizeWaNumber("6281234567890")).toEqual({ number: "6281234567890" });
  });

  it("adds the 62 prefix to a bare 8xx number", () => {
    expect(normalizeWaNumber("81234567890")).toEqual({ number: "6281234567890" });
  });

  it("strips formatting characters (spaces, dashes, +) before normalizing", () => {
    expect(normalizeWaNumber("+62 812-3456-7890")).toEqual({ number: "6281234567890" });
  });

  it("rejects numbers that are too short to be valid", () => {
    expect(normalizeWaNumber("6281")).toEqual({ error: "Format nomor WhatsApp tidak valid." });
  });

  it("rejects non-numeric garbage", () => {
    expect(normalizeWaNumber("bukan-nomor")).toEqual({ error: "Format nomor WhatsApp tidak valid." });
  });
});
