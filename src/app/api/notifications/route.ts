import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function GET(request: NextRequest) {
  // Authentication: a valid signed session is required. The notification feed
  // exposes payroll/leave/KPI data, so it must never be reachable anonymously
  // or scoped by a client-controllable cookie/query param.
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return NextResponse.json({ notifications: [] }, { status: 401 });

  const session = await verifySession(sessionToken);
  if (!session?.role) return NextResponse.json({ notifications: [] }, { status: 401 });

  const sessionRole = session.role.toLowerCase();
  const requestedRole = request.nextUrl.searchParams.get("role") || "hrd";

  // The HRD feed (applicants, all leaves, payroll drafts) is only for hrd/superadmin.
  // Anyone else falls back to their own personal (employee) feed.
  const role =
    requestedRole === "hrd"
      ? sessionRole === "hrd" || sessionRole === "superadmin"
        ? "hrd"
        : "employee"
      : "employee";
  const notifications: {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    link: string;
    priority: string;
  }[] = [];

  try {
    if (role === "hrd") {
      const [{ data: applicants }, { data: pendingLeaves }, { data: expiringContracts }, { data: newEmployees }, { data: pendingPayroll }] = await Promise.all([
        supabaseAdmin.from("applications").select("id, full_name, job_id, applied_at").eq("status", "Menunggu Review").order("applied_at", { ascending: false }).limit(5),
        supabaseAdmin.from("leave_requests").select("id, employees!inner(full_name), type, start_date, end_date").eq("status", "Pending").order("created_at", { ascending: false }).limit(5),
        supabaseAdmin.from("employees").select("id, full_name, status").order("created_at", { ascending: false }).limit(50),
        supabaseAdmin.from("employees").select("id, full_name, join_date").order("created_at", { ascending: false }).limit(5),
        supabaseAdmin.from("payroll").select("id, month, year").eq("status", "Draft").limit(5),
      ]);

      if (applicants?.length) {
        applicants.forEach((a: Record<string, unknown>) => {
          notifications.push({
            id: `app-${a.id}`,
            type: "applicant",
            title: "Pelamar Baru",
            message: `${a.full_name} melamar posisi — menunggu review.`,
            time: new Date(a.applied_at as string).toLocaleDateString("id-ID"),
            link: "/hrd/recruitment/applicants",
            priority: "medium",
          });
        });
      }

      if (pendingLeaves?.length) {
        pendingLeaves.forEach((l: Record<string, unknown>) => {
          const emp = l.employees as Record<string, string> | undefined;
          notifications.push({
            id: `leave-${l.id}`,
            type: "leave",
            title: "Pengajuan Cuti",
            message: `${emp?.full_name || "Karyawan"} mengajukan ${l.type} (${l.start_date} - ${l.end_date}).`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/hrd/leaves",
            priority: "high",
          });
        });
      }

      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      if (expiringContracts?.length) {
        const expiring = expiringContracts.filter((e: Record<string, unknown>) => e.status === "Kontrak");
        if (expiring.length > 0) {
          notifications.push({
            id: "contract-warning",
            type: "contract",
            title: "Kontrak Akan Berakhir",
            message: `${expiring.length} karyawan kontrak perlu diperpanjang dalam waktu dekat.`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/hrd/infrastructure/contracts",
            priority: "high",
          });
        }
      }

      if (newEmployees?.length) {
        notifications.push({
          id: "new-emp",
          type: "new_employee",
          title: "Karyawan Baru",
          message: `${newEmployees.length} karyawan baru bergabung baru-baru ini.`,
          time: new Date().toLocaleDateString("id-ID"),
          link: "/hrd/employees",
          priority: "low",
        });
      }

      if (pendingPayroll?.length) {
        notifications.push({
          id: "payroll-pending",
          type: "payroll",
          title: "Payroll Pending",
          message: `${pendingPayroll.length} slip gaji masih berstatus draft — perlu diproses.`,
          time: new Date().toLocaleDateString("id-ID"),
          link: "/hrd/rewards/payroll",
          priority: "high",
        });
      }
    }

    if (role === "employee") {
      const userEmail = session.email || "";

      const { data: employee } = await supabaseAdmin.from("employees").select("id").eq("email", userEmail).limit(1).single();
      const empId = employee?.id;

      if (empId) {
        const [{ data: myLeaves }, { data: myPayroll }, { data: myKPI }] = await Promise.all([
          supabaseAdmin.from("leave_requests").select("id, type, status, start_date").eq("employee_id", empId).order("created_at", { ascending: false }).limit(5),
          supabaseAdmin.from("payroll").select("id, month, year, status, net_salary").eq("employee_id", empId).order("year", { ascending: false }).order("month", { ascending: false }).limit(3),
          supabaseAdmin.from("kpi_evaluations").select("id, period, score, status").eq("employee_id", empId).order("created_at", { ascending: false }).limit(3),
        ]);

        if (myLeaves?.length) {
          const approved = myLeaves.filter((l: Record<string, unknown>) => l.status === "Disetujui");
          const rejected = myLeaves.filter((l: Record<string, unknown>) => l.status === "Ditolak");
          const pending = myLeaves.filter((l: Record<string, unknown>) => l.status === "Pending");

          if (approved.length > 0) {
            notifications.push({
              id: "leave-approved",
              type: "leave",
              title: "Cuti Disetujui",
              message: `${approved.length} pengajuan cuti telah disetujui.`,
              time: new Date().toLocaleDateString("id-ID"),
              link: "/employee/leaves",
              priority: "medium",
            });
          }
          if (rejected.length > 0) {
            notifications.push({
              id: "leave-rejected",
              type: "leave",
              title: "Cuti Ditolak",
              message: `${rejected.length} pengajuan cuti ditolak.`,
              time: new Date().toLocaleDateString("id-ID"),
              link: "/employee/leaves",
              priority: "high",
            });
          }
          if (pending.length > 0) {
            notifications.push({
              id: "leave-pending",
              type: "leave",
              title: "Cuti Menunggu",
              message: `${pending.length} pengajuan cuti masih menunggu persetujuan.`,
              time: new Date().toLocaleDateString("id-ID"),
              link: "/employee/leaves",
              priority: "low",
            });
          }
        }

        if (myPayroll?.length) {
          const latest = myPayroll[0] as Record<string, unknown>;
          notifications.push({
            id: `payroll-${latest.id}`,
            type: "payroll",
            title: "Slip Gaji Tersedia",
            message: `Slip gaji bulan ${latest.month}/${latest.year} telah tersedia. Total: Rp ${(Number(latest.net_salary) || 0).toLocaleString("id-ID")}`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/employee/payroll",
            priority: "medium",
          });
        }

        if (myKPI?.length) {
          const latest = myKPI[0] as Record<string, unknown>;
          notifications.push({
            id: `kpi-${latest.id}`,
            type: "warning",
            title: "Evaluasi KPI",
            message: `Evaluasi periode ${latest.period} — Skor: ${latest.score || "-"}. Status: ${latest.status}`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/employee/kpi",
            priority: "medium",
          });
        }
      }
    }
  } catch (e) {
    console.error("Notification fetch error:", e);
  }

  return NextResponse.json({ notifications });
}
