"use client";

import { useState, useMemo } from "react";
import { Edit3, PlusCircle, Trash2, User, Search, ChevronUp, ChevronDown } from "lucide-react";
import type { OrgUnit, FlatUnit } from "@/types/org";

const LEVEL_COLORS: Record<number, string> = {
  0: "bg-red-100 text-red-700",
  1: "bg-slate-800 text-white",
  2: "bg-red-50 text-red-600 border border-red-200",
  3: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  4: "bg-blue-50 text-blue-700 border border-blue-200",
  5: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  6: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  7: "bg-amber-50 text-amber-700 border border-amber-200",
};

function getLevelLabel(level: number): string {
  switch (level) {
    case 0: return "Komisaris";
    case 1: return "Dirut";
    case 2: return "Wadir";
    case 3: return "Kadiv";
    case 4: return "Manager";
    case 5: return "Asmen";
    case 6: return "Spv";
    case 7: return "Staff";
    default: return "-";
  }
}

function flattenTree(tree: OrgUnit[]): FlatUnit[] {
  const result: FlatUnit[] = [];
  function walk(units: OrgUnit[]) {
    for (const u of units) {
      result.push({
        id: u.id, code: u.code, name: u.name, level: u.level,
        leader_name: u.leader_name, leader_email: u.leader_email,
      });
      if (u.children) walk(u.children);
    }
  }
  walk(tree);
  return result;
}

interface TableViewProps {
  data: OrgUnit[];
  onClick: (n: OrgUnit) => void;
  onEdit: (n: OrgUnit) => void;
  onAdd: (n: OrgUnit) => void;
  onDelete: (n: OrgUnit) => void;
}

type SortField = "code" | "name" | "level" | "leader_name";
type SortDir = "asc" | "desc";

export default function TableView({ data, onClick, onEdit, onAdd, onDelete }: TableViewProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("code");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const flat = useMemo(() => flattenTree(data), [data]);

  const filtered = useMemo(() => {
    let list = flat;
    if (search.trim()) {
      const s = search.toLowerCase().trim();
      list = list.filter(u =>
        u.name.toLowerCase().includes(s) ||
        u.code.includes(s) ||
        u.leader_name.toLowerCase().includes(s)
      );
    }
    list = [...list].sort((a, b) => {
      if (sortField === "code") {
        const sa = a.code.split(".").map(Number);
        const sb = b.code.split(".").map(Number);
        for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
          const va = sa[i] || 0, vb = sb[i] || 0;
          if (va !== vb) return sortDir === "asc" ? va - vb : vb - va;
        }
        return 0;
      }
      let va: string | number, vb: string | number;
      if (sortField === "level") {
        va = a.level; vb = b.level;
      } else {
        va = (a[sortField] || "").toLowerCase();
        vb = (b[sortField] || "").toLowerCase();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [flat, search, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ChevronUp size={12} className="text-slate-300" />;
    return sortDir === "asc"
      ? <ChevronUp size={12} className="text-slate-700" />
      : <ChevronDown size={12} className="text-slate-700" />;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari unit..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th
                className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => toggleSort("code")}
              >
                <span className="inline-flex items-center gap-1">Kode {getSortIcon("code")}</span>
              </th>
              <th
                className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => toggleSort("name")}
              >
                <span className="inline-flex items-center gap-1">Nama Unit {getSortIcon("name")}</span>
              </th>
              <th
                className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => toggleSort("level")}
              >
                <span className="inline-flex items-center gap-1">Level {getSortIcon("level")}</span>
              </th>
              <th
                className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => toggleSort("leader_name")}
              >
                <span className="inline-flex items-center gap-1">Pimpinan {getSortIcon("leader_name")}</span>
              </th>
              {(
                <th className="text-center py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-24">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  onClick={() => onClick({ ...u, children: [] } as OrgUnit)}
                >
                  <td className="py-2.5 px-4">
                    <span className="text-xs font-mono text-slate-500">{u.code}</span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className="text-xs font-bold text-slate-800"
                      style={{ paddingLeft: `${Math.max(0, u.level) * 16}px` }}
                    >
                      {u.name}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center ${LEVEL_COLORS[u.level] || "bg-gray-100 text-gray-600"}`}>
                      {getLevelLabel(u.level)}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    {u.leader_name ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <User size={12} className="text-slate-400" />
                        {u.leader_name}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit({ ...u, children: [] } as OrgUnit)}
                        className="p-1.5 rounded-lg hover:bg-sky-100 text-sky-600 transition-colors"
                        title="Edit"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => onAdd({ ...u, children: [] } as OrgUnit)}
                        className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600 transition-colors"
                        title="Tambah Sub-unit"
                      >
                        <PlusCircle size={13} />
                      </button>
                      <button
                        onClick={() => onDelete({ ...u, children: [] } as OrgUnit)}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/30">
        <p className="text-[10px] text-slate-400">
          {filtered.length} dari {flat.length} unit
        </p>
      </div>
    </div>
  );
}
