"use client";

import { motion } from "framer-motion";
import { Users, Building2, Clock, CheckCircle2, MapPin, AlertTriangle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import AnimatedCounter from "@/components/AnimatedCounter";
import RankedBar from "@/components/charts/RankedBar";
import RadialGauge from "@/components/charts/RadialGauge";
import DirectorActions from "./DirectorActions";

interface RequestRow {
  id: string; position: string; department: string; quantity: number;
  urgency: string; reason: string; requested_by: string; created_at: string; status: string;
}

interface DirectorDashboardClientProps {
  currentDateStr: string;
  stats: { label: string; value: number; icon: "users" | "building" | "clock" | "check"; color: string }[];
  pendingList: RequestRow[];
  approvedList: RequestRow[];
  deptDistribution: { label: string; value: number }[];
  approvalRate: number;
}

const ICONS = { users: Users, building: Building2, clock: Clock, check: CheckCircle2 };

const URGENCY_STYLE: Record<string, string> = {
  Tinggi: "bg-red-50 text-red-700 border-red-200",
  Sedang: "bg-amber-50 text-amber-700 border-amber-200",
  Rendah: "bg-blue-50 text-blue-700 border-blue-200",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function DirectorDashboardClient({
  currentDateStr, stats, pendingList, approvedList, deptDistribution, approvalRate,
}: DirectorDashboardClientProps) {
  return (
    <motion.div
      className="p-6 lg:p-8 space-y-8 max-w-screen-2xl mx-auto"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Director</h1>
        <p className="text-sm text-slate-500 mt-1">Overview seluruh aktivitas perusahaan &mdash; {currentDateStr}</p>
      </motion.div>

      <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = ICONS[stat.icon];
          return (
            <motion.div
              key={stat.label}
              variants={item}
              whileHover={{ y: -3, boxShadow: "0 12px 24px -8px rgba(15,23,42,0.12)" }}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${stat.color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{stat.label}</p>
                  <p className="text-xl font-extrabold text-slate-800">
                    <AnimatedCounter value={stat.value} />
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-extrabold text-slate-800 text-sm mb-1">Permintaan SDM per Departemen</h3>
          <p className="text-xs text-slate-400 mb-4">Distribusi request yang sedang berjalan atau menunggu approval.</p>
          {deptDistribution.length === 0 ? (
            <EmptyState icon={Building2} title="Belum ada data request per departemen." />
          ) : (
            <RankedBar data={deptDistribution} valueSuffix=" request" />
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 self-start">Tingkat Persetujuan</h3>
          <RadialGauge value={approvalRate} label="Bulan Ini" sublabel="disetujui vs menunggu" />
        </div>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              pendingList.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                  className="p-4 hover:bg-slate-50/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-slate-400">{req.id.slice(0, 12)}</span>
                        <span className="text-sm font-bold text-slate-800">{req.position}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${URGENCY_STYLE[req.urgency] || URGENCY_STYLE.Rendah}`}>
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
                </motion.div>
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
              approvedList.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                  className="p-4 hover:bg-slate-50/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-400">{req.id.slice(0, 12)}</span>
                      <span className="text-sm font-bold text-slate-800">{req.position}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${URGENCY_STYLE[req.urgency] || URGENCY_STYLE.Rendah}`}>
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
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
