import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { insertVacancyWithNumber } from "@/lib/vacancy";

const ALLOWED_ROLES = ["hrd", "superadmin"];

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await verifySession(sessionToken);
  if (!session || !session.role || !ALLOWED_ROLES.includes(session.role.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Input validation
    const position = (body.position ?? "").toString().trim();
    const department = (body.department ?? "").toString().trim();
    const quantity = parseInt(body.quantity) || 0;

    if (!position) return NextResponse.json({ error: "Posisi wajib diisi." }, { status: 400 });
    if (!department) return NextResponse.json({ error: "Departemen wajib diisi." }, { status: 400 });
    if (quantity < 1 || quantity > 999) return NextResponse.json({ error: "Jumlah tidak valid." }, { status: 400 });

    // Sanitize: only allow known fields
    const payload = {
      id: crypto.randomUUID(),
      position,
      department,
      quantity,
      education: (body.education ?? "").toString().trim().slice(0, 200),
      experience: (body.experience ?? "").toString().trim().slice(0, 200),
      age_min: parseInt(body.age_min) || null,
      age_max: parseInt(body.age_max) || null,
      location: (body.location ?? "").toString().trim().slice(0, 200),
      requirements: (body.requirements ?? "").toString().trim().slice(0, 5000),
      job_desk: (body.job_desk ?? "").toString().trim().slice(0, 5000),
      title: (body.title ?? position).toString().trim().slice(0, 200),
      description: (body.description ?? "").toString().trim().slice(0, 5000),
      // Same column requests.ts's auto-vacancy-generation guards against
      // duplicates with — a manual posting here must register under the
      // same key or the guard can't see it and will create a second vacancy.
      manpower_request_id: (body.source_request_id ?? null),
      status: "Open",
      quantity_filled: 0,
    };

    const { error, data } = await insertVacancyWithNumber(payload);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, id: (data as { id?: string } | null)?.id || payload.id });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
