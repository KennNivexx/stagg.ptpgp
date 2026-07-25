"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Edit3, PlusCircle, Trash2, User, UserCheck } from "lucide-react";
import type { OrgUnit } from "@/types/org";
import { getLevelLabel, LEVEL_COLORS, DEFAULT_LEVEL_COLOR, sortByPositionRank, formatOrgCode } from "@/lib/org-hierarchy";

function countMembers(node: OrgUnit): number {
  let count = node.children.length;
  for (const c of node.children) count += countMembers(c);
  return count;
}

interface TreeNodeProps {
  node: OrgUnit;
  depth: number;
  onClick: (n: OrgUnit) => void;
  onEdit: (n: OrgUnit) => void;
  onAdd: (n: OrgUnit) => void;
  onDelete: (n: OrgUnit) => void;
}

function TreeNode({ node, depth, onClick, onEdit, onAdd, onDelete }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  // Employee leaf nodes don't count toward sub-unit display
  const unitChildren = node.children?.filter(c => !c.isEmployee) || [];
  const empChildren = node.children?.filter(c => c.isEmployee) || [];
  const hasChildren = unitChildren.length > 0;
  const members = countMembers(node);

  // ── Employee leaf node ──────────────────────────────────────────────────────
  if (node.isEmployee) {
    return (
      <div
        className="flex items-center gap-2 py-1.5 rounded-lg transition-colors"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        <div className="w-5 shrink-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <UserCheck size={12} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 truncate">{node.name}</span>
          {node.position && (
            <span className="text-[10px] text-slate-400 truncate">{node.position}</span>
          )}
          <code className="text-[9px] text-slate-300 font-mono ml-auto shrink-0">{formatOrgCode(node.code)}</code>
        </div>
      </div>
    );
  }

  // ── Org unit node ───────────────────────────────────────────────────────────
  return (
    <div>
      <div
        className="group flex items-center gap-2 py-2 px-3 pr-8 rounded-lg transition-colors cursor-pointer hover:bg-slate-50 border border-transparent hover:border-slate-200"
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
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

      {empChildren.length > 0 && (
        <div
          className="pb-1.5"
          style={{ paddingLeft: `${depth * 24 + 12 + 20}px` }}
        >
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl divide-y divide-emerald-100/70 overflow-hidden">
            {sortByPositionRank(empChildren).map((emp) => (
              <div key={emp.id} className="flex items-center gap-2 px-3 py-1.5">
                <UserCheck size={11} className="text-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">{emp.name}</span>
                {emp.position && <span className="text-[10px] text-slate-400 truncate">{emp.position}</span>}
                <code className="text-[9px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded font-mono ml-auto shrink-0">{formatOrgCode(emp.code)}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasChildren && expanded && (
        <div>
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
              depth={depth + 1}
              onClick={onClick}
              onEdit={onEdit}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          ))}
        </div>
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
            depth={0}
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
