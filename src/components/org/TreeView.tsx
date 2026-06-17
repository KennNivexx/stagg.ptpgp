"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Edit3, PlusCircle, Trash2, User } from "lucide-react";
import type { OrgUnit } from "@/types/org";

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
    case 1: return "Direktur Utama";
    case 2: return "Wakil Direktur";
    case 3: return "Kepala Divisi";
    case 4: return "Manajer Unit";
    case 5: return "Asisten Manajer";
    case 6: return "Supervisor";
    case 7: return "Staf";
    default: return "Lainnya";
  }
}

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
  const hasChildren = node.children && node.children.length > 0;
  const members = countMembers(node);

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
            <p className="text-[10px] text-slate-400 font-mono">{node.code}</p>
          </div>
          {node.leader_name && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 shrink-0">
              <User size={12} className="text-slate-400" />
              <span className="truncate max-w-[160px]">{node.leader_name}</span>
            </div>
          )}
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${LEVEL_COLORS[node.level] || "bg-gray-100 text-gray-600"}`}>
            {getLevelLabel(node.level)}
          </span>
          {hasChildren && (
            <span className="text-[10px] text-slate-400 shrink-0 ml-auto">
              {members} sub-unit
            </span>
          )}
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

      {hasChildren && expanded && (
        <div>
          {[...node.children].sort((a, b) => {
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
