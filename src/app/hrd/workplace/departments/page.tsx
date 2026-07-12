"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Building2, AlertTriangle, X, Search, ChevronDown, ChevronRight } from "lucide-react";
import { getOrgStructure, addDepartmentManual, deleteOrgUnit } from "@/app/actions/org";
import type { OrgUnit, FlatUnit } from "@/types/org";
import EmptyState from "@/components/EmptyState";

function flattenTree(tree: OrgUnit[]): FlatUnit[] {
  const result: FlatUnit[] = [];
  function walk(units: OrgUnit[]) {
    for (const u of units) {
      if (u.isEmployee) continue;
      result.push({
        id: u.id,
        code: u.code,
        name: u.name,
        level: u.level,
        leader_name: u.leader_name,
        leader_email: u.leader_email,
      });
      if (u.children) walk(u.children);
    }
  }
  walk(tree);
  return result;
}

function getLevelLabel(level: number): string {
  switch (level) {
    case 0: return "Komisaris";
    case 1: return "Direktur Utama";
    case 2: return "Wakil Direktur";
    case 3: return "Kepala Divisi (L3)";
    case 4: return "Manajer Unit (L4)";
    case 5: return "Asisten Manajer (L5)";
    case 6: return "Supervisor / Koordinator";
    case 7: return "Staf / Pelaksana";
    default: return "Staf";
  }
}

// Buckets the full 5-level hierarchy into a few readable groups instead of
// one long flat list mixing Commissioner down to the smallest sub-unit.
function getBucket(level: number): { key: string; label: string } {
  if (level <= 1) return { key: "exec", label: "Eksekutif (Komisaris & Direktur)" };
  if (level === 2) return { key: "division", label: "Divisi" };
  if (level === 3) return { key: "dept", label: "Departemen" };
  return { key: "unit", label: "Unit & Sub-unit" };
}
const BUCKET_ORDER = ["exec", "division", "dept", "unit"];

/**
 * Departemen: halaman ini HANYA untuk membuat departemen/unit baru dalam
 * struktur organisasi (bukan untuk mengelola karyawan atau hal lain).
 * Kode diisi manual oleh HRD, tapi wajib mengacu ke sebuah induk (parent)
 * yang sudah ada agar posisinya dalam hierarki 5 level tetap jelas.
 */
export default function DepartmentsPage() {
  const [flatUnits, setFlatUnits] = useState<FlatUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [parentCode, setParentCode] = useState("");
  const [code, setCode] = useState("");
  const [unitName, setUnitName] = useState("");
  const [adding, setAdding] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FlatUnit | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["exec", "division"]));

  const toggleBucket = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const filteredUnits = useMemo(() => {
    if (!search.trim()) return flatUnits;
    const s = search.toLowerCase();
    return flatUnits.filter((u) => u.name.toLowerCase().includes(s) || u.code.toLowerCase().includes(s));
  }, [flatUnits, search]);

  const groupedUnits = useMemo(() => {
    const groups: Record<string, { label: string; units: FlatUnit[] }> = {};
    for (const u of filteredUnits) {
      const { key, label } = getBucket(u.level);
      if (!groups[key]) groups[key] = { label, units: [] };
      groups[key].units.push(u);
    }
    return BUCKET_ORDER.filter((k) => groups[k]).map((k) => ({ key: k, ...groups[k] }));
  }, [filteredUnits]);

  const fetchOrg = async () => {
    const t = await getOrgStructure();
    setFlatUnits(flattenTree(t));
    setLoading(false);
  };

  useEffect(() => {
    fetchOrg();
  }, []);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAdding(true);
    const fd = new FormData();
    fd.append("parent_code", parentCode);
    fd.append("code", code);
    fd.append("unit_name", unitName);
    const res = await addDepartmentManual(fd);
    if (res.error) {
      setError(res.error);
    } else {
      setParentCode(""); setCode(""); setUnitName("");
      showSuccess("Usulan departemen terkirim ke Direktur untuk disetujui.");
      await fetchOrg();
    }
    setAdding(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setError("");
    setDeleting(true);
    const res = await deleteOrgUnit(deleteTarget.code);
    setDeleting(false);
    if (res.error) {
      setError(res.error);
    } else {
      setDeleteTarget(null);
      showSuccess("Departemen beserta sub-unit berhasil dihapus.");
      await fetchOrg();
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center h-64">
        <p className="text-sm text-slate-500">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Departemen</h1>
        <p className="text-sm text-gray-500">
          Buat departemen/unit baru dalam struktur organisasi. Kode diisi manual, namun harus mengacu ke sebuah induk (parent) yang sudah ada.
          Untuk mengedit detail unit atau memindahkannya, gunakan halaman <span className="font-semibold">Unit Organisasi</span>.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">{success}</div>
      )}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>
      )}

      {/* Add New Department Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
          <Plus size={16} className="text-[#CC0000]" /> Tambah Departemen Baru
        </h2>
        <form onSubmit={handleAdd} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Induk / Parent *</label>
              <select value={parentCode} onChange={(e) => setParentCode(e.target.value)} required
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none bg-white">
                <option value="">Pilih Induk</option>
                {flatUnits.map(u => (
                  <option key={u.code} value={u.code}>{u.code} — {u.name} (L{u.level})</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Anchor posisi departemen baru dalam hierarki organisasi.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Kode Departemen *</label>
              <input type="text" required value={code} onChange={(e) => setCode(e.target.value)}
                placeholder="Cth: 1.1.2.3.0.0.0"
                className="w-full border border-gray-200 p-3 rounded-xl text-sm font-mono focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none" />
              <p className="text-[10px] text-slate-400 mt-1">Diisi manual — harus berada langsung di bawah kode induk yang dipilih.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Departemen *</label>
              <input type="text" required value={unitName} onChange={(e) => setUnitName(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none"
                placeholder="Cth: Divisi HRD" />
            </div>
          </div>

          <p className="text-[11px] text-slate-400">Pimpinan unit tidak lagi diisi di sini — ditentukan otomatis dari Position Management (Formasi) setelah karyawan ditempatkan.</p>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button type="submit" disabled={adding}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50">
              {adding ? "Menyimpan..." : "Simpan Departemen"}
            </button>
          </div>
        </form>
      </div>

      {/* List (read-only reference, delete-only) — grouped by hierarchy level
          instead of one long flat dump, so 50+ units stay scannable. */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-blue-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Departemen</h3>
              <p className="text-xs text-slate-400 mt-0.5">{flatUnits.length} departemen/unit terdaftar &bull; dikelompokkan per tingkat</p>
            </div>
          </div>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode atau nama..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#CC0000]/20 focus:border-[#CC0000]/30"
            />
          </div>
        </div>

        {flatUnits.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Belum ada departemen."
            description="Tambahkan departemen untuk memulai."
          />
        ) : groupedUnits.length === 0 ? (
          <EmptyState icon={Search} title="Tidak ditemukan." description="Tidak ada departemen/unit yang cocok dengan pencarian." />
        ) : (
          groupedUnits.map(({ key, label, units }) => {
            const isOpen = !!search.trim() || expanded.has(key);
            return (
              <div key={key} className="border-b border-slate-100 last:border-b-0">
                <button
                  onClick={() => toggleBucket(key)}
                  className="w-full flex items-center justify-between px-6 py-3.5 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-xs font-extrabold text-slate-700">{label}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{units.length} unit</span>
                    {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-slate-50">
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-2">Kode</div>
                      <div className="col-span-5">Nama</div>
                      <div className="col-span-3">Jabatan Pimpinan</div>
                      <div className="col-span-2 text-right">Aksi</div>
                    </div>
                    {units.map((unit) => (
                      <div key={unit.code} className="px-6 py-3 hover:bg-slate-50/40 transition-all grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-2">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            {unit.code}
                          </span>
                        </div>
                        <div className="col-span-5 min-w-0">
                          <p className="text-sm font-extrabold text-slate-800 truncate">{unit.name}</p>
                        </div>
                        <div className="col-span-3">
                          <span className="px-2 py-1 rounded-full text-[9px] font-extrabold border bg-slate-50 text-slate-600 border-slate-200">
                            {getLevelLabel(unit.level)}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-1">
                          <button onClick={() => setDeleteTarget(unit)}
                            className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 rounded-xl border border-red-100"><AlertTriangle size={20} className="text-red-600" /></div>
                <div>
                  <h3 className="font-bold text-slate-800">Hapus Departemen?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Semua sub-unit di bawahnya juga akan dihapus permanen.</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Anda akan menghapus <span className="font-extrabold text-slate-800">{deleteTarget.code} &mdash; {deleteTarget.name}</span> beserta seluruh unit turunannya. Tindakan ini tidak dapat diurungkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-slate-50 transition-colors">Batal</button>
              <button type="button" onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50">
                {deleting ? "Menghapus..." : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
