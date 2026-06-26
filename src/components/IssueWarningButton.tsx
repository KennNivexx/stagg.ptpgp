"use client";

import { useState } from "react";
import { Plus, X, Send, AlertTriangle } from "lucide-react";
import { issueWarning } from "@/app/actions/employee";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  department?: string;
  position?: string;
}

export default function IssueWarningButton({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [empSearch, setEmpSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  const filtered = employees.filter((e) =>
    e.full_name?.toLowerCase().includes(empSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("employee_id", selectedEmp.id);
    formData.append("employee_name", selectedEmp.full_name);
    formData.append("employee_email", selectedEmp.email);

    const result = await issueWarning(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setSelectedEmp(null);
      setEmpSearch("");
    }, 1500);
  };

  const resetForm = () => {
    setSuccess(false);
    setError("");
    setSelectedEmp(null);
    setEmpSearch("");
    setShowResults(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-pgp-red text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-pgp-red/80 transition-colors inline-flex items-center gap-2"
      >
        <Plus size={14} /> Keluarkan SP
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-pgp-navy flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                Keluarkan Surat Peringatan
              </h2>
              <button onClick={() => !loading && setOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={24} />
                </div>
                <p className="font-bold text-emerald-700">SP berhasil dikeluarkan!</p>
                <p className="text-xs text-slate-500 mt-1">Karyawan dapat melihat SP di portal mereka.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Cari Karyawan</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ketik nama karyawan..."
                      value={empSearch}
                      onChange={(e) => { setEmpSearch(e.target.value); setShowResults(true); }}
                      onFocus={() => setShowResults(true)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none"
                    />
                    {showResults && empSearch && filtered.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-20">
                        {filtered.map((emp) => (
                          <button
                            key={emp.id}
                            type="button"
                            onClick={() => { setSelectedEmp(emp); setEmpSearch(emp.full_name); setShowResults(false); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-50 last:border-0"
                          >
                            <span className="font-semibold text-slate-800">{emp.full_name}</span>
                            <span className="text-xs text-slate-400 ml-2">{emp.department || "-"}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedEmp && (
                    <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs">
                      <span className="font-bold text-slate-700">{selectedEmp.full_name}</span>
                      <span className="text-slate-400 ml-2">{selectedEmp.department} · {selectedEmp.position}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="sp-level">Level SP</label>
                  <select id="sp-level" name="sp_level" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none bg-white">
                    <option value="">Pilih level...</option>
                    <option value="SP1">SP1 - Peringatan Pertama</option>
                    <option value="SP2">SP2 - Peringatan Kedua</option>
                    <option value="SP3">SP3 - Peringatan Ketiga (Final)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="sp-reason">Alasan Pelanggaran</label>
                  <textarea id="sp-reason" name="reason" rows={3} required placeholder="Jelaskan pelanggaran yang dilakukan..." className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none resize-none" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5" htmlFor="sp-until">Berlaku Hingga (opsional)</label>
                  <input id="sp-until" type="date" name="valid_until" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-pgp-red focus:ring-1 focus:ring-pgp-red outline-none" />
                </div>

                {error && (
                  <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}

                <button type="submit" disabled={loading || !selectedEmp} className="w-full bg-pgp-red hover:bg-pgp-red/80 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? "Mengirim..." : "Keluarkan Surat Peringatan"}
                  <Send size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
