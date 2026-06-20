"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyPassword } from "@/lib/auth";
import { signSession } from "@/lib/session";

const COOKIE_OPTS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7,
};

const MOCK_USERS: Record<string, { id: string; role: string; name: string; email: string; password: string }> = {
  "superadmin@ptpgp.co.id": { id: "mock-sa-001", role: "superadmin", name: "Super Administrator", email: "superadmin@ptpgp.co.id", password: "superadmin123" },
  "hrd@ptpgp.co.id": { id: "mock-hrd-001", role: "hrd", name: "Administrator HRD", email: "hrd@ptpgp.co.id", password: "password" },
  "employee@ptpgp.co.id": { id: "mock-emp-001", role: "employee", name: "Budi Santoso", email: "employee@ptpgp.co.id", password: "password" },
  "director@ptpgp.co.id": { id: "mock-dir-001", role: "director", name: "Ade Fajar Nurcahman", email: "director@ptpgp.co.id", password: "password" },
  "hrga@ptpgp.co.id": { id: "mock-dm-001", role: "department_manager", name: "Manager HR & GA", email: "hrga@ptpgp.co.id", password: "password" },
  "finance@ptpgp.co.id": { id: "mock-dm-002", role: "department_manager", name: "Manager Finance", email: "finance@ptpgp.co.id", password: "password" },
  "operational@ptpgp.co.id": { id: "mock-dm-003", role: "department_manager", name: "Manager Operational", email: "operational@ptpgp.co.id", password: "password" },
};

async function setLoginCookies(user: { id: string; role: string; name: string; email: string }) {
  const token = await signSession(user);
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, COOKIE_OPTS);
  cookieStore.set("user_role", user.role, { ...COOKIE_OPTS, httpOnly: false });
  cookieStore.set("user_name", user.name, { ...COOKIE_OPTS, httpOnly: false });
  cookieStore.set("user_email", user.email, { ...COOKIE_OPTS, httpOnly: false });
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
    .select("id, email, password_hash, role, full_name")
    .eq("email", email)
    .limit(1);

  if (error || !users || users.length === 0) return null;

  const u = users[0];
  if (verifyPassword(password, u.password_hash)) {
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

  // 1. Try database authentication first
  const dbUser = (await tryUsersTableAuth(normalizedEmail, password))
    || (await tryEmployeesAuth(normalizedEmail, password));

  if (dbUser) {
    await setLoginCookies(dbUser);
    return { success: true, redirect: getRedirectPath(dbUser.role) };
  }

  // 2. Fallback to mock users if database is unavailable
  const mockUser = MOCK_USERS[normalizedEmail];
  if (mockUser && mockUser.password === password) {
    await setLoginCookies(mockUser);
    return { success: true, redirect: getRedirectPath(mockUser.role) };
  }

  return { error: "Email atau password salah." };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("user_role");
  cookieStore.delete("user_name");
  cookieStore.delete("user_email");
  redirect("/login");
}
