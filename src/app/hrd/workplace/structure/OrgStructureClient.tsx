"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users, FileText, Printer, Search, Building2, Activity,
  ChevronRight
} from "lucide-react";
import { addOrgUnit, updateOrgUnit, deleteOrgUnit } from "@/app/actions/org";
import TreeView from "@/components/org/TreeView";
import TableView from "@/components/org/TableView";
import { InfoModal, EditModal, DelModal, DeptIcon } from "./OrgModals";
import type { OrgUnit, Employee } from "@/types/org";

interface Props { orgData: OrgUnit[]; employees: Employee[]; }

export default function OrgStructureClient({ orgData = [], employees = [] }: Props) {
  const router = useRouter();

  const [tab, setTab] = useState<"tree" | "table" | "directory">("tree");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState<null | "info" | "edit" | "add" | "del">(null);
  const [sel, setSel] = useState<OrgUnit | null>(null);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const handleExportPDF = async () => {
    if (!contentRef.current || exporting) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const jsPDF = (await import("jspdf")).default;
      const dataUrl = await toPng(contentRef.current, { backgroundColor: "#ffffff", pixelRatio: 2 });
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise<void>(r => { img.onload = () => r(); });
      const pdf = new jsPDF({
        orientation: img.width > img.height ? "landscape" : "portrait",
        unit: "px", format: [img.width, img.height],
      });
      pdf.addImage(img, "PNG", 0, 0, img.width, img.height);
      pdf.save("struktur-organisasi-ptpgp.pdf");
    } catch (err) { console.error(err); }
    setExporting(false);
  };

  const handlePrint = () => { window.print(); };

  const [fName, setFName] = useState("");
  const [fCode, setFCode] = useState("");
  const [fLevel, setFLevel] = useState<number>(0);
  const [lQ, setLQ] = useState("");
  const [lSel, setLSel] = useState<Employee | null>(null);
  const [showDrop, setShowDrop] = useState(false);
  const [fLoading, setFLoading] = useState(false);
  const [fErr, setFErr] = useState("");

  const selEmp = useMemo(() => sel?.leader_email ? employees.find(e => e.email === sel.leader_email) ?? null : null, [sel, employees]);

  const filtLeaders = useMemo(() => {
    const s = lQ.toLowerCase().trim();
    if (!s) return employees.slice(0, 6);
    return employees.filter(e => e.full_name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s) || e.position.toLowerCase().includes(s)).slice(0, 8);
  }, [employees, lQ]);

  const deptMap = useMemo(() => {
    const m: Record<string, Employee[]> = {};
    employees.forEach(e => { const d = e.department || "Lainnya"; if (!m[d]) m[d] = []; m[d].push(e); });
    return m;
  }, [employees]);

  const flat = useMemo(() => {
    const out: { id: string; name: string; leader: string; email: string; path: string[] }[] = [];
    const walk = (n: OrgUnit, p: string[]) => { const np = [...p, n.name]; out.push({ id: n.id, name: n.name, leader: n.leader_name, email: n.leader_email, path: np }); n.children.forEach(c => walk(c, np)); };
    orgData.forEach(r => walk(r, []));
    return out;
  }, [orgData]);

  const srch = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return [];
    return flat.filter(i => i.name.toLowerCase().includes(s) || i.leader.toLowerCase().includes(s) || i.email.toLowerCase().includes(s));
  }, [q, flat]);

  const clickNode = (n: OrgUnit) => { setSel(n); setModal("info"); };
  const openEd = (n: OrgUnit) => { setSel(n); setFName(n.name); setFCode(n.code); setFLevel(n.level); const e = n.leader_email ? employees.find(x => x.email === n.leader_email) ?? null : null; setLSel(e); setLQ(n.leader_name || ""); setFErr(""); setModal("edit"); };
  const openAd = (n: OrgUnit) => { setSel(n); setFName(""); setFCode(""); setFLevel(n.level + 1); setLSel(null); setLQ(""); setFErr(""); setModal("add"); };
  const openDl = (n: OrgUnit) => { setSel(n); setFErr(""); setModal("del"); };
  const closeM = () => { setModal(null); setSel(null); };

  const doEdit = async () => {
    if (!sel || !fName.trim()) { setFErr("Nama wajib diisi."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    fd.append("unit_code", sel.code); fd.append("unit_name", fName.trim());
    fd.append("leader_name", lSel?.full_name || lQ); fd.append("leader_email", lSel?.email || "");
    fd.append("level", String(fLevel));
    if (fCode.trim() && fCode.trim() !== sel.code) fd.append("new_code", fCode.trim());
    const r = await updateOrgUnit(fd); setFLoading(false);
    if (r.error) { setFErr(r.error); return; } closeM(); router.refresh();
  };
  const doAdd = async () => {
    if (!sel || !fName.trim()) { setFErr("Nama wajib diisi."); return; }
    setFLoading(true); setFErr("");
    const fd = new FormData();
    fd.append("parent_code", sel.code); fd.append("unit_name", fName.trim());
    fd.append("leader_name", lSel?.full_name || lQ); fd.append("leader_email", lSel?.email || "");
    const r = await addOrgUnit(fd); setFLoading(false);
    if (r.error) { setFErr(r.error); return; } closeM(); router.refresh();
  };
  const doDel = async () => {
    if (!sel) return; setFLoading(true); setFErr("");
    const r = await deleteOrgUnit(sel.code); setFLoading(false);
    if (r.error) { setFErr(r.error); return; } closeM(); router.refresh();
  };

  const handleOpenEditFromInfo = (unit: OrgUnit) => {
    setSel(unit);
    setFName(unit.name);
    setFCode(unit.code);
    setFLevel(unit.level);
    const e = unit.leader_email ? employees.find(x => x.email === unit.leader_email) ?? null : null;
    setLSel(e);
    setLQ(unit.leader_name || "");
    setFErr("");
    setModal("edit");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start">
          {(["tree", "table", "directory"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "tree" && <><Activity className="w-3.5 h-3.5" />Pohon</>}
              {t === "table" && <><Building2 className="w-3.5 h-3.5" />Tabel</>}
              {t === "directory" && <><Users className="w-3.5 h-3.5" />Direktori ({employees.length})</>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
            <Printer className="w-3.5 h-3.5" />Cetak
          </button>
          <button onClick={handleExportPDF} disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#004A8F] hover:bg-[#003870] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
            <FileText className="w-3.5 h-3.5" />PDF
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "tree" && (
          <motion.div key="tree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            ref={contentRef} className="print:block">
            <TreeView data={orgData}
              onClick={clickNode} onEdit={openEd} onAdd={openAd} onDelete={openDl} />
          </motion.div>
        )}

        {tab === "table" && (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            ref={contentRef} className="print:block">
            <TableView data={orgData}
              onClick={clickNode} onEdit={openEd} onAdd={openAd} onDelete={openDl} />
          </motion.div>
        )}

        {tab === "directory" && (
          <motion.div key="dir" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }} className="space-y-4 max-w-4xl mx-auto print:block">
            <div className="relative max-w-lg mx-auto print:hidden">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Cari nama, jabatan, atau divisi..." value={q}
                onChange={e => setQ(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all text-slate-800" />
            </div>
            <div className="space-y-2.5">
              {q.trim() ? (
                srch.length > 0 ? srch.map(item => (
                  <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {item.path.slice(0, -1).map((p, i) => (
                          <span key={i} className="flex items-center gap-0.5">{p}<ChevronRight className="w-2.5 h-2.5" /></span>
                        ))}
                        <span className="text-red-500 font-extrabold">{item.path[item.path.length - 1]}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{item.name}</h4>
                    </div>
                    {item.leader && (
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">{item.leader[0]}</div>
                        <div><p className="text-xs font-bold text-slate-700">{item.leader}</p>{item.email && <p className="text-[10px] text-slate-400">{item.email}</p>}</div>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">Tidak ada hasil ditemukan.</div>
                )
              ) : (
                <div className="space-y-3">
                  {Object.keys(deptMap).map(dept => (
                    <div key={dept} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                      <h4 className="font-black text-slate-800 text-xs border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                        <DeptIcon name={dept} />{dept}
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto">{deptMap[dept].length} orang</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {deptMap[dept].map(e => (
                          <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 shrink-0">{e.full_name[0]}</div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{e.full_name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{e.position}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && modal === "info" && sel && (
        <InfoModal mounted={mounted} sel={sel} selEmp={selEmp}
          onClose={closeM} onEdit={handleOpenEditFromInfo} />
      )}
      {mounted && (modal === "edit" || modal === "add") && sel && (
        <EditModal
          mounted={mounted} modal={modal as "edit" | "add"} sel={sel}
          fName={fName} setFName={setFName}
          fCode={fCode} setFCode={setFCode}
          fLevel={fLevel} setFLevel={setFLevel}
          lQ={lQ} setLQ={setLQ}
          lSel={lSel} setLSel={setLSel}
          showDrop={showDrop} setShowDrop={setShowDrop}
          fErr={fErr} fLoading={fLoading}
          filtLeaders={filtLeaders}
          onClose={closeM}
          onSave={modal === "add" ? doAdd : doEdit}
        />
      )}
      {mounted && modal === "del" && sel && (
        <DelModal mounted={mounted} sel={sel} fErr={fErr} fLoading={fLoading}
          onClose={closeM} onDelete={doDel} />
      )}
    </div>
  );
}
