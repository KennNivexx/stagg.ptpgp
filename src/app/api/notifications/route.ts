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

  // Each feed is gated by the actual session role — a requested role the
  // caller isn't entitled to always falls back to their own employee feed.
  let role: "hrd" | "employee" | "director" | "department" | "applicant";
  if (requestedRole === "hrd" && (sessionRole === "hrd" || sessionRole === "superadmin")) {
    role = "hrd";
  } else if (requestedRole === "director" && (sessionRole === "director" || sessionRole === "superadmin")) {
    role = "director";
  } else if (requestedRole === "department" && (sessionRole === "department_manager" || sessionRole === "superadmin")) {
    role = "department";
  } else if (requestedRole === "applicant" && sessionRole === "applicant") {
    role = "applicant";
  } else {
    role = "employee";
  }
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
      const [{ data: applicants }, { data: decidedLeaves }, { data: expiringContracts }, { data: newEmployees }, { data: pendingPayroll }] = await Promise.all([
        supabaseAdmin.from("pelamar").select("id, full_name, job_id, applied_at").eq("status", "Menunggu Review").order("applied_at", { ascending: false }).limit(5),
        supabaseAdmin.from("pengajuan_cuti").select("id, employee_name, type, start_date, end_date, status").in("status", ["Disetujui", "Ditolak"]).order("updated_at", { ascending: false }).limit(5),
        supabaseAdmin.from("karyawan").select("id, full_name, status").order("created_at", { ascending: false }).limit(50),
        supabaseAdmin.from("karyawan").select("id, full_name, join_date").order("created_at", { ascending: false }).limit(5),
        supabaseAdmin.from("penggajian").select("id, month, year").eq("status", "Draft").limit(5),
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

      if (decidedLeaves?.length) {
        // HRD no longer approves/rejects leave — Kepala Departemen decides.
        // This is a read-only "for your records" report, not an action item.
        decidedLeaves.forEach((l: Record<string, unknown>) => {
          notifications.push({
            id: `leave-${l.id}`,
            type: "leave",
            title: `Cuti ${l.status}`,
            message: `${l.employee_name || "Karyawan"} — ${l.type} (${l.start_date} - ${l.end_date}) ${l.status === "Disetujui" ? "disetujui" : "ditolak"} oleh atasan.`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/hrd/leaves",
            priority: "low",
          });
        });
      }

      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      if (expiringContracts?.length) {
        const expiring = expiringContracts.filter((e: Record<string, unknown>) => e.status === "Kontrak");
        if (expiring.length > 0) {
          notifications.push({
            // Suffixed with the live count (here and at every other
            // category-level id below) so the id itself changes whenever
            // the underlying count changes — a static id like the old
            // "contract-warning" stays in the client's read-id list
            // forever once dismissed, permanently hiding this category
            // even after new items appear (see useNotifications.ts).
            id: `contract-warning-${expiring.length}`,
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
          id: `new-emp-${newEmployees.length}`,
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
          id: `payroll-pending-${pendingPayroll.length}`,
          type: "payroll",
          title: "Payroll Pending",
          message: `${pendingPayroll.length} slip gaji masih berstatus draft — perlu diproses.`,
          time: new Date().toLocaleDateString("id-ID"),
          link: "/hrd/rewards/payroll",
          priority: "high",
        });
      }

      // Director's decision on a forwarded workforce request — HRD needs to
      // know so they can either create the job posting (Disetujui) or inform
      // the requesting department (Ditolak).
      const { data: decidedRequests } = await supabaseAdmin
        .from("permintaan_sdm")
        .select("id, department, position, status")
        .in("status", ["Disetujui", "Ditolak"])
        .order("updated_at", { ascending: false })
        .limit(10);
      const approvedReqs = (decidedRequests || []).filter((r: Record<string, unknown>) => r.status === "Disetujui");
      const rejectedReqs = (decidedRequests || []).filter((r: Record<string, unknown>) => r.status === "Ditolak");
      if (approvedReqs.length > 0) {
        notifications.push({
          id: `workforce-approved-${approvedReqs.length}`,
          type: "request",
          title: "Permintaan SDM Disetujui Direktur",
          message: `${approvedReqs.length} permintaan disetujui — buat lowongan rekrutmennya.`,
          time: new Date().toLocaleDateString("id-ID"),
          link: "/hrd/workforce/requests",
          priority: "high",
        });
      }
      if (rejectedReqs.length > 0) {
        notifications.push({
          id: `workforce-rejected-${rejectedReqs.length}`,
          type: "request",
          title: "Permintaan SDM Ditolak Direktur",
          message: `${rejectedReqs.length} permintaan ditolak — informasikan ke departemen terkait.`,
          time: new Date().toLocaleDateString("id-ID"),
          link: "/hrd/workforce/requests",
          priority: "medium",
        });
      }
    }

    if (role === "employee") {
      const userEmail = session.email || "";

      // Resignation approved → account scheduled for permanent deletion.
      // Query by email (resignation may be stored under a different id source)
      // and select * so a not-yet-migrated delete_at column can't break the feed.
      const { data: myResign } = await supabaseAdmin
        .from("pengunduran_diri")
        .select("*")
        .eq("employee_email", userEmail)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const resign = myResign as Record<string, unknown> | null;
      if (resign?.status === "Disetujui" && resign.delete_at) {
        const deleteAt = new Date(resign.delete_at as string);
        const msLeft = deleteAt.getTime() - Date.now();
        if (msLeft > 0) {
          const hoursLeft = Math.max(1, Math.ceil(msLeft / 3_600_000));
          notifications.push({
            id: `resignation-approved-${resign.id}`,
            type: "warning",
            title: "Pengunduran Diri Berhasil",
            message: `Pengunduran diri Anda telah disetujui. Akun Anda akan dihapus permanen dalam ±${hoursLeft} jam (${deleteAt.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}).`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/employee/resignation",
            priority: "high",
          });
        }
      }

      const { data: employee } = await supabaseAdmin.from("karyawan").select("id").eq("email", userEmail).limit(1).maybeSingle();
      const empId = employee?.id;

      if (empId) {
        const [{ data: myLeaves }, { data: myPayroll }, { data: myKPI }] = await Promise.all([
          supabaseAdmin.from("pengajuan_cuti").select("id, type, status, start_date").eq("employee_id", empId).order("created_at", { ascending: false }).limit(5),
          supabaseAdmin.from("penggajian").select("id, month, year, status, net_salary").eq("employee_id", empId).order("year", { ascending: false }).order("month", { ascending: false }).limit(3),
          supabaseAdmin.from("evaluasi_kpi").select("id, period, score, status").eq("employee_id", empId).order("created_at", { ascending: false }).limit(3),
        ]);

        if (myLeaves?.length) {
          const approved = myLeaves.filter((l: Record<string, unknown>) => l.status === "Disetujui");
          const rejected = myLeaves.filter((l: Record<string, unknown>) => l.status === "Ditolak");
          const pending = myLeaves.filter((l: Record<string, unknown>) => l.status === "Pending");

          if (approved.length > 0) {
            notifications.push({
              id: `leave-approved-${approved.length}`,
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
              id: `leave-rejected-${rejected.length}`,
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
              id: `leave-pending-${pending.length}`,
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
            message: `Evaluasi periode ${latest.period} — Skor: ${latest.score ?? "-"}. Status: ${latest.status}`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/employee/kpi",
            priority: "medium",
          });
        }

        // Gap-based training whose Director budget approval just came through —
        // this is the actual "wajib mengikuti training" notice to the employee.
        const { data: myEnrollments } = await supabaseAdmin
          .from("peserta_pelatihan")
          .select("id, training_id, status, pelatihan!inner(title, budget_status)")
          .eq("employee_id", empId)
          .neq("status", "Completed")
          .limit(10);
        const dueTrainings = (myEnrollments || []).filter((e: Record<string, unknown>) => {
          const t = e.pelatihan as { budget_status?: string } | { budget_status?: string }[];
          const tr = Array.isArray(t) ? t[0] : t;
          return tr?.budget_status === "Disetujui";
        });
        if (dueTrainings.length > 0) {
          notifications.push({
            id: `training-due-${dueTrainings.length}`,
            type: "training",
            title: "Training Wajib — Menutup Gap Kompetensi",
            message: `${dueTrainings.length} pelatihan wajib menunggu Anda selesaikan.`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/employee/training",
            priority: "high",
          });
        }
      }
    }

    if (role === "director") {
      const { data: pendingRequests } = await supabaseAdmin
        .from("permintaan_sdm")
        .select("id, position, department")
        .eq("status", "Pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (pendingRequests?.length) {
        notifications.push({
          id: `workforce-pending-${pendingRequests.length}`,
          type: "request",
          title: "Permintaan SDM Menunggu Persetujuan",
          message: `${pendingRequests.length} permintaan penambahan karyawan menunggu keputusan Anda.`,
          time: new Date().toLocaleDateString("id-ID"),
          link: "/director/requests",
          priority: "high",
        });
      }
    }

    if (role === "department") {
      const { data: employeeRow } = await supabaseAdmin
        .from("karyawan")
        .select("department")
        .eq("email", session.email || "")
        .maybeSingle();
      const deptName = (employeeRow as Record<string, unknown> | null)?.department as string | undefined;

      if (deptName) {
        const { data: decided } = await supabaseAdmin
          .from("permintaan_sdm")
          .select("id, position, status")
          .eq("department", deptName)
          .in("status", ["Disetujui", "Ditolak"])
          .order("created_at", { ascending: false })
          .limit(10);

        const approved = (decided || []).filter((r: Record<string, unknown>) => r.status === "Disetujui");
        const rejected = (decided || []).filter((r: Record<string, unknown>) => r.status === "Ditolak");

        if (approved.length > 0) {
          notifications.push({
            id: `dept-request-approved-${approved.length}`,
            type: "request",
            title: "Permintaan SDM Disetujui",
            message: `${approved.length} permintaan penambahan karyawan departemen Anda telah disetujui.`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/department/requests",
            priority: "medium",
          });
        }
        if (rejected.length > 0) {
          notifications.push({
            id: `dept-request-rejected-${rejected.length}`,
            type: "request",
            title: "Permintaan SDM Ditolak",
            message: `${rejected.length} permintaan penambahan karyawan departemen Anda ditolak.`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/department/requests",
            priority: "medium",
          });
        }

        const { data: pendingLeaves } = await supabaseAdmin
          .from("pengajuan_cuti")
          .select("id")
          .eq("department", deptName)
          .eq("status", "Pending")
          .limit(20);
        if (pendingLeaves?.length) {
          notifications.push({
            id: `dept-leave-pending-${pendingLeaves.length}`,
            type: "leave",
            title: "Cuti Menunggu Keputusan Anda",
            message: `${pendingLeaves.length} pengajuan cuti karyawan departemen Anda menunggu persetujuan.`,
            time: new Date().toLocaleDateString("id-ID"),
            link: "/department/leaves",
            priority: "high",
          });
        }
      }
    }

    if (role === "applicant") {
      const userEmail = session.email || "";
      const { data: apps } = await supabaseAdmin
        .from("pelamar")
        .select("id, status, interview_date, interview_time, interview_location, interview_online_link")
        .eq("email", userEmail)
        .order("created_at", { ascending: false })
        .limit(5);

      (apps || []).forEach((a: Record<string, unknown>) => {
        const status = a.status as string;
        if (!status || status === "Menunggu Review") return;

        let title = "Status Lamaran Diperbarui";
        let priority: "high" | "medium" | "low" = "medium";
        let message = `Status lamaran Anda: ${status}.`;
        if (status === "Diterima") { title = "Selamat! Lamaran Diterima"; priority = "high"; }
        else if (status === "Ditolak") { title = "Lamaran Tidak Lolos"; priority = "low"; }
        else if (status === "Interview") {
          title = "Dijadwalkan Wawancara";
          priority = "high";
          if (a.interview_date) {
            const where = (a.interview_online_link as string) || (a.interview_location as string) || "";
            message = `Interview dijadwalkan pada ${a.interview_date}${a.interview_time ? ` ${a.interview_time}` : ""}${where ? ` — ${where}` : ""}.`;
          }
        }
        else if (status === "Tes Tulis & Psikotes") { title = "Dipanggil Tes Seleksi"; priority = "high"; }

        notifications.push({
          id: `app-status-${a.id}`,
          type: "applicant",
          title,
          message,
          time: new Date().toLocaleDateString("id-ID"),
          link: "/applicant/status",
          priority,
        });
      });
    }
  } catch (e) {
    console.error("Notification fetch error:", e);
    return NextResponse.json({ error: "Gagal mengambil notifikasi.", notifications: [] }, { status: 500 });
  }

  return NextResponse.json({ notifications });
}
