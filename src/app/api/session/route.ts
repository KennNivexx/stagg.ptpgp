import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    return Response.json({ user: null }, { status: 401 });
  }

  const session = await verifySession(token);
  if (!session?.id || !session?.role) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user: {
      id: session.id,
      role: session.role,
      name: session.name || "",
      email: session.email || "",
    },
  });
}
