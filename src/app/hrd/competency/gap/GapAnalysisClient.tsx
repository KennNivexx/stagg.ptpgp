"use client";

import { useState, useMemo } from "react";
import {
  Users,
  AlertTriangle,
  Filter,
  Search,
  Zap,
  TrendingUp,
  CheckCircle2,
  X,
  Save,
  GraduationCap,
} from "lucide-react";
import PanduanLevel from "@/components/PanduanLevel";
import EmptyState from "@/components/EmptyState";
import { createTrainingFromGap } from "@/app/actions/trainings";
import { createIdpFromGap } from "@/app/actions/career-hrd";

type Employee = {
  id: string;
  fullName: string;
  department: string;
  position: string;
};

type Skill = {
  id: string;
  name: string;
  category: string;
};

type GapRow = {
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  skillId: string;
  skillName: string;
  skillCategory: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
};

type Props = {
  employees: Employee[];
  skills: Skill[];
  gapRows: GapRow[];
};

export default function GapAnalysisClient({
  employees,
  skills,
  gapRows,
}: Props) {
  const [selectedDept, setSelectedDept] = useState("");
  const [searchName, setSearchName] = useState("");
  const [trainingModalRow, setTrainingModalRow] = useState<GapRow | null>(null);
  const [proposedCost, setProposedCost] = useState("");
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");
  const [handledKeys, setHandledKeys] = useState<Set<string>>(new Set());
  const [idpKeys, setIdpKeys] = useState<Set<string>>(new Set());
  const [idpCreating, setIdpCreating] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const rowKey = (r: GapRow) => `${r.employeeId}-${r.skillId}`;

  const handleCreateIdp = async (r: GapRow) => {
    setIdpCreating(rowKey(r));
    const result = await createIdpFromGap(r.employeeId, r.skillId, r.gap);
    setIdpCreating(null);
    if ("error" in result) { showToast(result.error); return; }
    setIdpKeys((prev) => new Set(prev).add(rowKey(r)));
    showToast(`IDP dibuat untuk ${r.employeeName} — ${r.skillName}.`);
  };

  const submitTrainingFromGap = async () => {
    if (!trainingModalRow) return;
    const cost = parseInt(proposedCost || "0", 10) || 0;
    setCreating(true);
    const result = await createTrainingFromGap({
      skillId: trainingModalRow.skillId,
      skillName: trainingModalRow.skillName,
      department: trainingModalRow.department,
      currentLevel: trainingModalRow.currentLevel,
      requiredLevel: trainingModalRow.requiredLevel,
      proposedCost: cost,
    });
    setCreating(false);
    if ("error" in result) { showToast(result.error); return; }
    setHandledKeys((prev) => new Set(prev).add(`${trainingModalRow.department}-${trainingModalRow.skillId}`));
    showToast(`Training dibuat, ${result.enrolledCount} karyawan terdaftar. Menunggu persetujuan anggaran Direktur.`);
    setTrainingModalRow(null);
    setProposedCost("");
  };

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department))].sort(),
    [employees],
  );

  const filtered = useMemo(() => {
    return gapRows.filter((r) => {
      if (selectedDept && r.department !== selectedDept) return false;
      if (
        searchName &&
        !r.employeeName.toLowerCase().includes(searchName.toLowerCase())
      )
        return false;
      return true;
    });
  }, [gapRows, selectedDept, searchName]);

  const totalKaryawan = useMemo(
    () => new Set(filtered.map((r) => r.employeeId)).size,
    [filtered],
  );
  const totalGap = filtered.length;
  const wajibTraining = filtered.filter((r) => r.gap <= -2).length;
  const mendekati = filtered.filter((r) => r.gap === -1).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">
          Analisis Kesenjangan
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Identifikasi kesenjangan antara kompetensi saat ini dengan standar
          yang dibutuhkan. Hanya karyawan dengan gap negatif yang ditampilkan.
        </p>
      </div>

      <PanduanLevel />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">
                Total Karyawan
              </p>
              <p className="text-lg font-extrabold text-slate-800">
                {totalKaryawan}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <AlertTriangle size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">
                Total Skill Gap
              </p>
              <p className="text-lg font-extrabold text-slate-800">
                {totalGap}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Zap size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">
                Wajib Training
              </p>
              <p className="text-lg font-extrabold text-red-700">
                {wajibTraining}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp size={14} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">
                Mendekati
              </p>
              <p className="text-lg font-extrabold text-amber-700">
                {mendekati}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="bg-transparent outline-none text-slate-700 placeholder:text-slate-400 w-48"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm">
          <Filter size={14} className="text-slate-400" />
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-transparent outline-none text-slate-700"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm">
              Daftar Kesenjangan Kompetensi
            </h3>
            <p className="text-[10px] text-slate-400">
              {totalGap} gap ditemukan
            </p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Tidak ada data kesenjangan yang ditemukan."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase sticky left-0 bg-slate-50/50 z-10 min-w-[200px]">
                    Karyawan
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Departemen
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Posisi
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Skill
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">
                    Current
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">
                    Required
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">
                    Gap
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-bold text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r, i) => (
                  <tr
                    key={`${r.employeeId}-${r.skillName}-${i}`}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-slate-50/30 z-10">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                          {r.employeeName?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-800 truncate">
                            {r.employeeName}
                          </p>
                          <p className="text-[9px] text-slate-400">
                            {r.department}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full border text-[9px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
                        {r.department}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">
                      {r.position}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-700 font-medium">
                        {r.skillName}
                      </span>
                      <span className="block text-[9px] text-slate-400">
                        {r.skillCategory}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                        {r.currentLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500">
                        {r.requiredLevel}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-[11px] font-extrabold ${
                          r.gap <= -2
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {r.gap}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          r.gap <= -2
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {r.gap <= -2 ? "Wajib Training" : "Mendekati"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {handledKeys.has(`${r.department}-${r.skillId}`) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">
                            <CheckCircle2 size={10} /> Training Dibuat
                          </span>
                        ) : (
                          <button
                            onClick={() => setTrainingModalRow(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#CC0000] text-white rounded-lg text-[10px] font-bold hover:bg-[#aa0000] transition-colors"
                          >
                            <GraduationCap size={10} /> Buat Training
                          </button>
                        )}
                        {idpKeys.has(rowKey(r)) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">
                            <CheckCircle2 size={10} /> IDP Dibuat
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCreateIdp(r)}
                            disabled={idpCreating === rowKey(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-700 transition-colors disabled:opacity-60"
                          >
                            <TrendingUp size={10} /> {idpCreating === rowKey(r) ? "Membuat..." : "Buat IDP"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
            <div className="flex items-center gap-4 flex-wrap text-[10px] text-slate-500">
              <span>
                Total: <b className="text-slate-800">{totalKaryawan}</b>{" "}
                karyawan terdampak
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-200" />{" "}
                Gap &le; -2 (Wajib Training)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />{" "}
                Gap -1 (Mendekati)
              </span>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold max-w-sm">
          {toast}
        </div>
      )}

      {trainingModalRow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setTrainingModalRow(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-sm">Buat Training dari Gap</h3>
              <button onClick={() => setTrainingModalRow(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Training <b>{trainingModalRow.skillName}</b> akan dibuat untuk departemen <b>{trainingModalRow.department}</b>, dan semua karyawan dengan gap yang sama pada skill ini akan otomatis terdaftar. Training baru berjalan (dan karyawan baru diberi tahu) setelah Direktur menyetujui anggarannya.
            </p>
            <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Biaya (Rp)</label>
            <input
              type="number"
              min="0"
              value={proposedCost}
              onChange={(e) => setProposedCost(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-200 p-2.5 rounded-xl text-sm mb-4"
            />
            <button onClick={submitTrainingFromGap} disabled={creating}
              className="w-full bg-[#CC0000] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#aa0000] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60">
              <Save size={14} /> {creating ? "Membuat..." : "Ajukan ke Direktur"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
