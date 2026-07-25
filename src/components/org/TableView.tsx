"use client";

import { useState, useMemo, Fragment } from "react";
import { Edit3, PlusCircle, Trash2, User, Search, ChevronUp, ChevronDown, UserCheck } from "lucide-react";
import type { OrgUnit, FlatUnit } from "@/types/org";
import { getLevelLabel, LEVEL_COLORS, DEFAULT_LEVEL_COLOR, sortByPositionRank, formatOrgCode } from "@/lib/org-hierarchy";

interface FlatUnitWithEmployees extends FlatUnit {
  employees: OrgUnit[];
}

function flattenTree(tree: OrgUnit[]): FlatUnitWithEmployees[] {
  const result: FlatUnitWithEmployees[] = [];
  function walk(units: OrgUnit[]) {
    for (const u of units) {
      const unitChildren = (u.children || []).filter(c => !c.isEmployee);
      const empChildren = (u.children || []).filter(c => c.isEmployee);
      result.push({
        id: u.id, code: u.code, name: u.name, level: u.level,
        leader_name: u.leader_name, leader_email: u.leader_email,
        employees: empChildren,
      });
      if (unitChildren.length) walk(unitChildren);
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
              <th className="text-left py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-32">
                Karyawan
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
                <td colSpan={6} className="text-center py-10 text-slate-400 text-sm">
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <Fragment key={u.id}>
                  <tr
                    className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    onClick={() => onClick({ ...u, children: [] } as OrgUnit)}
                  >
                    <td className="py-2.5 px-4">
                      <span className="text-xs font-mono text-slate-500">{formatOrgCode(u.code)}</span>
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
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center ${LEVEL_COLORS[u.level] || DEFAULT_LEVEL_COLOR}`}>
                        {getLevelLabel(u.level)}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {u.leader_name ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 w-fit" title="Kepala unit / pimpinan">
                          <User size={12} className="text-slate-500" />
                          {u.leader_name}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {u.employees.length > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                          <UserCheck size={10} />
                          {u.employees.length}
                        </span>
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
                  {u.employees.length > 0 && (
                    <tr className="border-b border-slate-50 bg-emerald-50/30">
                      <td colSpan={6} className="px-4 py-2" style={{ paddingLeft: `${Math.max(0, u.level) * 16 + 32}px` }}>
                        <div className="flex flex-wrap gap-2">
                          {sortByPositionRank(u.employees).map((emp) => (
                            <div key={emp.id} className="flex items-center gap-1.5 bg-white border border-emerald-100 rounded-lg px-2.5 py-1.5">
                              <UserCheck size={11} className="text-emerald-500 shrink-0" />
                              <span className="text-xs font-semibold text-slate-700">{emp.name}</span>
                              <code className="text-[9px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">{formatOrgCode(emp.code)}</code>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
