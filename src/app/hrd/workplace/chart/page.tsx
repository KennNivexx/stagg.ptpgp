"use client";

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { getOrgStructure } from "@/app/actions/org";
import type { OrgUnit } from "@/types/org";
import EmptyState from "@/components/EmptyState";

function ChartNode({ node }: { node: OrgUnit }) {
  const units = node.children.filter(c => !c.isEmployee);
  return (
    <div className="flex flex-col items-center">
      <div className="min-w-[160px] max-w-[200px] bg-white border-2 border-slate-200 rounded-xl px-4 py-3 shadow-sm text-center hover:border-[#CC0000]/40 transition-colors">
        <p className="text-xs font-extrabold text-slate-800 truncate">{node.name}</p>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{node.code}</p>
        {node.leader_name ? (
          <p className="text-[10px] text-emerald-600 font-semibold mt-1 truncate">{node.leader_name}</p>
        ) : (
          <p className="text-[10px] text-slate-300 mt-1">Kepala: belum ditentukan</p>
        )}
      </div>
      {units.length > 0 && (
        <>
          <div className="w-px h-5 bg-slate-300" />
          <div className="flex items-start">
            {units.map((child, i) => (
              <div key={child.id} className="flex flex-col items-center px-3 relative">
                <div className={`absolute top-0 h-px bg-slate-300 ${units.length === 1 ? "hidden" : i === 0 ? "left-1/2 right-0" : i === units.length - 1 ? "left-0 right-1/2" : "left-0 right-0"}`} />
                <div className="w-px h-5 bg-slate-300" />
                <ChartNode node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const [tree, setTree] = useState<OrgUnit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrgStructure().then(t => { setTree(t.filter(n => !n.isEmployee)); setLoading(false); });
  }, []);

  if (loading) return <div className="p-6 lg:p-8 flex items-center justify-center h-64"><p className="text-sm text-slate-500">Memuat data...</p></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Organization Chart</h1>
        <p className="text-sm text-gray-500">Visualisasi struktur unit organisasi. &ldquo;Kepala&rdquo; pada tiap kotak dihitung otomatis dari Position Management (Formasi), bukan input manual.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 overflow-x-auto">
        {tree.length === 0 ? (
          <EmptyState icon={Building2} title="Belum ada struktur organisasi." description="Buat Unit Organisasi terlebih dahulu untuk melihat chart-nya di sini." />
        ) : (
          <div className="flex justify-start gap-10 min-w-max">
            {tree.map(root => <ChartNode key={root.id} node={root} />)}
          </div>
        )}
      </div>
    </div>
  );
}
