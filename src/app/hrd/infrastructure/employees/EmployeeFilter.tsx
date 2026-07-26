"use client";

import { useRouter } from "next/navigation";
import { Filter, Search } from "lucide-react";
import { useState } from "react";

export default function EmployeeFilter({
  deptFilter,
  statusFilter,
  query,
  deptList,
  statusList,
  activeCounts,
}: {
  deptFilter: string;
  statusFilter: string;
  query?: string;
  deptList: string[];
  statusList: string[];
  activeCounts: {
    tetap: number;
    kontrak: number;
    magang: number;
  };
}) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(query || "");

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `?${qs}` : window.location.pathname);
  };

  return (
    <div className="flex flex-wrap items-center gap-4 mb-6">
      <div className="relative flex-1 min-w-[240px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleFilterChange("q", searchText); }}
          placeholder="Cari NIK, nama, kode jabatan, departemen, posisi..."
          className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-gray-400" />
        <div className="flex items-center gap-3">
          <select
            name="dept"
            defaultValue={deptFilter}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
            onChange={(e) => handleFilterChange("dept", e.target.value)}
          >
            <option value="">Semua Departemen</option>
            {deptList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={statusFilter}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none"
            onChange={(e) => handleFilterChange("status", e.target.value)}
          >
            <option value="">Semua Status</option>
            {statusList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {(deptFilter || statusFilter) && (
          <a href="?" className="text-xs text-[#CC0000] hover:underline">
            Hapus filter
          </a>
        )}
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold">
          Tetap: {activeCounts.tetap}
        </span>
        <span className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">
          Kontrak: {activeCounts.kontrak}
        </span>
        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">
          Magang: {activeCounts.magang}
        </span>
      </div>
    </div>
  );
}
