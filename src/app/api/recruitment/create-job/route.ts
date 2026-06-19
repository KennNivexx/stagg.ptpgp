import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    body.id = crypto.randomUUID();
    const { error } = await supabaseAdmin.from("job_postings").insert(body);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
