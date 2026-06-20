import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import ApplicantSidebar from "./ApplicantSidebar";

export default async function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) redirect("/login");

  const session = await verifySession(token);
  if (!session || session.role !== "applicant") redirect("/login");

  const userName = cookieStore.get("user_name")?.value || "Pelamar";
  const userEmail = cookieStore.get("user_email")?.value || "";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <ApplicantSidebar userName={userName} userEmail={userEmail} />
      <main className="flex-1 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
