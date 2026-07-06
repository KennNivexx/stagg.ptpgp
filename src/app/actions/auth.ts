"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyPassword } from "@/lib/auth";
import { signSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { verifyOneTimeToken } from "@/lib/otp-token";

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
};



async function setLoginCookies(user: { id: string; role: string; name: string; email: string }) {
  const token = await signSession(user);
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, COOKIE_OPTS);
  cookieStore.set("user_role", user.role, COOKIE_OPTS);
  cookieStore.set("user_name", user.name, COOKIE_OPTS);
  cookieStore.set("user_email", user.email, COOKIE_OPTS);
  cookieStore.set("user_id", user.id, COOKIE_OPTS);
}

function getRedirectPath(role: string): string {
  switch (role) {
    case "superadmin": return "/superadmin";
    case "hrd": return "/hrd";
    case "director": return "/director";
    case "department_manager": return "/department";
    case "applicant": return "/applicant";
    default: return "/employee";
  }
}

async function tryEmployeesAuth(email: string, password: string) {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, email, address")
    .eq("email", email)
    .limit(1);

  if (!employees || employees.length === 0) return null;

  const emp = employees[0];
  if (!emp.address) return null;

  try {
    const parsed = JSON.parse(emp.address as string);
    if (parsed.__auth__) {
      const auth = parsed.__auth__;
      if (auth.password_hash && verifyPassword(password, auth.password_hash)) {
        return {
          id: emp.id,
          role: auth.role || "employee",
          name: emp.full_name as string,
          email: emp.email as string,
        };
      }
    }
  } catch {
    // address is not JSON, ignore
  }

  return null;
}

async function tryUsersTableAuth(email: string, password: string) {
  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("id, email, password_hash, role, full_name, is_temporary, expires_at")
    .eq("email", email)
    .limit(1);

  if (error || !users || users.length === 0) return null;

  const u = users[0];

  // Reject expired temporary accounts (rejected applicants past 24h grace)
  if (u.is_temporary && u.expires_at) {
    const expiresAt = new Date(u.expires_at as string);
    if (expiresAt < new Date()) {
      await supabaseAdmin
        .from("users")
        .delete()
        .eq("id", u.id);
      return null;
    }
  }

  if (u.password_hash && verifyPassword(password, u.password_hash)) {
    return {
      id: u.id,
      role: u.role,
      name: u.full_name,
      email: u.email,
    };
  }

  return null;
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const normalizedEmail = email.toLowerCase().trim();

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const rlKey = `login:${ip}:${normalizedEmail}`;
  const rlResult = await rateLimit(rlKey, 10, 15 * 60 * 1000);
  if (rlResult.limited) {
    return { error: "Terlalu banyak percobaan login. Silakan coba lagi dalam beberapa menit." };
  }

  // 1. Try database authentication first
  const dbUser = (await tryUsersTableAuth(normalizedEmail, password))
    || (await tryEmployeesAuth(normalizedEmail, password));

  if (dbUser) {
    await setLoginCookies(dbUser);
    redirect(getRedirectPath(dbUser.role));
  }


  return { error: "Email atau password salah." };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("user_role");
  cookieStore.delete("user_name");
  cookieStore.delete("user_email");
  cookieStore.delete("user_id");
  redirect("/login");
}

export async function loginWithToken(token: string) {
  if (!token) return { error: "Token tidak valid." };

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
  const rlResult = await rateLimit(`login-token:${ip}`, 10, 15 * 60 * 1000);
  if (rlResult.limited) {
    return { error: "Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit." };
  }

  const payload = verifyOneTimeToken(token);
  if (!payload) return { error: "Token tidak valid atau sudah kedaluwarsa." };

  // Find user with this token
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, email, role, full_name, one_time_token_expires")
    .eq("one_time_token", token)
    .maybeSingle();

  if (!user) return { error: "Token tidak ditemukan. Mungkin sudah digunakan." };

  const expiresAt = new Date(user.one_time_token_expires as string);
  if (expiresAt < new Date()) {
    // Clear expired token
    await supabaseAdmin.from("users").update({ one_time_token: null, one_time_token_expires: null }).eq("id", user.id);
    return { error: "Token sudah kedaluwarsa." };
  }

  // Consume token (one-time use)
  await supabaseAdmin.from("users").update({ one_time_token: null, one_time_token_expires: null }).eq("id", user.id);

  await setLoginCookies({
    id: user.id as string,
    role: user.role as string,
    name: user.full_name as string,
    email: user.email as string,
  });

  redirect(getRedirectPath(user.role as string));
}
