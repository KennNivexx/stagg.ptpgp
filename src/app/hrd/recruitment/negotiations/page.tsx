"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign, CheckCircle, XCircle, RefreshCw, Users } from "lucide-react";
import { getCandidatesForNegotiation, setOfferedSalary, finalizeNegotiation } from "@/app/actions/recruitment";
import EmptyState from "@/components/EmptyState";

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  offered_salary: number | null;
  salary_expectation: number | null;
  final_salary: number | null;
  negotiation_status: string;
  negotiation_notes: string | null;
  status: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: "Belum ada offer", color: "bg-gray-100 text-gray-500" },
  offered: { label: "Offer Dikirim", color: "bg-blue-100 text-blue-700" },
  negotiating: { label: "Sedang Negosiasi", color: "bg-amber-100 text-amber-700" },
  agreed: { label: "Sepakat", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Ditolak", color: "bg-red-100 text-red-600" },
};

const fmt = (n: number | null) => n ? "Rp " + new Intl.NumberFormat("id-ID").format(n) : "-";

export default function NegotiationsPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [offerForm, setOfferForm] = useState<{ id: string; salary: string; notes: string } | null>(null);
  const [finalForm, setFinalForm] = useState<{ id: string; salary: string; agreed: boolean } | null>(null);

  const load = async () => {
    const data = await getCandidatesForNegotiation();
    setCandidates(data as Candidate[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleOffer = async () => {
    if (!offerForm) return;
    const salary = parseInt(offerForm.salary.replace(/\D/g, ""), 10);
    if (!salary) { setMsg({ type: "error", text: "Masukkan nominal gaji yang valid." }); return; }
    setSaving(offerForm.id);
    const res = await setOfferedSalary(offerForm.id, salary, offerForm.notes);
    setSaving(null);
    if (res.error) { setMsg({ type: "error", text: res.error }); return; }
    setMsg({ type: "success", text: "Offer gaji berhasil dikirim." });
    setOfferForm(null);
    await load();
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const handleFinalize = async () => {
    if (!finalForm) return;
    const salary = finalForm.agreed ? parseInt(finalForm.salary.replace(/\D/g, ""), 10) : 0;
    setSaving(finalForm.id);
    const res = await finalizeNegotiation(finalForm.id, salary, finalForm.agreed);
    setSaving(null);
    if (res.error) { setMsg({ type: "error", text: res.error }); return; }
    setMsg({ type: "success", text: finalForm.agreed ? "Negosiasi selesai — sepakat." : "Negosiasi ditolak." });
    setFinalForm(null);
    await load();
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  if (loading) return <div className="p-8 text-sm text-gray-500 text-center">Memuat...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/hrd/recruitment" className="inline-flex items-center text-xs text-gray-500 hover:text-red-600 mb-3 font-semibold">
          <ArrowLeft size={14} className="mr-1" /> Rekrutmen
        </Link>
        <h1 className="text-xl font-bold text-slate-800">Negosiasi Gaji</h1>
        <p className="text-xs text-slate-500 mt-0.5">Kelola proses negosiasi gaji kandidat yang lolos wawancara</p>
      </div>

      {msg.text && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${msg.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
          {msg.text}
        </div>
      )}

      {candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Belum ada kandidat yang memasuki tahap negosiasi gaji."
          description="Kandidat yang lulus wawancara akan muncul di sini."
        />
      ) : (
        <div className="space-y-4">
          {candidates.map(c => {
            const st = STATUS_LABELS[c.negotiation_status] || STATUS_LABELS.none;
            const isOffer = offerForm?.id === c.id;
            const isFinal = finalForm?.id === c.id;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-800">{c.full_name}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${st.color}`}>{st.label}</span>
                      </div>
                      <p className="text-xs text-slate-500">{c.position} — {c.department}</p>
                      <p className="text-[11px] text-slate-400">{c.email}</p>
                    </div>
                    <div className="text-right text-xs space-y-0.5">
                      <div className="text-slate-500">Offer HRD: <span className="font-bold text-slate-800">{fmt(c.offered_salary)}</span></div>
                      <div className="text-slate-500">Ekspektasi: <span className="font-bold text-amber-700">{fmt(c.salary_expectation)}</span></div>
                      {c.final_salary && <div className="text-slate-500">Final: <span className="font-bold text-emerald-700">{fmt(c.final_salary)}</span></div>}
                    </div>
                  </div>
                  {c.negotiation_notes && (
                    <p className="mt-2 text-[11px] text-slate-400 italic">&quot;{c.negotiation_notes}&quot;</p>
                  )}
                </div>

                {/* Actions */}
                {c.negotiation_status !== "agreed" && c.negotiation_status !== "rejected" && (
                  <div className="px-5 pb-4 flex flex-wrap gap-2">
                    {!isOffer && !isFinal && (
                      <>
                        <button onClick={() => setOfferForm({ id: c.id, salary: c.offered_salary?.toString() || "", notes: c.negotiation_notes || "" })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors">
                          <DollarSign size={12} /> {c.offered_salary ? "Update Offer" : "Buat Offer"}
                        </button>
                        {c.negotiation_status !== "none" && (
                          <>
                            <button onClick={() => setFinalForm({ id: c.id, salary: c.offered_salary?.toString() || "", agreed: true })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors">
                              <CheckCircle size={12} /> Sepakat
                            </button>
                            <button onClick={() => setFinalForm({ id: c.id, salary: "", agreed: false })}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors">
                              <XCircle size={12} /> Tolak
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {isOffer && (
                      <div className="w-full space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-1">Nominal Offer (Rp)</label>
                            <input type="text" value={offerForm!.salary}
                              onChange={e => setOfferForm({ ...offerForm!, salary: e.target.value })}
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-400"
                              placeholder="5000000" />
                          </div>
                          <div>
                            <label className="text-[10px] font-semibold text-gray-500 block mb-1">Catatan (opsional)</label>
                            <input type="text" value={offerForm!.notes}
                              onChange={e => setOfferForm({ ...offerForm!, notes: e.target.value })}
                              className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-red-400"
                              placeholder="Termasuk tunjangan transportasi..." />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleOffer} disabled={saving === c.id}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1">
                            {saving === c.id ? <RefreshCw size={12} className="animate-spin" /> : <DollarSign size={12} />} Kirim Offer
                          </button>
                          <button onClick={() => setOfferForm(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Batal</button>
                        </div>
                      </div>
                    )}

                    {isFinal && finalForm!.agreed && (
                      <div className="w-full space-y-2 pt-1">
                        <div>
                          <label className="text-[10px] font-semibold text-gray-500 block mb-1">Gaji Final Disepakati (Rp)</label>
                          <input type="text" value={finalForm!.salary}
                            onChange={e => setFinalForm({ ...finalForm!, salary: e.target.value })}
                            className="w-64 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-emerald-400"
                            placeholder={c.offered_salary?.toString() || ""} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleFinalize} disabled={saving === c.id}
                            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1">
                            {saving === c.id ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle size={12} />} Konfirmasi Sepakat
                          </button>
                          <button onClick={() => setFinalForm(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Batal</button>
                        </div>
                      </div>
                    )}

                    {isFinal && !finalForm!.agreed && (
                      <div className="flex gap-2 pt-1">
                        <button onClick={handleFinalize} disabled={saving === c.id}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1">
                          {saving === c.id ? <RefreshCw size={12} className="animate-spin" /> : <XCircle size={12} />} Konfirmasi Tolak
                        </button>
                        <button onClick={() => setFinalForm(null)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Batal</button>
                      </div>
                    )}
                  </div>
                )}

                {(c.negotiation_status === "agreed" || c.negotiation_status === "rejected") && (
                  <div className={`px-5 pb-4 text-xs font-semibold ${c.negotiation_status === "agreed" ? "text-emerald-600" : "text-red-500"}`}>
                    {c.negotiation_status === "agreed" ? `✓ Sepakat — Gaji final: ${fmt(c.final_salary)}` : "✗ Negosiasi ditolak"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
