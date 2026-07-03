"use client";
import { useState } from "react";
import { Clipboard } from "lucide-react";
import EmptyState from "@/components/EmptyState";

type Evaluation = Record<string, unknown>;

interface Props {
  evaluations: Evaluation[];
}

export default function ReviewsTable({ evaluations }: Props) {
  const [detail, setDetail] = useState<Evaluation | null>(null);

  function scoreColor(score: number) {
    if (score >= 80) return "bg-emerald-50 text-emerald-700";
    if (score >= 60) return "bg-amber-50 text-amber-700";
    return "bg-red-50 text-red-700";
  }

  function gradeLabel(score: number) {
    if (score >= 90) return "A";
    if (score >= 80) return "B+";
    if (score >= 70) return "B";
    if (score >= 60) return "C";
    return "D";
  }

  if (!evaluations || evaluations.length === 0) {
    return (
      <EmptyState icon={Clipboard} title="Belum ada data review kinerja." description="Lakukan evaluasi KPI untuk melihat review di sini." />
    );
  }

  return (
    <>
      {detail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
            <h3 className="font-extrabold text-slate-800 mb-5 text-sm">Detail Review Kinerja</h3>
            {(() => {
              const emp = detail.employees as Record<string, string> | undefined;
              const score = Number(detail.score) || 0;
              return (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Karyawan</span><span className="font-bold text-xs">{emp?.full_name || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Departemen</span><span className="font-bold text-xs">{emp?.department || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Jabatan</span><span className="font-bold text-xs">{emp?.position || "-"}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Periode</span><span className="font-bold text-xs">{detail.period as string || "-"}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-xs">Skor</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${scoreColor(score)}`}>{score}</span>
                      <span className="text-xs font-extrabold text-[#CC0000]">Grade {gradeLabel(score)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500 text-xs">Status</span>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      detail.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                      detail.status === "Reviewed" ? "bg-blue-50 text-blue-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>{detail.status === "Approved" ? "Disetujui" : detail.status === "Reviewed" ? "Direview" : (detail.status as string) || "Draft"}</span>
                  </div>
                  {!!detail.notes && (
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Catatan Evaluator</p>
                      <p className="text-xs text-slate-700">{detail.notes as string}</p>
                    </div>
                  )}
                </div>
              );
            })()}
            <button onClick={() => setDetail(null)} className="mt-6 w-full px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200">Tutup</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Review Kinerja</h3>
          <p className="text-xs text-slate-400 mt-0.5">Hasil penilaian dari evaluasi KPI</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Karyawan", "Departemen", "Periode", "Skor", "Status", ""].map((h) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {evaluations.map((ev) => {
                const emp = ev.employees as Record<string, string> | undefined;
                const score = Number(ev.score) || 0;
                return (
                  <tr key={ev.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "Unknown"}</p>
                      <p className="text-[10px] text-slate-400">{emp?.position || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">{emp?.department || "-"}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">{(ev.period as string) || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${scoreColor(score)}`}>{score}</span>
                        <span className="text-[9px] font-bold text-slate-400">{gradeLabel(score)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        ev.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                        ev.status === "Reviewed" ? "bg-blue-50 text-blue-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {ev.status === "Approved" ? "Disetujui" : ev.status === "Reviewed" ? "Direview" : (ev.status as string) || "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => setDetail(ev)}
                        className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
