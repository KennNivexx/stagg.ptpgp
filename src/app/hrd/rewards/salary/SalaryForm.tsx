"use client";
import { useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Pencil, Wallet, Settings, Trash2 } from "lucide-react";
import { saveSalaryStructure } from "@/app/actions/rewards";
import { getEmployeeSalaryComponents, saveEmployeeSalaryComponents, type JenisKomponenGaji } from "@/app/actions/payroll-components";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";

type Employee = { id: string; full_name: string; department: string; position: string };
type SalaryRecord = Record<string, unknown>;
type ComponentRow = { komponen_id: string; jumlah: string };

interface Props {
  employees: Employee[];
  salaryRecords: SalaryRecord[];
  jenisKomponen: JenisKomponenGaji[];
}

const PTKP_OPTIONS = ["TK/0", "TK/1", "TK/2", "TK/3", "K/0", "K/1", "K/2", "K/3"];

function fmt(n: number) { return n.toLocaleString("id-ID"); }

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

export default function SalaryForm({ employees, salaryRecords, jenisKomponen }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [basicSalary, setBasicSalary] = useState("0");
  const [ptkpStatus, setPtkpStatus] = useState("TK/0");
  const [componentRows, setComponentRows] = useState<ComponentRow[]>([]);

  const recordByEmployee = useCallback((employeeId: string) =>
    salaryRecords.find((r) => r.employee_id === employeeId), [salaryRecords]);

  const loadComponents = useCallback(async (employeeId: string) => {
    setLoadingComponents(true);
    const components = await getEmployeeSalaryComponents(employeeId);
    setComponentRows(components.map((c) => ({ komponen_id: c.komponen_id, jumlah: String(c.jumlah) })));
    setLoadingComponents(false);
  }, []);

  function handleEmployeeChange(employeeId: string) {
    setSelectedEmployeeId(employeeId);
    const existing = recordByEmployee(employeeId);
    setBasicSalary(String(existing?.basic_salary ?? 0));
    setPtkpStatus(String(existing?.ptkp_status ?? "TK/0"));
    setComponentRows([]);
    if (employeeId) void loadComponents(employeeId);
  }

  // Row-level "Edit" in the Struktur Gaji Karyawan table — opens the form
  // pre-loaded for that employee instead of making HRD reopen the form and
  // re-pick the employee from the dropdown every time.
  function startEditRow(employeeId: string) {
    setEditingId("new");
    handleEmployeeChange(employeeId);
    setMsg(null);
  }

  function addComponentRow(komponenId: string) {
    if (!komponenId || componentRows.some((r) => r.komponen_id === komponenId)) return;
    setComponentRows((rows) => [...rows, { komponen_id: komponenId, jumlah: "0" }]);
  }
  function updateComponentAmount(komponenId: string, jumlah: string) {
    setComponentRows((rows) => rows.map((r) => (r.komponen_id === komponenId ? { ...r, jumlah } : r)));
  }
  function removeComponentRow(komponenId: string) {
    setComponentRows((rows) => rows.filter((r) => r.komponen_id !== komponenId));
  }

  async function handleSave() {
    if (!formRef.current || !selectedEmployeeId) return;
    setLoading(true); setMsg(null);
    const basicResult = await saveSalaryStructure(new FormData(formRef.current));
    if ("error" in basicResult) { setLoading(false); setMsg({ type: "error", text: basicResult.error ?? "Terjadi kesalahan" }); return; }

    const items = componentRows.map((r) => ({ komponen_id: r.komponen_id, jumlah: parseFloat(r.jumlah) || 0 }));
    const compResult = await saveEmployeeSalaryComponents(selectedEmployeeId, items);
    setLoading(false);
    if ("error" in compResult) { setMsg({ type: "error", text: compResult.error }); return; }

    setMsg({ type: "success", text: "Struktur gaji berhasil disimpan!" });
    formRef.current.reset();
    setSelectedEmployeeId("");
    setComponentRows([]);
    setEditingId(null);
    router.refresh();
  }

  const availableToAdd = jenisKomponen.filter((k) => !componentRows.some((r) => r.komponen_id === k.id));
  const komponenById = new Map(jenisKomponen.map((k) => [k.id, k]));

  return (
    <div className="space-y-6">
      {!editingId ? (
        <div className="flex items-center justify-end gap-2">
          <Link href="/hrd/rewards/komponen-gaji"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold rounded-xl transition-colors">
            <Settings size={14} /> Kelola Jenis Tunjangan/Potongan
          </Link>
          <button onClick={() => setEditingId("new")}
            className="px-4 py-2 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
            <Pencil size={14} /> Edit Komponen Gaji
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Form Komponen Gaji</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pilih karyawan untuk mengisi baru, atau otomatis terisi data yang sudah ada untuk direvisi. Butuh jenis tunjangan/potongan baru? <Link href="/hrd/rewards/komponen-gaji" className="text-[#CC0000] font-bold hover:underline">Kelola di sini</Link>.</p>
          </div>
          <form ref={formRef} className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Karyawan</label>
              <select name="employee_id" value={selectedEmployeeId} onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                <option value="">Pilih karyawan...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name} - {e.position}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Gaji Pokok</label>
                <input name="basic_salary" type="number" min="0" value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Status PTKP</label>
                <select name="ptkp_status" value={ptkpStatus}
                  onChange={(e) => setPtkpStatus(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:border-[#CC0000] outline-none bg-white">
                  {PTKP_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">Tunjangan & Potongan</label>
                {selectedEmployeeId && (
                  <select onChange={(e) => { if (e.target.value) { addComponentRow(e.target.value); e.target.value = ""; } }}
                    className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:border-[#CC0000] outline-none bg-white">
                    <option value="">+ Tambah komponen...</option>
                    {availableToAdd.map((k) => <option key={k.id} value={k.id}>{k.nama} ({k.tipe === "tunjangan" ? "Tunjangan" : "Potongan"})</option>)}
                  </select>
                )}
              </div>
              {!selectedEmployeeId ? (
                <p className="text-xs text-slate-400">Pilih karyawan dulu untuk mengatur komponen tunjangan/potongan.</p>
              ) : loadingComponents ? (
                <p className="text-xs text-slate-400">Memuat komponen...</p>
              ) : componentRows.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada komponen. Tambah dari dropdown di atas.</p>
              ) : (
                <div className="space-y-2">
                  {componentRows.map((row) => {
                    const k = komponenById.get(row.komponen_id);
                    if (!k) return null;
                    return (
                      <div key={row.komponen_id} className="grid grid-cols-[1fr_auto_160px_auto] items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{k.nama}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${k.tipe === "tunjangan" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {k.tipe === "tunjangan" ? "Tunjangan" : "Potongan"}
                        </span>
                        <input type="number" min="0" value={row.jumlah} onChange={(e) => updateComponentAmount(row.komponen_id, e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:border-[#CC0000] outline-none" />
                        <button type="button" onClick={() => removeComponentRow(row.komponen_id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={13} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Msg m={msg} />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditingId(null); setSelectedEmployeeId(""); setComponentRows([]); }} className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-600 rounded-xl">Batal</button>
              <button type="button" onClick={handleSave} disabled={loading || !selectedEmployeeId}
                className="flex items-center gap-2 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60">
                <Save size={14} /> {loading ? "Menyimpan..." : "Simpan Komponen Gaji"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Struktur Gaji Karyawan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Potongan PPh 21 dan BPJS dihitung saat generate slip gaji, bukan di sini.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["Karyawan", "Gaji Pokok", "Tunjangan", "Potongan", "Status PTKP", "Total Kotor", ""].map((h) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {salaryRecords.length === 0 ? (
                <tr><td colSpan={7} className="p-0">
                  <EmptyState icon={Wallet} title={'Belum ada struktur gaji. Klik "Edit Komponen Gaji" untuk mulai.'} />
                </td></tr>
              ) : salaryRecords.map((rec) => {
                const emp = rec.employees as Record<string, string> | undefined;
                const base = Number(rec.basic_salary) || 0;
                const allowances = Number(rec.tunjangan_total) || 0;
                const deductions = Number(rec.potongan_total) || 0;
                // "Total Kotor" is gross (basic + allowances) — potongan is a
                // deduction and belongs in the net figure the payslip computes,
                // not subtracted from gross here.
                const gross = base + allowances;
                return (
                  <tr key={rec.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 text-xs">{emp?.full_name || "-"}</p>
                      <p className="text-[10px] text-slate-400">{emp?.position || "-"}</p>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">Rp {fmt(base)}</td>
                    <td className="px-6 py-4 text-xs text-emerald-600 font-medium">+Rp {fmt(allowances)}</td>
                    <td className="px-6 py-4 text-xs text-red-600 font-medium">{deductions > 0 ? `-Rp ${fmt(deductions)}` : "-"}</td>
                    <td className="px-6 py-4 text-xs text-slate-600">{(rec.ptkp_status as string) || "TK/0"}</td>
                    <td className="px-6 py-4 text-xs font-extrabold text-[#1A2530]">Rp {fmt(gross)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => startEditRow(rec.employee_id as string)} title="Edit gaji karyawan ini"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#CC0000] hover:bg-red-50 transition-colors">
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
