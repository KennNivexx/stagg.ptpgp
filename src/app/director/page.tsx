import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import DirectorDashboardClient from "./DirectorDashboardClient";

export default async function DirectorDashboard() {
  await requireRole("director", "superadmin");

  const now = new Date();
  const currentDateStr = now.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [
    { count: totalEmployees },
    { count: totalDepartments },
    { data: pendingRequests },
    { data: recentApproved },
    { count: approvedThisMonth },
  ] = await Promise.all([
    supabaseAdmin
      .from("karyawan")
      .select("*", { count: "exact", head: true })
      .neq("status", "Inactive"),
    supabaseAdmin
      .from("departemen")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("permintaan_sdm")
      .select("*")
      .eq("status", "Direview Direktur")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("permintaan_sdm")
      .select("*")
      .eq("status", "Disetujui")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("permintaan_sdm")
      .select("*", { count: "exact", head: true })
      .eq("status", "Disetujui")
      .gte("created_at", thisMonth),
  ]);

  const pendingList = (pendingRequests || []) as {
    id: string; position: string; department: string; quantity: number;
    urgency: string; reason: string; requested_by: string; created_at: string; status: string;
  }[];

  const approvedList = (recentApproved || []) as {
    id: string; position: string; department: string; quantity: number;
    urgency: string; reason: string; requested_by: string; created_at: string; status: string;
  }[];

  const stats: { label: string; value: number; icon: "users" | "building" | "clock" | "check"; color: string }[] = [
    { label: "Total Karyawan", value: totalEmployees || 0, icon: "users", color: "bg-blue-50 text-blue-600" },
    { label: "Total Departemen", value: totalDepartments || 0, icon: "building", color: "bg-indigo-50 text-indigo-600" },
    { label: "Request Menunggu Approval", value: pendingList.length, icon: "clock", color: "bg-amber-50 text-amber-600" },
    { label: "Request Disetujui Bulan Ini", value: approvedThisMonth || 0, icon: "check", color: "bg-emerald-50 text-emerald-600" },
  ];

  const deptCounts = new Map<string, number>();
  for (const req of pendingList) {
    const dept = req.department || "(Tanpa Departemen)";
    deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1);
  }
  const deptDistribution = Array.from(deptCounts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const approvalDenominator = (approvedThisMonth || 0) + pendingList.length;
  const approvalRate = approvalDenominator > 0 ? Math.round(((approvedThisMonth || 0) / approvalDenominator) * 100) : 100;

  return (
    <DirectorDashboardClient
      currentDateStr={currentDateStr}
      stats={stats}
      pendingList={pendingList}
      approvedList={approvedList}
      deptDistribution={deptDistribution}
      approvalRate={approvalRate}
    />
  );
}
