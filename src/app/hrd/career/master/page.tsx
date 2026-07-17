"use client";

import { useState } from "react";
import { TrendingUp, Settings, BarChart3, Award, FileText, Plus, Database } from "lucide-react";

const TABS = [
  { id: "framework", label: "Career Framework", icon: Database },
  { id: "streams", label: "Career Streams", icon: TrendingUp },
  { id: "levels", label: "Career Levels", icon: BarChart3 },
  { id: "policies", label: "Policies", icon: FileText },
  { id: "scoring", label: "Score Formula", icon: Award },
];

export default function CareerMasterDataPage() {
  const [activeTab, setActiveTab] = useState("framework");
  const ActiveIcon = TABS.find((t) => t.id === activeTab)?.icon;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1A2530] mb-2 flex items-center gap-3">
          <Settings className="text-fuchsia-600" />
          Master Data Karir & Suksesi
        </h1>
        <p className="text-sm text-gray-500">
          Konfigurasi aturan dasar, jalur, jenjang, dan kebijakan yang menjadi pondasi (Single Source of Truth) untuk modul Pengembangan Karir & Manajemen Suksesi.
        </p>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-fuchsia-600 text-fuchsia-700 bg-fuchsia-50/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm min-h-[400px] flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            {ActiveIcon && <ActiveIcon size={32} />}
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Konfigurasi {TABS.find((t) => t.id === activeTab)?.label}
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Data master ini langsung terhubung ke database. Fitur antarmuka penuh untuk pengelolaan konfigurasi ini sedang dalam tahap pengembangan akhir.
          </p>
          <button className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Tambah Data Baru
          </button>
        </div>
      </div>
    </div>
  );
}
