import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

type Role = "superadmin" | "hrd" | "employee" | "director" | "department_manager";

class UnauthorizedError extends Error {
  constructor(message = "Akses ditolak: Autentikasi diperlukan.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

class ForbiddenError extends Error {
  constructor(message = "Akses ditolak: Anda tidak memiliki izin.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireAuth(): Promise<{
  id: string;
  role: string;
  name: string;
  email: string;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    throw new UnauthorizedError();
  }

  const session = await verifySession(token);
  if (!session || !session.id || !session.role) {
    throw new UnauthorizedError();
  }

  return {
    id: session.id,
    role: session.role,
    name: session.name || "",
    email: session.email || "",
  };
}

export async function requireRole(...allowedRoles: Role[]): Promise<{
  id: string;
  role: string;
  name: string;
  email: string;
}> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role as Role)) {
    throw new ForbiddenError(
      `Akses ditolak: Hanya ${allowedRoles.join("/")} yang diizinkan.`
    );
  }

  return session;
}
