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

  // Check if this user has face data registered
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  let hasFaceData = false;
  if (emp) {
    const { count } = await supabaseAdmin
      .from("employee_faces")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", (emp as Record<string, unknown>).id as string);
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

  // Find employee
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("id, full_name")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (!emp) return { error: "Akun karyawan tidak ditemukan." };

  const empId = (emp as Record<string, unknown>).id as string;

  // Get all face descriptors for this employee
  const hasEncryption = !!process.env.FACE_ENCRYPTION_KEY;
  const { data: faces } = await supabaseAdmin
    .from("employee_faces")
    .select(hasEncryption ? "encrypted_descriptor, encrypted_descriptors" : "descriptor, descriptors")
    .eq("employee_id", empId);

  if (!faces || faces.length === 0) {
    return { error: "Tidak ada data wajah terdaftar. Hubungi HRD untuk reset manual." };
  }

  // Compare input descriptor against all stored descriptors
  const THRESHOLD = 0.5;
  let bestDistance = Infinity;

  for (const face of faces as Record<string, unknown>[]) {
    let storedDescriptor: number[] | null = null;
    if (hasEncryption) {
      const encDesc = face.encrypted_descriptor as string | null;
      if (encDesc) {
        storedDescriptor = decryptDescriptor(encDesc);
      } else {
        const encDescriptors = face.encrypted_descriptors as string[] | null;
        if (encDescriptors && Array.isArray(encDescriptors) && encDescriptors.length > 0) {
          storedDescriptor = decryptDescriptor(encDescriptors[0]);
        }
      }
    } else {
      const desc = face.descriptor as number[] | null;
      if (desc && Array.isArray(desc) && desc.length > 0) {
        storedDescriptor = desc;
      } else {
        const descriptors = face.descriptors as number[][] | null;
        if (descriptors && Array.isArray(descriptors) && descriptors.length > 0) {
          storedDescriptor = descriptors[0];
        }
      }
    }
    if (!storedDescriptor) continue;

    const dist = euclideanDistance(descriptor, storedDescriptor);
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
    targetName: (emp as Record<string, unknown>).full_name as string || normalizedEmail,
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
