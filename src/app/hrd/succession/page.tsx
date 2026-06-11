import { Users, UserCheck, Shield, AlertTriangle, Crown } from "lucide-react";

export default async function HRDSuccession() {
  const positions = [
    {
      icon: <Crown size={18} />,
      title: "C-Level & Director",
      risk: "Medium",
      readiness: 65,
      candidates: 2,
      color: "red",
    },
    {
      icon: <Shield size={18} />,
      title: "Senior Manager",
      risk: "Low",
      readiness: 80,
      candidates: 4,
      color: "amber",
    },
    {
      icon: <UserCheck size={18} />,
      title: "Department Head",
      risk: "Medium",
      readiness: 55,
      candidates: 3,
      color: "blue",
    },
    {
      icon: <Users size={18} />,
      title: "Supervisor",
      risk: "Low",
      readiness: 90,
      candidates: 6,
      color: "emerald",
    },
  ];

  const riskColors: Record<string, { bg: string; text: string; bar: string }> = {
    red: { bg: "bg-red-50", text: "text-red-600", bar: "bg-red-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-500" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", bar: "bg-blue-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", bar: "bg-emerald-500" },
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Succession Planning</h1>
        <p className="text-sm text-gray-500">Perencanaan suksesi untuk posisi-posisi kunci</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-center">
        <div className="mx-auto w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
          <Users size={36} className="text-purple-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Succession Planning Matrix</h2>
        <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
          Modul ini menyediakan matriks perencanaan suksesi untuk memastikan keberlangsungan
          kepemimpinan pada posisi-posisi kunci melalui identifikasi dan pengembangan talenta internal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Crown size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Posisi Kunci</p>
              <p className="text-xl font-extrabold text-slate-800">{positions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><UserCheck size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Calon Suksesor</p>
              <p className="text-xl font-extrabold text-slate-800">{positions.reduce((s, p) => s + p.candidates, 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Shield size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Readiness</p>
              <p className="text-xl font-extrabold text-slate-800">
                {(positions.reduce((s, p) => s + p.readiness, 0) / positions.length).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Posisi Berisiko</p>
              <p className="text-xl font-extrabold text-slate-800">{positions.filter((p) => p.risk === "Medium" || p.risk === "High").length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Succession Overview</h3>
          <p className="text-xs text-slate-400 mt-0.5">Analisis kesiapan suksesi per posisi kunci</p>
        </div>

        <div className="divide-y divide-slate-50">
          {positions.map((pos) => {
            const rc = riskColors[pos.color] || riskColors.blue;
            return (
              <div key={pos.title} className="p-6 hover:bg-slate-50/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-2.5 rounded-xl ${rc.bg} ${rc.text} shrink-0`}>
                      {pos.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-800 text-sm">{pos.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pos.risk === "Low" ? "bg-emerald-50 text-emerald-700" :
                          pos.risk === "Medium" ? "bg-amber-50 text-amber-700" :
                          "bg-red-50 text-red-700"
                        }`}>
                          Risk: {pos.risk}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-slate-400">Readiness:</span>
                        <div className="flex-1 max-w-[200px] h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${rc.bar}`}
                            style={{ width: `${pos.readiness}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700">{pos.readiness}%</span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        <span className="font-bold text-slate-600">{pos.candidates}</span> kandidat suksesor tersedia
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
