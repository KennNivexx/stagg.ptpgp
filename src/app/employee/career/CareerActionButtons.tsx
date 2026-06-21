"use client";

import { useState } from "react";
import { submitInternalApplication, requestCareerConsultation } from "@/app/actions/career";

export function ApplyButton({ jobTitle, jobDept }: { jobTitle: string; jobDept: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleApply = async () => {
    setLoading(true);
    const result = await submitInternalApplication(jobTitle, jobDept);
    setLoading(false);
    if ((result as { error?: string }).error) {
      setMsg({ text: (result as { error: string }).error, ok: false });
    } else {
      setMsg({ text: "Lamaran berhasil dikirim ke HRD!", ok: true });
    }
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div>
      {msg && (
        <p className={`text-[9px] font-semibold mb-1 ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>
      )}
      <button
        onClick={handleApply}
        disabled={loading || msg?.ok === true}
        className="px-3 py-1 text-[9px] font-bold bg-[#CC0000] text-white rounded-lg hover:bg-[#aa0000] transition-colors disabled:opacity-50"
      >
        {loading ? "Mengirim..." : msg?.ok ? "Terkirim ✓" : "Lamar Posisi"}
      </button>
    </div>
  );
}

export function ConsultationButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleRequest = async () => {
    setLoading(true);
    const result = await requestCareerConsultation();
    setLoading(false);
    if ((result as { error?: string }).error) {
      setMsg({ text: (result as { error: string }).error, ok: false });
    } else {
      setMsg({ text: "Permintaan konsultasi dikirim ke HRD!", ok: true });
    }
    setTimeout(() => setMsg(null), 5000);
  };

  return (
    <div>
      {msg && (
        <p className={`text-[10px] font-semibold mb-2 ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
      )}
      <button
        onClick={handleRequest}
        disabled={loading || msg?.ok === true}
        className="w-full px-4 py-2 bg-white text-slate-800 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        {loading ? "Mengirim..." : msg?.ok ? "Permintaan Terkirim ✓" : "Jadwalkan Konsultasi"}
      </button>
    </div>
  );
}
