"use client";

import { useState, useEffect } from "react";
import { Users, CalendarClock, Wrench, Clock3, Plus } from "lucide-react";
import { getWorkforceTimeStats } from "@/app/actions/workforce-time";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";
import { HrdPageHeader, HrdStatsCard, HrdCard, HrdActionButton } from "@/components/hrd/HrdUi";

export default function WorkforceTimeDashboard() {
  const [stats, setStats] = useState({ hadirHariIni: 0, pendingCuti: 0, pendingKoreksi: 0, pendingLembur: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { getWorkforceTimeStats().then(s => { setStats(s); setLoading(false); }); }, []);

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="space-y-8">
      <HrdPageHeader
        title="Workforce Time Management"
        subtitle="Kelola siapa bekerja, di mana, kapan, dan untuk proyek apa. Semua referensi lokasi & organisasi ditarik dari Desain Organisasi."
      >
        <HrdActionButton href="/hrd/attendance" icon={<Clock3 size={14} />} variant="primary">Kelola Absensi</HrdActionButton>
      </HrdPageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HrdStatsCard label="Hadir Hari Ini" value={stats.hadirHariIni} icon={<Users size={18} />} color="emerald" />
        <HrdStatsCard label="Cuti/Izin Pending" value={stats.pendingCuti} icon={<CalendarClock size={18} />} color="amber" />
        <HrdStatsCard label="Koreksi Pending" value={stats.pendingKoreksi} icon={<Wrench size={18} />} color="blue" />
        <HrdStatsCard label="Lembur Pending" value={stats.pendingLembur} icon={<Clock3 size={18} />} color="purple" />
      </div>

      <HrdCard title="Menu Lengkap Workforce Time" subtitle="Akses cepat ke semua fitur modul ini" icon={<CalendarClock size={16} />} iconColor="amber">
        <SectionQuickLinks groupLabel="Workforce Time Management" excludeHref="/hrd/workforce-time" />
      </HrdCard>
    </div>
  );
}
