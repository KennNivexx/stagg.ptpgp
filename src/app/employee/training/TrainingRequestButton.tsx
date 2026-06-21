"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestTrainingEnrollment } from "@/app/actions/trainings";

interface Training {
  id: string;
  title: string;
  date_start: string;
  date_end: string;
  status: string;
}

interface Props {
  employeeId: string;
  availableTrainings: Training[];
}

export default function TrainingRequestButton({ employeeId, availableTrainings }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleSubmit = async () => {
    if (!selectedId) return;
    setLoading(true);
    const result = await requestTrainingEnrollment(employeeId, selectedId);
    setLoading(false);
    if (result.error) {
      setMsg({ text: result.error, ok: false });
    } else {
      setMsg({ text: "Permohonan berhasil dikirim!", ok: true });
      setOpen(false);
      setSelectedId("");
      router.refresh();
      setTimeout(() => setMsg(null), 4000);
    }
  };

  return (
    <>
      {msg && (
        <div className={`mb-3 px-4 py-2 rounded-xl text-xs font-semibold ${msg.ok ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full px-4 py-2 bg-white text-slate-800 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-colors"
        >
          Ajukan Pelatihan
        </button>
      ) : (
        <div className="space-y-3">
          {availableTrainings.length === 0 ? (
            <p className="text-[10px] text-slate-300">Tidak ada pelatihan tersedia saat ini.</p>
          ) : (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 text-[10px] bg-white text-slate-800 border border-slate-200 rounded-lg focus:outline-none"
            >
              <option value="">Pilih pelatihan...</option>
              {availableTrainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.date_start ? new Date(t.date_start).toLocaleDateString("id-ID") : "-"})
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !selectedId}
              className="flex-1 px-3 py-1.5 bg-[#CC0000] text-white text-[10px] font-bold rounded-lg hover:bg-[#aa0000] transition-colors disabled:opacity-50"
            >
              {loading ? "Mengirim..." : "Kirim"}
            </button>
            <button
              onClick={() => { setOpen(false); setSelectedId(""); }}
              className="px-3 py-1.5 bg-white/20 text-white text-[10px] font-bold rounded-lg hover:bg-white/30 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </>
  );
}
