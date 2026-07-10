import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import ApplicantSidebar from "./ApplicantSidebar";

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) redirect("/login");

  const session = await verifySession(token);
  if (!session || session.role !== "applicant") redirect("/login");

  // Verify account hasn't expired (rejected applicants past 24h grace)
  const { data: userRecord } = await supabaseAdmin
    .from("pengguna")
    .select("expires_at, is_temporary")
    .eq("email", session.email)
    .maybeSingle();

  if (userRecord && (userRecord as Record<string, unknown>).is_temporary) {
    const expiresAt = (userRecord as Record<string, unknown>).expires_at as string | null;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      await supabaseAdmin.from("pengguna").delete().eq("email", session.email).eq("role", "applicant");
      redirect("/login");
    }
  }

  const userName = cookieStore.get("user_name")?.value || "Pelamar";
  const userEmail = cookieStore.get("user_email")?.value || "";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ApplicantSidebar userName={userName} userEmail={userEmail} />
      <main className="flex-1 min-w-0 min-h-screen overflow-x-auto">
        <div className="h-14 lg:hidden" aria-hidden="true" />
        {children}
      </main>
    </div>
  );
}
