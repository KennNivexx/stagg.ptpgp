import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return Response.json({ user: null }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session?.id || !session?.role) {
      return Response.json({ user: null }, { status: 401 });
    }

    let photoUrl: string | null = null;
    if (session.email) {
      const [{ data: penggunaRow }, { data: karyawanRow }] = await Promise.all([
        supabaseAdmin.from("pengguna").select("photo_url").eq("email", session.email).maybeSingle(),
        supabaseAdmin.from("karyawan").select("photo_url").eq("email", session.email).maybeSingle(),
      ]);
      photoUrl = (penggunaRow as { photo_url?: string } | null)?.photo_url
        || (karyawanRow as { photo_url?: string } | null)?.photo_url
        || null;
    }

    return Response.json({
      user: {
        id: session.id,
        role: session.role,
        name: session.name || "",
        email: session.email || "",
        photo_url: photoUrl,
      },
    });
  } catch (e) {
    console.error("[session] Error:", e);
    return Response.json({ user: null }, { status: 500 });
  }
}
