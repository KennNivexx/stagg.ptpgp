"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, CheckCircle2, AlertCircle, UserCheck, UserX } from "lucide-react";
import { updateLeaveStatus } from "@/app/actions/hrd";

export default function HRDAttendance() {
  const [todayAttendance, setTodayAttendance] = useState<Record<string, unknown>[] | null>(null);
  const [pendingLeaves, setPendingLeaves] = useState<Record<string, unknown>[] | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    Promise.all([
      supabase.from("attendance").select("*, employees!inner(full_name, department)").eq("date", today).order("check_in", { ascending: true }),
      supabase.from("leaves").select("*, employees!inner(full_name, department)").eq("status", "Pending").order("created_at", { ascending: false }).limit(10),
      supabase.from("employees").select("*", { count: "exact", head: true }),
    ]).then(([{ data: a }, { data: l }, { count: c }]) => {
      setTodayAttendance(a);
      setPendingLeaves(l);
      setTotalEmployees(c || 0);
    });
  }, [today]);

  const refreshData = () => {
    Promise.all([
      supabase.from("attendance").select("*, employees!inner(full_name, department)").eq("date", today).order("check_in", { ascending: true }),
      supabase.from("leaves").select("*, employees!inner(full_name, department)").eq("status", "Pending").order("created_at", { ascending: false }).limit(10),
      supabase.from("employees").select("*", { count: "exact", head: true }),
    ]).then(([{ data: a }, { data: l }, { count: c }]) => {
      setTodayAttendance(a);
      setPendingLeaves(l);
      setTotalEmployees(c || 0);
    });
  };

  const handleApprove = async (leaveId: string) => {
    await updateLeaveStatus(leaveId, "Approved");
    refreshData();
  };

  const handleReject = async (leaveId: string) => {
    await updateLeaveStatus(leaveId, "Rejected");
    refreshData();
  };

  const presentCount = todayAttendance?.filter((a: Record<string, unknown>) => a.status === "Present").length || 0;
  const lateCount = todayAttendance?.filter((a: Record<string, unknown>) => a.status !== "Present").length || 0;
  const absentCount = (totalEmployees || 0) - presentCount - lateCount;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Absensi & Cuti</h1>
        <p className="text-sm text-gray-500">Monitor kehadiran harian dan kelola pengajuan cuti karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><UserCheck size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Hadir</p>
              <p className="text-xl font-extrabold text-slate-800">{presentCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Terlambat</p>
              <p className="text-xl font-extrabold text-slate-800">{lateCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><UserX size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Tidak Hadir</p>
              <p className="text-xl font-extrabold text-slate-800">{Math.max(0, absentCount)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Calendar size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Cuti Pending</p>
              <p className="text-xl font-extrabold text-slate-800">{pendingLeaves?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Kehadiran Hari Ini</h3>
            <p className="text-xs text-slate-400 mt-0.5">{new Date(today).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>

          {!todayAttendance || todayAttendance.length === 0 ? (
            <div className="p-12 text-center">
              <Clock size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada data kehadiran untuk hari ini.</p>
              <p className="text-xs text-slate-400 mt-1">Data akan muncul setelah karyawan melakukan check-in.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {todayAttendance.map((att: Record<string, unknown>) => {
                const emp = att.employees as Record<string, string> | undefined;
                const isOntime = att.check_in && (att.check_in as string) <= "08:00:00";
                return (
                  <div key={att.id as string} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isOntime ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                        {isOntime ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{emp?.full_name || "Unknown"}</p>
                        <p className="text-[11px] text-slate-400">{emp?.department || "-"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700">{att.check_in as string || "-"}</p>
                      <p className="text-[10px] text-slate-400">{isOntime ? "Tepat Waktu" : "Terlambat"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Pengajuan Cuti</h3>
            <p className="text-xs text-slate-400 mt-0.5">Menunggu persetujuan</p>
          </div>

          {!pendingLeaves || pendingLeaves.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Tidak ada pengajuan cuti.</p>
              <p className="text-xs text-slate-400 mt-1">Semua cuti sudah diproses.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingLeaves.map((leave: Record<string, unknown>) => {
                const emp = leave.employees as Record<string, string> | undefined;
                return (
                  <div key={leave.id as string} className="px-6 py-4 hover:bg-slate-50/30 transition-colors">
                    <p className="text-sm font-bold text-slate-800">{emp?.full_name || "Unknown"}</p>
                    <p className="text-xs text-slate-500 mt-1">{leave.type as string} - {leave.reason as string}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {leave.start_date as string} s/d {leave.end_date as string}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApprove(leave.id as string)}
                        className="px-3 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => handleReject(leave.id as string)}
                        className="px-3 py-1 text-[10px] font-bold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}