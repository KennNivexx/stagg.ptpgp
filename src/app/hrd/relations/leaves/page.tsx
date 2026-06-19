"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Calendar, CheckCircle2 } from "lucide-react";
import { updateLeaveStatus } from "@/app/actions/leaves";

export default function LeavesPage() {
  const [pendingLeaves, setPendingLeaves] = useState<Record<string, unknown>[] | null>(null);
  const [approvedLeaves, setApprovedLeaves] = useState<Record<string, unknown>[] | null>(null);

  const fetchLeaves = () => {
    Promise.all([
      supabase.from("leave_requests").select("*, employees!inner(full_name, department)").eq("status", "Pending").order("created_at", { ascending: false }).limit(50),
      supabase.from("leave_requests").select("*, employees!inner(full_name, department)").eq("status", "Approved").order("start_date", { ascending: false }).limit(20),
    ]).then(([{ data: pending }, { data: approved }]) => {
      setPendingLeaves(pending);
      setApprovedLeaves(approved);
    });
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleApprove = async (leaveId: string) => {
    await updateLeaveStatus(leaveId, "Approved");
    fetchLeaves();
  };

  const handleReject = async (leaveId: string) => {
    await updateLeaveStatus(leaveId, "Rejected");
    fetchLeaves();
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Manajemen Cuti</h1>
        <p className="text-sm text-gray-500">Kelola pengajuan cuti dan riwayat cuti karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Calendar size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Menunggu</p>
              <p className="text-xl font-extrabold text-slate-800">{pendingLeaves?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Disetujui</p>
              <p className="text-xl font-extrabold text-slate-800">{approvedLeaves?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Calendar size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pengajuan</p>
              <p className="text-xl font-extrabold text-slate-800">{(pendingLeaves?.length || 0) + (approvedLeaves?.length || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
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

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Cuti Disetujui</h3>
            <p className="text-xs text-slate-400 mt-0.5">Riwayat cuti terbaru</p>
          </div>
          {!approvedLeaves || approvedLeaves.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada cuti disetujui.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {approvedLeaves.map((leave: Record<string, unknown>) => {
                const emp = leave.employees as Record<string, string> | undefined;
                return (
                  <div key={leave.id as string} className="px-6 py-4 hover:bg-slate-50/30 transition-colors">
                    <p className="text-sm font-bold text-slate-800">{emp?.full_name || "Unknown"}</p>
                    <p className="text-xs text-slate-500 mt-1">{leave.type as string}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {leave.start_date as string} s/d {leave.end_date as string}
                    </p>
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
