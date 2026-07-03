"use client";

import { useState, useEffect } from "react";
import { BookOpen } from "lucide-react";
import { getGuidesForMyRole } from "@/app/actions/guides";
import GuideContent from "@/components/GuideContent";

type Guide = {
  id: string;
  category: string;
  title: string;
  content: string;
  order_index: number;
};

export default function GuideViewer() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGuidesForMyRole().then(data => {
      setGuides(data as Guide[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]" />
      </div>
    );
  }

  if (guides.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-sm font-bold text-slate-500">Belum ada panduan yang tersedia.</p>
        <p className="text-xs text-slate-400 mt-1">Panduan akan muncul di sini setelah ditambahkan oleh HRD.</p>
      </div>
    );
  }

  const grouped = guides.reduce((acc, g) => {
    const cat = g.category || "Umum";
    (acc[cat] = acc[cat] || []).push(g);
    return acc;
  }, {} as Record<string, Guide[]>);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">{category}</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map(g => (
              <div key={g.id} className="p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-2">{g.title}</h4>
                <GuideContent content={g.content} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
