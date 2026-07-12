"use client";

import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, DollarSign, TrendingUp, Truck, FileText, ShieldCheck,
  Settings, Building2, Edit3, PlusCircle, Trash2, X,
  Mail, Briefcase, AlertTriangle, User, IdCard
} from "lucide-react";
import type { OrgUnit, Employee } from "@/types/org";

/* ─────────────────── Shared Portal + Backdrop ──────────────────────────── */

function Portal({ mounted, children }: { mounted: boolean; children: React.ReactNode }) {
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function Backdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[5vh]"
      onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.94, opacity: 0, y: 12 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        className="relative z-10 w-full max-w-lg"
        onClick={e => e.stopPropagation()}>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────── InfoModal ─────────────────────────────────────────── */

export function InfoModal({
  mounted, sel, selEmp, onClose, onEdit,
}: {
  mounted: boolean; sel: OrgUnit; selEmp: Employee | null;
  onClose: () => void; onEdit: (sel: OrgUnit) => void;
}) {
  const hdrBg = "bg-slate-800";
  const ini = (sel.leader_name || "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <Portal mounted={mounted}>
      <AnimatePresence>
        <Backdrop onClose={onClose}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className={`${hdrBg} px-6 py-5 relative`}>
              <button onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">{sel.name}</p>
              <h2 className="text-white font-black text-2xl leading-tight">{sel.leader_name || "Belum ditentukan"}</h2>
              {selEmp?.position && <p className="text-white/75 text-sm mt-1">{selEmp.position}</p>}
            </div>
            <div className="px-6 pt-5 pb-6 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                <div className={`w-16 h-16 rounded-2xl ${hdrBg} flex items-center justify-center text-white font-black text-2xl shadow`}>
                  {ini}
                </div>
                <div>
                  <p className="text-slate-800 font-black text-lg leading-tight">{sel.leader_name || "—"}</p>
                  <p className="text-slate-500 text-sm">{selEmp?.department || sel.name}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wide">
                    Level {sel.level}
                  </span>
                </div>
              </div>
              {selEmp ? (
                <div className="grid grid-cols-1 gap-2.5">
                  <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={selEmp.email} color="sky" />
                  <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Jabatan" value={selEmp.position || "—"} color="violet" />
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="Departemen" value={selEmp.department || "—"} color="emerald" />
                  <InfoRow icon={<IdCard className="w-4 h-4" />} label="ID Karyawan" value={selEmp.id} color="amber" />
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-5 text-center">
                  {sel.leader_email ? (
                    <>
                      <Mail className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-600 text-sm font-semibold">{sel.leader_email}</p>
                      <p className="text-slate-400 text-xs mt-1">Data karyawan tidak ditemukan di direktori.</p>
                    </>
                  ) : (
                    <>
                      <User className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-sm">Pimpinan unit belum ditetapkan.</p>
                    </>
                  )}
                </div>
              )}
              <div className="bg-slate-50 rounded-xl p-4 mt-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Info Unit</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-[9px] text-slate-400">Nama Unit</p><p className="text-xs font-bold text-slate-700">{sel.name}</p></div>
                  <div><p className="text-[9px] text-slate-400">Kode</p><p className="text-xs font-bold text-slate-700 font-mono">{sel.code}</p></div>
                </div>
              </div>
              <button onClick={() => { onClose(); onEdit(sel); }}
                className="w-full flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl py-3 text-sm font-bold transition-colors">
                <Edit3 className="w-4 h-4" /> Edit Unit Ini
              </button>
            </div>
          </div>
        </Backdrop>
      </AnimatePresence>
    </Portal>
  );
}

function InfoRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const clr: { [k: string]: string } = {
    sky: "bg-sky-50 text-sky-600", violet: "bg-violet-50 text-violet-600",
    emerald: "bg-emerald-50 text-emerald-600", amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clr[color] || "bg-slate-100 text-slate-500"}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────── EditModal ─────────────────────────────────────────── */

export interface UnitDesignFields {
  jenis_unit: string; singkatan: string; deskripsi: string; jumlah_formasi: string;
  budget_cost_center: string; kode_cost_center: string; business_unit: string;
  lokasi_kerja: string; tanggal_berlaku: string; tanggal_berakhir: string; status: string;
}

export const JENIS_UNIT_OPTIONS = ["Holding", "Direktorat", "Divisi", "Departemen", "Section", "Sub Section", "Unit", "Tim", "Project", "Cabang"];

export function EditModal({
  mounted, modal, sel, fName, setFName, fCode, setFCode, fLevel, setFLevel,
  design, setDesign, fErr, fLoading,
  onClose, onSave,
}: {
  mounted: boolean;
  modal: "edit" | "add";
  sel: OrgUnit;
  fName: string; setFName: (v: string) => void;
  fCode: string; setFCode: (v: string) => void;
  fLevel: number; setFLevel: (v: number) => void;
  design: UnitDesignFields; setDesign: (v: UnitDesignFields) => void;
  fErr: string; fLoading: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const set = (k: keyof UnitDesignFields) => (v: string) => setDesign({ ...design, [k]: v });
  const isAdd = modal === "add";
  return (
    <Portal mounted={mounted}>
      <AnimatePresence>
        <Backdrop onClose={onClose}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isAdd ? <PlusCircle className="w-5 h-5 text-emerald-400" /> : <Edit3 className="w-5 h-5 text-sky-400" />}
                <h3 className="text-white font-bold text-sm truncate max-w-xs">
                  {isAdd ? `Tambah sub-unit ke "${sel?.name}"` : `Edit: ${sel?.name}`}
                </h3>
              </div>
              <button onClick={onClose} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {!isAdd && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Kode Unit
                </label>
                <input type="text" value={fCode} onChange={e => setFCode(e.target.value)}
                  placeholder="1.2.1.0.0.0.0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                <p className="text-[10px] text-slate-400 mt-1">Format: 7 digit dipisah titik. Ubah kode akan mengubah posisi unit dalam struktur.</p>
              </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Unit <span className="text-red-500">*</span>
                </label>
                <input type="text" value={fName} onChange={e => setFName(e.target.value)}
                  placeholder="Contoh: Human Resources"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
              </div>
              {!isAdd && (
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Tingkat / Level
                </label>
                <select value={fLevel} onChange={e => setFLevel(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all">
                  {[0,1,2,3,4,5,6,7].map(l => (
                    <option key={l} value={l}>L{l} &mdash; {["Komisaris","Direktur Utama","Wakil Direktur","Kepala Divisi","Manajer Unit","Asisten Manajer","Supervisor/Koordinator","Staf/Pelaksana"][l]}</option>
                  ))}
                </select>
              </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jenis Unit</label>
                  <select value={design.jenis_unit} onChange={e => set("jenis_unit")(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all">
                    {JENIS_UNIT_OPTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Singkatan</label>
                  <input type="text" value={design.singkatan} onChange={e => set("singkatan")(e.target.value)} placeholder="Contoh: HRD"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Deskripsi</label>
                <textarea value={design.deskripsi} onChange={e => set("deskripsi")(e.target.value)} rows={2}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Jumlah Formasi</label>
                  <input type="number" min={0} value={design.jumlah_formasi} onChange={e => set("jumlah_formasi")(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Business Unit</label>
                  <input type="text" value={design.business_unit} onChange={e => set("business_unit")(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kode Cost Center</label>
                  <input type="text" value={design.kode_cost_center} onChange={e => set("kode_cost_center")(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Budget Cost Center</label>
                  <input type="number" min={0} value={design.budget_cost_center} onChange={e => set("budget_cost_center")(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Lokasi Kerja</label>
                  <input type="text" value={design.lokasi_kerja} onChange={e => set("lokasi_kerja")(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={design.status} onChange={e => set("status")(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all">
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Berlaku</label>
                  <input type="date" value={design.tanggal_berlaku} onChange={e => set("tanggal_berlaku")(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tanggal Berakhir</label>
                  <input type="date" value={design.tanggal_berakhir} onChange={e => set("tanggal_berakhir")(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1"><User className="w-3 h-3" />Pimpinan unit tidak lagi diisi di sini — ditentukan otomatis dari Position Management (Formasi).</p>
              {fErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-red-600 text-sm">{fErr}</p></div>}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                <button onClick={onSave} disabled={fLoading}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                  {fLoading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </div>
          </div>
        </Backdrop>
      </AnimatePresence>
    </Portal>
  );
}

/* ─────────────────── DelModal ──────────────────────────────────────────── */

export function DelModal({
  mounted, sel, fErr, fLoading, onClose, onDelete,
}: {
  mounted: boolean; sel: OrgUnit; fErr: string; fLoading: boolean;
  onClose: () => void; onDelete: () => void;
}) {
  return (
    <Portal mounted={mounted}>
      <AnimatePresence>
        <Backdrop onClose={onClose}>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-red-500 px-6 py-5 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Trash2 className="w-5 h-5 text-white" /></div>
              <div><h3 className="text-white font-black text-base">Hapus Unit?</h3><p className="text-red-100 text-xs">Tindakan ini tidak dapat diurungkan.</p></div>
              <button onClick={onClose} className="ml-auto w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm mb-1">Anda akan menghapus unit <span className="font-black text-slate-900">&ldquo;{sel?.name}&rdquo;</span> beserta semua sub-unitnya secara permanen.</p>
              {fErr && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mt-3"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /><p className="text-red-600 text-sm">{fErr}</p></div>}
              <div className="flex gap-3 mt-5">
                <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                <button onClick={onDelete} disabled={fLoading} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">{fLoading ? "Menghapus..." : "Ya, Hapus"}</button>
              </div>
            </div>
          </div>
        </Backdrop>
      </AnimatePresence>
    </Portal>
  );
}

/* ─────────────────── DeptIcon ──────────────────────────────────────────── */

export function DeptIcon({ name }: { name: string }) {
  const l = name.toLowerCase();
  if (l.includes("hr") || l.includes("human")) return <Users className="w-4 h-4 text-emerald-600" />;
  if (l.includes("finance") || l.includes("account")) return <DollarSign className="w-4 h-4 text-amber-600" />;
  if (l.includes("marketing") || l.includes("sales")) return <TrendingUp className="w-4 h-4 text-indigo-600" />;
  if (l.includes("operat")) return <Truck className="w-4 h-4 text-blue-600" />;
  if (l.includes("procure")) return <Settings className="w-4 h-4 text-cyan-600" />;
  if (l.includes("safety") || l.includes("hse")) return <ShieldCheck className="w-4 h-4 text-rose-600" />;
  if (l.includes("doc") || l.includes("delivery")) return <FileText className="w-4 h-4 text-teal-600" />;
  return <Building2 className="w-4 h-4 text-slate-500" />;
}
