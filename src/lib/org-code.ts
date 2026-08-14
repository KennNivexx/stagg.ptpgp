/**
 * Pure helpers for unit_organisasi's dot-separated hierarchy codes (e.g.
 * "1.2.1.0.0.0.0"). Extracted out of src/app/actions/org.ts so they're
 * reusable from other "use server" action files (which can only export
 * async functions themselves, so these plain sync helpers couldn't live
 * there and still be imported elsewhere) — e.g. formasi.ts needs
 * getParentCode()/codeLevel() to validate a formasi assignment against its
 * unit's parent, without duplicating this logic a second time.
 */

export function codeSegments(code: string): number[] {
  return code.split(".").map(Number);
}

/** Tree depth (0 = root), derived purely from how many non-zero segments a
 * code has — never a free-form/stored value. */
export function codeLevel(code: string): number {
  return codeSegments(code).filter(d => d > 0).length - 1;
}

export function generateCode(parentCode: string, siblingCount: number): string {
  const digits = codeSegments(parentCode);
  let level = 0;
  for (let i = 0; i < digits.length; i++) {
    if (digits[i] > 0) level = i + 1;
  }
  digits[level] = siblingCount + 1;
  for (let i = level + 1; i < digits.length; i++) digits[i] = 0;
  return digits.join(".");
}

export function getParentCode(code: string): string | null {
  const digits = codeSegments(code);
  let lastNonZero = -1;
  for (let i = 0; i < digits.length; i++) if (digits[i] > 0) lastNonZero = i;
  if (lastNonZero <= 0) return null;
  digits[lastNonZero] = 0;
  return digits.join(".");
}

export function isDescendantOf(code: string, ancestor: string): boolean {
  // Codes are fixed-width and zero-padded (e.g. "1.1.2.1.0.0.0"), so `code`
  // and `ancestor` always have the same segment count — a plain length
  // comparison can never distinguish shallower from deeper codes.
  const a = codeSegments(ancestor);
  const c = codeSegments(code);
  let aDepth = -1;
  for (let i = 0; i < a.length; i++) if (a[i] > 0) aDepth = i;
  if (aDepth < 0) return false;
  for (let i = 0; i <= aDepth; i++) if (c[i] !== a[i]) return false;
  return aDepth + 1 < c.length && c[aDepth + 1] > 0;
}
