import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import DirectorActions from "./DirectorActions";
import {
  Users,
  Building2,
  Clock,
  CheckCircle2,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default async function DirectorDashboard() {
  const user = await requireRole("director", "superadmin");
  const userName = user.name || "Direktur";

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
      .from("employees")
      .select("*", { count: "exact", head: true })
      .neq("status", "Inactive"),
    supabaseAdmin
      .from("departments")
      .select("*", { count: "exact", head: true }),
    supabaseAdmin
      .from("workforce_requests")
      .select("*")
      .eq("status", "Direview Direktur")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("workforce_requests")
      .select("*")
      .eq("status", "Disetujui")
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("workforce_requests")
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

  const stats = [
    { label: "Total Karyawan", value: totalEmployees || 0, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Total Departemen", value: totalDepartments || 0, icon: Building2, color: "bg-indigo-50 text-indigo-600" },
    { label: "Request Menunggu Approval", value: pendingList.length, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Request Disetujui Bulan Ini", value: approvedThisMonth || 0, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Dashboard Director
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview seluruh aktivitas perusahaan &mdash; {currentDateStr}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-500" />
              <h3 className="font-extrabold text-slate-800 text-sm">Request Menunggu Approval</h3>
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
            {pendingList.length === 0 ? (
              <div className="p-12">
                <EmptyState icon={CheckCircle2} title="Tidak ada request yang menunggu approval." />
              </div>
            ) : (
              pendingList.map((req) => (
                <div key={req.id} className="p-4 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400">{req.id.slice(0, 12)}</span>
                        <span className="text-sm font-bold text-slate-800">{req.position}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${req.urgency === "Tinggi" ? "bg-red-50 text-red-700 border-red-200" : req.urgency === "Sedang" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                          {req.urgency}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span><MapPin size={10} /> {req.department}</span>
                        <span>Jumlah: {req.quantity}</span>
                      </p>
                    </div>
                    <DirectorActions id={req.id} />
                  </div>
                  {req.reason && <p className="text-xs text-slate-400 mt-1 italic">{req.reason}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    {req.requested_by && <span>{req.requested_by}</span>}
                    <span>{new Date(req.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <h3 className="font-extrabold text-slate-800 text-sm">Request Disetujui Terbaru</h3>
            </div>
          </div>
          <div className="divide-y divide-slate-50 max-h-[60vh] overflow-y-auto">
            {approvedList.length === 0 ? (
              <div className="p-12">
                <EmptyState icon={AlertTriangle} title="Belum ada request yang disetujui." />
              </div>
            ) : (
              approvedList.map((req) => (
                <div key={req.id} className="p-4 hover:bg-slate-50/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400">{req.id.slice(0, 12)}</span>
                      <span className="text-sm font-bold text-slate-800">{req.position}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${req.urgency === "Tinggi" ? "bg-red-50 text-red-700 border-red-200" : req.urgency === "Sedang" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                        {req.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span><MapPin size={10} /> {req.department}</span>
                      <span>Jumlah: {req.quantity}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                    {req.requested_by && <span>{req.requested_by}</span>}
                    <span>{new Date(req.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
