"use client";

import { useMemo } from "react";
import { MapPin, Building2, Warehouse, Store, Users } from "lucide-react";
import EmptyState from "@/components/EmptyState";

type Location = { id: string; name: string; address: string; type: string; status: string };
type Employee = { id: string; full_name: string; department: string; position: string; location_id: string | null };

const typeIcon = (type: string) => {
  if (type === "Gudang") return Warehouse;
  if (type === "Cabang") return Store;
  return Building2;
};
const typeColor = (type: string) => {
  if (type === "Gudang") return "bg-amber-50 text-amber-700";
  if (type === "Cabang") return "bg-blue-50 text-blue-700";
  return "bg-emerald-50 text-emerald-700";
};

export default function DeptLocationsClient({ locations, employees, department }: { locations: Location[]; employees: Employee[]; department: string | null }) {
  const employeesByLocation = useMemo(() => {
    const m: Record<string, Employee[]> = {};
    for (const e of employees) {
      if (e.location_id) (m[e.location_id] ||= []).push(e);
    }
    return m;
  }, [employees]);

  const usedLocations = locations.filter((l) => (employeesByLocation[l.id] || []).length > 0);
  const unassignedEmployees = employees.filter((e) => !e.location_id);

  if (!department) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState icon={Users} title="Departemen tidak ditemukan" description="Akun Anda belum terhubung ke data karyawan departemen manapun." />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Lokasi Kerja Departemen</h1>
        <p className="text-sm text-gray-500 mt-1">{department} &mdash; tampilan baca saja, dikelola oleh HRD.</p>
      </div>

      {usedLocations.length === 0 ? (
        <EmptyState icon={MapPin} title="Belum ada karyawan yang ditugaskan ke lokasi" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {usedLocations.map((loc) => {
            const Icon = typeIcon(loc.type);
            const locEmployees = employeesByLocation[loc.id] || [];
            return (
              <div key={loc.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className={`p-3 rounded-xl w-fit ${typeColor(loc.type)} mb-4`}>
                  <Icon size={22} />
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm mb-1">{loc.name}</h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{loc.address}</p>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${typeColor(loc.type)}`}>{loc.type}</span>
                <div className="mt-4 pt-4 border-t border-slate-50 space-y-1.5">
                  {locEmployees.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50/60">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                        {e.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{e.full_name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{e.position || "-"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {unassignedEmployees.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-extrabold text-slate-800 text-sm mb-3">Belum Ditugaskan ke Lokasi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {unassignedEmployees.map((e) => (
              <div key={e.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                  {e.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-slate-800 truncate">{e.full_name}</p>
                  <p className="text-[9px] text-slate-400 truncate">{e.position || "-"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
