"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Edit3, PlusCircle, Trash2, User, UserCheck } from "lucide-react";
import type { OrgUnit } from "@/types/org";
import { getLevelLabel, LEVEL_COLORS, DEFAULT_LEVEL_COLOR, groupByRankTier, formatOrgCode } from "@/lib/org-hierarchy";

const RAIL_INDENT = 22; // fixed px offset added at each nesting level — cumulative indent
                         // comes from ChildRail divs nesting inside one another in the DOM,
                         // not from multiplying by depth, so this stays a constant.

function countMembers(node: OrgUnit): number {
  let count = node.children.length;
  for (const c of node.children) count += countMembers(c);
  return count;
}

interface TreeNodeProps {
  node: OrgUnit;
  onClick: (n: OrgUnit) => void;
  onEdit: (n: OrgUnit) => void;
  onAdd: (n: OrgUnit) => void;
  onDelete: (n: OrgUnit) => void;
}

// Vertical "rail" that visually connects a unit to its children (sub-units
// and the employee card) — this is what turns the previous flat, padding-only
// indentation into something that actually reads as a tree.
function ChildRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative" style={{ marginLeft: `${RAIL_INDENT}px` }}>
      <div className="absolute left-0 top-0 bottom-3 w-px bg-slate-200" />
      <div className="pl-4">{children}</div>
    </div>
  );
}

function TreeNode({ node, onClick, onEdit, onAdd, onDelete }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  // Employee leaf nodes don't count toward sub-unit display
  const unitChildren = node.children?.filter(c => !c.isEmployee) || [];
  const empChildren = node.children?.filter(c => c.isEmployee) || [];
  const hasChildren = unitChildren.length > 0;
  const members = countMembers(node);
  const tiers = groupByRankTier(empChildren);

  // ── Org unit node ───────────────────────────────────────────────────────────
  return (
    <div className="py-0.5">
      <div
        className="group flex items-center gap-2 py-2 px-3 pr-8 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-200"
        onClick={() => onClick(node)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"
          >
            {expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800 truncate">{node.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{formatOrgCode(node.code)}</p>
          </div>
          {node.leader_name && (
            <div className="flex items-center gap-1.5 text-[11px] shrink-0 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200" title="Kepala unit / pimpinan">
              <User size={12} className="text-slate-500" />
              <span className="truncate max-w-[160px] font-bold text-slate-700">{node.leader_name}</span>
            </div>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${LEVEL_COLORS[node.level] || DEFAULT_LEVEL_COLOR}`}>
            {getLevelLabel(node.level)}
          </span>
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {unitChildren.length > 0 && (
              <span className="text-[10px] text-slate-400">
                {members - empChildren.length} sub-unit
              </span>
            )}
            {empChildren.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <UserCheck size={10} />
                {empChildren.length} karyawan
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(node); }}
            className="p-1 rounded hover:bg-sky-100 text-sky-600 transition-colors"
            title="Edit"
          >
            <Edit3 size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(node); }}
            className="p-1 rounded hover:bg-emerald-100 text-emerald-600 transition-colors"
            title="Tambah Sub-unit"
          >
            <PlusCircle size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(node); }}
            className="p-1 rounded hover:bg-red-100 text-red-500 transition-colors"
            title="Hapus"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {tiers.length > 0 && expanded && (
        <ChildRail>
          <div className="my-1.5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
            {tiers.map((tier) => (
              <div key={tier.rank} className="divide-y divide-slate-50">
                {tiers.length > 1 && (
                  <p className="px-3 pt-2 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/70">
                    {tier.label}
                  </p>
                )}
                {tier.items.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-2 px-3 py-1.5">
                    <UserCheck size={11} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 truncate">{emp.name}</span>
                    {emp.position && <span className="text-[10px] text-slate-400 truncate">{emp.position}</span>}
                    <code className="text-[9px] text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded font-mono ml-auto shrink-0">
                      {emp.kode_jabatan || formatOrgCode(emp.code)}
                    </code>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </ChildRail>
      )}

      {hasChildren && expanded && (
        <ChildRail>
          {[...unitChildren].sort((a, b) => {
            const sa = a.code.split(".").map(Number);
            const sb = b.code.split(".").map(Number);
            for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
              const va = sa[i] || 0, vb = sb[i] || 0;
              if (va !== vb) return va - vb;
            }
            return 0;
          }).map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onClick={onClick}
              onEdit={onEdit}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          ))}
        </ChildRail>
      )}
    </div>
  );
}

interface TreeViewProps {
  data: OrgUnit[];
  onClick: (n: OrgUnit) => void;
  onEdit: (n: OrgUnit) => void;
  onAdd: (n: OrgUnit) => void;
  onDelete: (n: OrgUnit) => void;
}

export default function TreeView({ data, onClick, onEdit, onAdd, onDelete }: TreeViewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="p-10 text-center text-slate-400 text-sm">
        Data struktur organisasi belum tersedia.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="py-2">
        {[...data].sort((a, b) => {
          const sa = a.code.split(".").map(Number);
          const sb = b.code.split(".").map(Number);
          for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
            const va = sa[i] || 0, vb = sb[i] || 0;
            if (va !== vb) return va - vb;
          }
          return 0;
        }).map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            onClick={onClick}
            onEdit={onEdit}
            onAdd={onAdd}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
