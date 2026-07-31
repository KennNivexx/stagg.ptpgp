import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { Building2, MapPin, Users, Clock, Settings, Plus } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";
import { HrdPageHeader, HrdStatsCard, HrdCard, HrdActionButton } from "@/components/hrd/HrdUi";

export const dynamic = "force-dynamic";

export default async function HRDWorkplace() {
  await requireRole("hrd", "superadmin");
  const [{ data: locations }, { data: employees }, { data: shifts }] = await Promise.all([
    supabaseAdmin.from("lokasi_kerja").select("*").order("name"),
    supabaseAdmin.from("karyawan").select("department, position").neq("status", "Resigned"),
    supabaseAdmin.from("shift_kerja").select("*").order("name"),
  ]);

  const locationList = (locations || []) as Record<string, unknown>[];
  const empList      = (employees  || []) as Record<string, unknown>[];
  const shiftList    = (shifts     || []) as Record<string, unknown>[];

  const deptCounts: Record<string, number> = {};
  empList.forEach((e) => {
    const dept = (e.department as string) || "Lainnya";
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const topDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-8">
      <HrdPageHeader
        title="Desain Organisasi"
        subtitle="Pengelolaan struktur, jabatan, formasi, dan lingkungan kerja perusahaan."
      >
        <HrdActionButton href="/hrd/infrastructure/locations/new" icon={<Plus size={14} />} variant="primary">Tambah Lokasi</HrdActionButton>
      </HrdPageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HrdStatsCard label="Total Karyawan" value={empList.length} icon={<Users size={18} />} color="blue" />
        <HrdStatsCard label="Lokasi Kerja" value={locationList.length} icon={<MapPin size={18} />} color="emerald" />
        <HrdStatsCard label="Jadwal Shift" value={shiftList.length} icon={<Clock size={18} />} color="purple" />
        <HrdStatsCard label="Departemen" value={Object.keys(deptCounts).length} icon={<Building2 size={18} />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HrdCard title="Karyawan per Departemen" subtitle="Distribusi headcount saat ini" icon={<Users size={16} />} iconColor="blue">
          {topDepts.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada data karyawan." className="border-none py-8" />
          ) : (
            <div className="space-y-3">
              {topDepts.map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{dept}</span>
                  <div className="flex items-center gap-3 w-40">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((count / empList.length) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </HrdCard>

        <HrdCard title="Jadwal Shift Aktif" subtitle="Shift kerja yang terdaftar" icon={<Clock size={16} />} iconColor="purple" action={{ label: "Kelola shift", href: "/hrd/infrastructure/shifts" }}>
          {shiftList.length === 0 ? (
            <EmptyState icon={Clock} title="Belum ada shift terdaftar." action={{ label: "Tambah shift", href: "/hrd/infrastructure/shifts" }} className="border-none py-8" />
          ) : (
            <div className="divide-y divide-slate-50">
              {shiftList.slice(0, 5).map((shift) => (
                <div key={shift.id as string} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{shift.name as string}</p>
                    {((shift.start_time as string) || (shift.end_time as string)) && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{shift.start_time as string} — {shift.end_time as string}</p>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold">{shift.type as string || "Reguler"}</span>
                </div>
              ))}
            </div>
          )}
        </HrdCard>
      </div>

      {locationList.length > 0 && (
        <HrdCard title="Lokasi Kerja" subtitle="Kantor dan cabang perusahaan" icon={<MapPin size={16} />} iconColor="emerald" action={{ label: "Kelola lokasi", href: "/hrd/infrastructure/locations" }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locationList.map((loc) => (
              <div key={loc.id as string} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-100 shrink-0">
                    <MapPin size={14} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{loc.name as string}</p>
                    {(loc.address as string) && <p className="text-[10px] text-slate-500 mt-0.5">{loc.address as string}</p>}
                    {(loc.city as string) && <p className="text-[10px] text-slate-400">{loc.city as string}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </HrdCard>
      )}

      <HrdCard title="Menu Lengkap Desain Organisasi" subtitle="Akses cepat ke semua fitur modul ini" icon={<Settings size={16} />} iconColor="slate">
        <SectionQuickLinks groupLabel="Desain Organisasi" excludeHref="/hrd/workplace" />
      </HrdCard>
    </div>
  );
}
