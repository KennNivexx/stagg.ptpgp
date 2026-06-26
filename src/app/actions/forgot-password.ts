"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword } from "@/lib/auth";
import { euclideanDistance } from "@/lib/face-recognition";
import { decryptDescriptor } from "@/lib/face-encryption";
import { sendMail, emailOTP } from "@/lib/mailer";
import { createHash, randomInt } from "crypto";
import { rateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function generateOTP(): string {
  return String(randomInt(100000, 1000000));
}

function newId(): string {
  return "otp-" + crypto.randomUUID();
}

/**
 * Resolve every employee_faces.employee_id this email could be stored under.
 * The same person can exist in BOTH `users` and `employees` tables with the
 * same email but DIFFERENT ids. Login prefers the `users` id, so face data is
 * registered under that id — but `employees` may carry a different id. We must
 * check face data across all candidate ids, otherwise verification falsely
 * reports "no face data".
 */
async function resolveFaceIdentity(email: string): Promise<{ ids: string[]; name: string }> {
  const [{ data: emp }, { data: usr }] = await Promise.all([
    supabaseAdmin.from("employees").select("id, full_name").eq("email", email).maybeSingle(),
    supabaseAdmin.from("users").select("id, full_name").eq("email", email).maybeSingle(),
  ]);
  const ids: string[] = [];
  const e = emp as Record<string, unknown> | null;
  const u = usr as Record<string, unknown> | null;
  if (u?.id) ids.push(u.id as string);
  if (e?.id) ids.push(e.id as string);
  const name = (u?.full_name as string) || (e?.full_name as string) || email;
  return { ids, name };
}

// ── Step 1: send OTP ────────────────────────────────────────────────
export async function sendPasswordResetOTP(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const rlKey = `otp:${normalizedEmail}`;
  const rlResult = await rateLimit(rlKey, 3, 10 * 60 * 1000);
  if (rlResult.limited) {
    return { error: "Terlalu banyak permintaan OTP. Silakan coba lagi dalam beberapa menit." };
  }

  const [{ data: empRow }, { data: userRow }] = await Promise.all([
    supabaseAdmin.from("employees").select("id, full_name").eq("email", normalizedEmail).maybeSingle(),
    supabaseAdmin.from("users").select("id, full_name").eq("email", normalizedEmail).maybeSingle(),
  ]);

  const displayName =
    ((empRow as Record<string, unknown>)?.full_name as string) ||
    ((userRow as Record<string, unknown>)?.full_name as string) ||
    "Pengguna";

  // Delete stale OTPs first
  await supabaseAdmin.from("password_reset_otps").delete().eq("email", normalizedEmail);

  if (!empRow && !userRow) {
    // Don't reveal whether email exists — fake success
    return { success: true };
  }

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  await supabaseAdmin.from("password_reset_otps").insert({
    id: newId(),
    email: normalizedEmail,
    code: hashOtp(otp),
    step: "otp_sent",
    expires_at: expiresAt,
  });

  try {
    await sendMail({
      to: normalizedEmail,
      subject: "Kode OTP Reset Password — PT Pratama Galuh Perkasa",
      html: emailOTP(otp, displayName),
    });
  } catch (err) {
    console.error("sendPasswordResetOTP mail error:", err);
    return { error: "Gagal mengirim email. Periksa kembali alamat email atau hubungi HRD." };
  }

  return { success: true };
}

// ── Step 2: verify OTP ──────────────────────────────────────────────
export async function verifyPasswordResetOTP(email: string, code: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const rlKey = `otp_verify:${normalizedEmail}`;
  const rlResult = await rateLimit(rlKey, 10, 10 * 60 * 1000);
  if (rlResult.limited) {
    return { error: "Terlalu banyak percobaan verifikasi. Silakan minta kode OTP baru." };
  }

  const { data: row } = await supabaseAdmin
    .from("password_reset_otps")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("code", hashOtp(code.trim()))
    .maybeSingle();

  if (!row) return { error: "Kode OTP salah atau tidak ditemukan." };

  const r = row as Record<string, unknown>;

  if (r.step === "used") return { error: "Kode ini sudah digunakan." };
  if (new Date(r.expires_at as string) < new Date()) {
    return { error: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru." };
  }

  await supabaseAdmin
    .from("password_reset_otps")
    .update({ step: "otp_verified" })
    .eq("email", normalizedEmail);

  // Check if this user has face data registered under ANY of their candidate ids
  const { ids } = await resolveFaceIdentity(normalizedEmail);

  let hasFaceData = false;
  if (ids.length > 0) {
    const { count } = await supabaseAdmin
      .from("employee_faces")
      .select("*", { count: "exact", head: true })
      .in("employee_id", ids);
    hasFaceData = (count ?? 0) > 0;
  }

  return { success: true, hasFaceData };
}

// ── Step 3: verify face ─────────────────────────────────────────────
export async function verifyFaceForReset(email: string, descriptor: number[]) {
  const normalizedEmail = email.toLowerCase().trim();

  const { limited } = await rateLimit(`face_verify:${normalizedEmail}`, 5, 10 * 60 * 1000);
  if (limited) return { error: "Terlalu banyak percobaan. Coba lagi nanti." };

  // Must have passed OTP step
  const { data: otpRow } = await supabaseAdmin
    .from("password_reset_otps")
    .select("step, expires_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!otpRow) return { error: "Sesi tidak valid. Mulai ulang dari awal." };
  const o = otpRow as Record<string, unknown>;
  if (o.step !== "otp_verified") return { error: "Verifikasi OTP diperlukan terlebih dahulu." };
  if (new Date(o.expires_at as string) < new Date()) return { error: "Sesi kedaluwarsa. Mulai ulang." };

  // Resolve all candidate ids (users + employees) and the display name
  const { ids, name: empName } = await resolveFaceIdentity(normalizedEmail);
  if (ids.length === 0) return { error: "Akun karyawan tidak ditemukan." };
  const empId = ids[0];

  // Get all face descriptors stored under ANY of the candidate ids.
  // Only select encrypted_* columns when encryption is enabled — those
  // columns do NOT exist otherwise and would break the entire query.
  const hasEncryption = !!process.env.FACE_ENCRYPTION_KEY;
  const cols: string = hasEncryption
    ? "encrypted_descriptor, encrypted_descriptors"
    : "descriptor, descriptors";
  const { data: faces } = await supabaseAdmin
    .from("employee_faces")
    .select(cols)
    .in("employee_id", ids) as { data: Record<string, unknown>[] | null };

  if (!faces || faces.length === 0) {
    return { error: "Tidak ada data wajah terdaftar. Hubungi HRD untuk reset manual." };
  }

  // Compare input descriptor against all stored descriptors.
  // 0.6 balances security (password reset) with TinyFaceDetector's real-world variance.
  const THRESHOLD = 0.6;
  let bestDistance = Infinity;

  // Gather EVERY stored descriptor (averaged + all individual captures) across rows
  const stored: number[][] = [];
  for (const face of faces) {
    if (hasEncryption) {
      const encDesc = face.encrypted_descriptor as string | null;
      if (encDesc) { const d = decryptDescriptor(encDesc); if (d?.length) stored.push(d); }
      const encList = face.encrypted_descriptors as string[] | null;
      if (Array.isArray(encList)) {
        for (const enc of encList) { const d = decryptDescriptor(enc); if (d?.length) stored.push(d); }
      }
    } else {
      const desc = face.descriptor as number[] | null;
      if (Array.isArray(desc) && desc.length > 0) stored.push(desc);
      const list = face.descriptors as number[][] | null;
      if (Array.isArray(list)) {
        for (const d of list) { if (Array.isArray(d) && d.length > 0) stored.push(d); }
      }
    }
  }

  for (const s of stored) {
    const dist = euclideanDistance(descriptor, s);
    if (dist < bestDistance) bestDistance = dist;
  }

  if (bestDistance > THRESHOLD) {
    return { error: "Wajah tidak cocok. Coba lagi dengan pencahayaan lebih baik." };
  }

  await supabaseAdmin
    .from("password_reset_otps")
    .update({ step: "face_verified" })
    .eq("email", normalizedEmail);

  auditLog({
    action: "face.verify",
    targetId: empId,
    targetName: empName || normalizedEmail,
    performedBy: { id: "forgot-password", role: "system", name: "Forgot Password Flow", email: normalizedEmail },
    detail: `Distance: ${bestDistance.toFixed(4)}`,
  });

  return { success: true, distance: bestDistance };
}

// ── Step 4: reset password ──────────────────────────────────────────
export async function resetForgotPassword(email: string, newPassword: string) {
  const normalizedEmail = email.toLowerCase().trim();

  if (!newPassword || newPassword.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  // Must have passed face step
  const { data: otpRow } = await supabaseAdmin
    .from("password_reset_otps")
    .select("step, expires_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!otpRow) return { error: "Sesi tidak valid. Mulai ulang dari awal." };
  const o = otpRow as Record<string, unknown>;
  if (o.step !== "face_verified") return { error: "Verifikasi wajah diperlukan terlebih dahulu." };
  if (new Date(o.expires_at as string) < new Date()) return { error: "Sesi kedaluwarsa. Mulai ulang." };

  const passwordHash = hashPassword(newPassword);

  // Update employees.address auth JSON
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("id, address")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (emp) {
    const e = emp as Record<string, unknown>;
    let addressObj: Record<string, unknown> = {};
    try { addressObj = JSON.parse(e.address as string || "{}"); } catch { /* */ }
    const auth = (addressObj.__auth__ as Record<string, unknown>) || {};
    auth.password_hash = passwordHash;
    addressObj.__auth__ = auth;

    await supabaseAdmin
      .from("employees")
      .update({ address: JSON.stringify(addressObj) })
      .eq("id", e.id as string);
  }

  // Update users table if exists
  await supabaseAdmin
    .from("users")
    .update({ password_hash: passwordHash })
    .eq("email", normalizedEmail);

  // Mark OTP as used
  await supabaseAdmin
    .from("password_reset_otps")
    .update({ step: "used" })
    .eq("email", normalizedEmail);

  return { success: true };
}

// ── Skip face (for accounts without face data) ─────────────────────
export async function skipFaceVerification(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  const { data: otpRow } = await supabaseAdmin
    .from("password_reset_otps")
    .select("step, expires_at")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!otpRow) return { error: "Sesi tidak valid." };
  const o = otpRow as Record<string, unknown>;
  if (o.step !== "otp_verified") return { error: "OTP belum diverifikasi." };
  if (new Date(o.expires_at as string) < new Date()) return { error: "Sesi kedaluwarsa." };

  // Only allow skip for users table entries (non-employee roles)
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (emp) {
    return { error: "Akun karyawan wajib verifikasi wajah. Hubungi HRD jika belum mendaftarkan wajah." };
  }

  await supabaseAdmin
    .from("password_reset_otps")
    .update({ step: "face_verified" })
    .eq("email", normalizedEmail);

  return { success: true };
}
