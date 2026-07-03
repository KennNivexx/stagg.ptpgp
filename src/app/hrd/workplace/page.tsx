import { supabaseAdmin } from "@/lib/supabase";
import { Building2, MapPin, Users, Clock, Briefcase, Settings } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export default async function HRDWorkplace() {
  const [{ data: locations }, { data: employees }, { data: shifts }] = await Promise.all([
    supabaseAdmin.from("work_locations").select("*").order("name"),
    supabaseAdmin.from("employees").select("department, position").neq("status", "Resigned"),
    supabaseAdmin.from("work_shifts").select("*").order("name"),
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

  const subMenus = [
    { label: "Lokasi Kerja",   href: "/hrd/infrastructure/locations", icon: MapPin,    desc: `${locationList.length} lokasi terdaftar`, color: "bg-blue-50 text-blue-600" },
    { label: "Jadwal Shift",   href: "/hrd/infrastructure/shifts",    icon: Clock,     desc: `${shiftList.length} shift aktif`,         color: "bg-purple-50 text-purple-600" },
    { label: "Data Karyawan",  href: "/hrd/employees",                icon: Users,     desc: `${empList.length} karyawan aktif`,         color: "bg-emerald-50 text-emerald-600" },
    { label: "Struktur Org",   href: "/hrd/workplace/structure",      icon: Briefcase, desc: "Hierarki & unit kerja",                    color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Workplace Management</h1>
          <p className="text-sm text-gray-500">Pengelolaan lingkungan kerja, lokasi kantor, dan jadwal shift karyawan</p>
        </div>
        <Link href="/hrd/infrastructure/locations"
          className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
          <Settings size={14} /> Kelola Lokasi
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Karyawan",  value: empList.length,      icon: Users,    color: "bg-blue-50 text-blue-600" },
          { label: "Lokasi Kerja",    value: locationList.length, icon: MapPin,   color: "bg-emerald-50 text-emerald-600" },
          { label: "Jadwal Shift",    value: shiftList.length,    icon: Clock,    color: "bg-purple-50 text-purple-600" },
          { label: "Departemen",      value: Object.keys(deptCounts).length, icon: Building2, color: "bg-amber-50 text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {subMenus.map((m) => (
          <Link key={m.href} href={m.href}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">
            <div className={`p-2.5 rounded-xl ${m.color} w-fit mb-3`}><m.icon size={18} /></div>
            <p className="font-extrabold text-slate-800 text-sm group-hover:text-[#CC0000] transition-colors">{m.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Users size={16} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Karyawan per Departemen</h3>
              <p className="text-xs text-slate-400">Distribusi headcount saat ini</p>
            </div>
          </div>
          {topDepts.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada data karyawan." className="border-none" />
          ) : (
            <div className="divide-y divide-slate-50">
              {topDepts.map(([dept, count]) => (
                <div key={dept} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <span className="text-sm font-semibold text-slate-700">{dept}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min((count / empList.length) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Clock size={16} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Jadwal Shift Aktif</h3>
              <p className="text-xs text-slate-400">Shift kerja yang terdaftar</p>
            </div>
          </div>
          {shiftList.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Belum ada shift terdaftar."
              action={{ label: "Tambah shift", href: "/hrd/infrastructure/shifts" }}
              className="border-none"
            />
          ) : (
            <div className="divide-y divide-slate-50">
              {shiftList.slice(0, 5).map((shift) => (
                <div key={shift.id as string} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{shift.name as string}</p>
                    {((shift.start_time as string) || (shift.end_time as string)) && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {shift.start_time as string} — {shift.end_time as string}
                      </p>
                    )}
                  </div>
                  <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold">
                    {shift.type as string || "Reguler"}
                  </span>
                </div>
              ))}
            </div>
          )}
          {shiftList.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-50">
              <Link href="/hrd/infrastructure/shifts" className="text-xs font-bold text-[#CC0000] hover:underline">
                Kelola semua shift →
              </Link>
            </div>
          )}
        </div>
      </div>

      {locationList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><MapPin size={16} /></div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Lokasi Kerja</h3>
              <p className="text-xs text-slate-400">Kantor dan cabang perusahaan</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
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
        </div>
      )}
    </div>
  );
}
