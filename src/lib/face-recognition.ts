/**
 * Shared pure-math utilities for face recognition.
 * Safe to import from both client components (browser) and server actions (Node.js).
 * Face-api.js specific operations live in client components directly.
 */

const FACE_DESCRIPTOR_LENGTH = 128;

export interface FaceMatchResult {
  distance: number;
  matched: boolean;
  label: string;
}

export interface FaceReference {
  employeeId: string;
  employeeName: string;
  descriptor: number[];
}

/**
 * Euclidean distance between two 128-dim face descriptors.
 * Smaller = more similar. Range: 0 to ~1.2 (normalized).
 */
export function euclideanDistance(a: number[] | Float32Array, b: number[] | Float32Array): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Average multiple descriptors into one reference descriptor.
 * Used during registration when 3 photos are taken.
 */
export function averageDescriptors(descriptors: (number[] | Float32Array)[]): number[] {
  // Only average full-length descriptors — a shorter/corrupted capture would
  // otherwise index past its own bounds (desc[i] === undefined), poisoning
  // the whole averaged reference with NaN and making every future match
  // against it silently fail forever (NaN < threshold is always false).
  const valid = descriptors.filter((desc) => desc.length === FACE_DESCRIPTOR_LENGTH);
  if (valid.length === 0) return [];
  const len = FACE_DESCRIPTOR_LENGTH;
  const result = new Array(len).fill(0);
  for (const desc of valid) {
    for (let i = 0; i < len; i++) {
      result[i] += desc[i];
    }
  }
  for (let i = 0; i < len; i++) {
    result[i] /= valid.length;
  }
  return result;
}

/**
 * Compare a captured descriptor against a reference descriptor.
 * Returns match result with threshold labels in Bahasa Indonesia.
 */
export function matchFace(captured: number[] | Float32Array, reference: number[] | Float32Array): FaceMatchResult {
  const distance = euclideanDistance(captured, reference);

  if (distance < 0.35) {
    return { distance, matched: true, label: "Sangat Cocok" };
  }
  if (distance < 0.45) {
    return { distance, matched: true, label: "Cocok" };
  }
  if (distance < 0.55) {
    return { distance, matched: false, label: "Ragu" };
  }
  return { distance, matched: false, label: "Tidak Cocok" };
}

/**
 * Find the best matching face from a set of reference descriptors (1:N).
 * Returns the closest match if under threshold, or null.
 */
export function findBestFaceMatch(
  captured: number[] | Float32Array,
  references: FaceReference[],
  threshold = 0.45,
): (FaceReference & { distance: number }) | null {
  let best: (FaceReference & { distance: number }) | null = null;
  let bestDistance = Infinity;

  for (const ref of references) {
    const distance = euclideanDistance(captured, ref.descriptor);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = { ...ref, distance };
    }
  }

  if (best && bestDistance < threshold) {
    return best;
  }
  return null;
}
