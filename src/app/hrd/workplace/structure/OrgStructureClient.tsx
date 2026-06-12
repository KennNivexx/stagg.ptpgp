"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Users, DollarSign, TrendingUp, Truck, FileText, ShieldCheck,
  Settings, Printer, Search, Building2, Activity, Edit3,
  PlusCircle, Trash2, X, Mail, Briefcase, AlertTriangle,
  User, ChevronRight, Phone, Calendar, IdCard, Image as ImageIcon
} from "lucide-react";
import { addOrgUnit, updateOrgUnit, deleteOrgUnit } from "@/app/actions/org";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

/* ─────────────────────────────── Types ───────────────────────────────────── */
interface OrgUnit {
  id: string; code: string; name: string; level: number;
  leader_name: string; leader_email: string; children: OrgUnit[];
}
interface Employee {
  id: string; full_name: string; email: string;
  position: string; department: string;
}
interface Props { orgData: OrgUnit[]; employees: Employee[]; }

/* ─────────────────────────────── Constants ───────────────────────────────── */
const LC = "#00A2E8"; // line color

/* ─────────────────────────────── Card helpers ────────────────────────────── */
type CKind = "commissioner"|"audit"|"red"|"sky"|"navy"|"blue"|"green"|"orange";

function leafKind(name: string): "blue"|"green"|"orange" {
  const n = name.toLowerCase();
  if (["human resources","security","project appraisal","regional","forwarder","ppjk",
       "warehouse","project and heavy equipment","project & heavy equipment"].some(s=>n.includes(s))) return "blue";
  if (["general affair","it application","finance, accounting","finance accounting",
       "vehicle operations","operasional alat berat","operasional plant",
       "quality control","delivery note","document control"].some(s=>n.includes(s))) return "green";
  return "orange";
}

function getKind(node: OrgUnit): CKind {
  const n = node.name.toLowerCase();
  if (node.level===0) return "commissioner";
  if (node.level===1) return n.includes("audit") ? "audit" : "red";
  if (node.level===2) return n.includes("deputy") ? "red" : "sky";
  if (node.level===3) return "navy";
  return leafKind(node.name);
}

const KS: Record<CKind,{wrap:string;hdr?:string}> = {
  commissioner: { wrap:"bg-white border-2 border-red-500 rounded-sm" },
  audit:        { wrap:"bg-white border border-slate-400 rounded-sm" },
  red:          { wrap:"bg-white border border-red-500 rounded-sm overflow-hidden",   hdr:"bg-red-500" },
  sky:          { wrap:"bg-white border border-[#00A2E8] rounded-sm overflow-hidden", hdr:"bg-[#00A2E8]" },
  navy:         { wrap:"bg-white border border-[#1A2E40] rounded-sm overflow-hidden", hdr:"bg-[#1A2E40]" },
  blue:         { wrap:"bg-[#00A2E8] border border-[#008CC4] rounded-sm" },
  green:        { wrap:"bg-[#4CAF50] border border-[#388E3C] rounded-sm" },
  orange:       { wrap:"bg-[#FFC107] border border-[#FFA000] rounded-sm" },
};

/* ─────────────────────────────── Card Component ──────────────────────────── */
function Card({ node, w=160, onClick, em, onEd, onAd, onDl }:{
  node:OrgUnit; w?:number; onClick:()=>void;
  em:boolean; onEd:()=>void; onAd:()=>void; onDl:()=>void;
}) {
  const kind = getKind(node);
  const s = KS[kind];
  const isH = kind==="red"||kind==="sky"||kind==="navy";
  const isDark = kind==="orange";

  return (
    <div className="relative group/c shrink-0" style={{width:w}} data-node="true">
      <div
        className={`${s.wrap} cursor-pointer hover:brightness-95 transition-[filter] duration-100 text-center`}
        style={{width:w}}
        onClick={onClick}
      >
        {kind==="commissioner" && (
          <div className="px-2 py-1.5">
            <p className="text-red-600 font-black text-[10px] uppercase tracking-wider leading-tight">{node.name}</p>
            {node.leader_name && <p className="text-slate-600 text-[8px] mt-0.5">{node.leader_name}</p>}
          </div>
        )}
        {kind==="audit" && (
          <div className="px-2 py-1.5">
            <p className="text-slate-800 font-bold text-[9px] leading-tight">{node.name}</p>
            {node.leader_name && <p className="text-slate-500 text-[8px] mt-0.5">{node.leader_name}</p>}
          </div>
        )}
        {isH && (
          <>
            <div className={`${s.hdr} px-2 py-[3px]`}>
              <p className="text-white font-extrabold text-[8px] uppercase tracking-wide leading-tight">{node.name}</p>
            </div>
            <div className="bg-white px-2 py-[3px]">
              {node.leader_name
                ? <p className="text-slate-800 font-semibold text-[8px] leading-tight">{node.leader_name}</p>
                : <p className="text-slate-300 italic text-[7px]">—</p>}
            </div>
          </>
        )}
        {(kind==="blue"||kind==="green"||kind==="orange") && (
          <div className="px-2 py-[5px]">
            <p className={`${isDark?"text-slate-900":"text-white"} font-bold text-[8px] uppercase leading-tight`}>
              {node.name}
            </p>
          </div>
        )}
      </div>
      {em && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-[999]
          opacity-0 group-hover/c:opacity-100 transition-opacity duration-100
          flex gap-0.5 pointer-events-none group-hover/c:pointer-events-auto whitespace-nowrap">
          <button onClick={e=>{e.stopPropagation();onEd();}} className="bg-sky-500 hover:bg-sky-600 text-white px-1 py-0.5 rounded text-[8px] shadow"><Edit3 className="w-2 h-2"/></button>
          <button onClick={e=>{e.stopPropagation();onAd();}} className="bg-emerald-500 hover:bg-emerald-600 text-white px-1 py-0.5 rounded text-[8px] shadow"><PlusCircle className="w-2 h-2"/></button>
          <button onClick={e=>{e.stopPropagation();onDl();}} className="bg-red-500 hover:bg-red-600 text-white px-1 py-0.5 rounded text-[8px] shadow"><Trash2 className="w-2 h-2"/></button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────── Connector primitives ───────────────────── */
const V = ({h=20}:{h?:number}) => <div style={{width:2,height:h,background:LC,flexShrink:0,alignSelf:"center"}}/>;
const H = ({w=12}:{w?:number}) => <div style={{height:2,width:w,background:LC,flexShrink:0}}/>;
const AD = () => <div style={{width:0,height:0,flexShrink:0,alignSelf:"center",
  borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderTop:`6px solid ${LC}`}}/>;
const AR = () => <div style={{width:0,height:0,flexShrink:0,
  borderTop:"3.5px solid transparent",borderBottom:"3.5px solid transparent",borderLeft:`5px solid ${LC}`}}/>;

/* ─────────────────────────────── RailList ────────────────────────────────── */
// The pattern in the reference image for all branch columns is:
//
//   ┬── [ParentCard]          ← left edge of vertical rail sits here
//   │   ├── [leaf]
//   │   ├── [leaf]
//   ├── [ParentCard]
//   │   └── [leaf]
//   └── [ParentCard]
//
// We implement this with a CSS-border left-rail approach:
// The outer container has `border-left: 2px solid LC`.
// Each row item has `border-top: 2px solid LC` on a pseudo-element via
// a wrapper div that has padding-left equal to the branch horizontal length.
//
// Because React/Tailwind doesn't support ::before easily inline, we use a
// simpler composable approach:
// Each item row = flex row: [Hline(w) + Arrow + Card]
// The Hline and Arrow sit inside a container that has `position:relative`.
// We draw the vertical rail as a real 2px-wide div aligned to the left of
// all items using `position:absolute`.

interface RItem { node: OrgUnit }

function RailList({
  items, parentW=152, leafW=130,
  railOffset=0,     // horizontal indent for the rail (default=0, children indent by parentW amount)
  em,
  onC, onEd, onAd, onDl,
}: {
  items: RItem[];
  parentW?: number;
  leafW?: number;
  railOffset?: number;
  em: boolean;
  onC:(n:OrgUnit)=>void;
  onEd:(n:OrgUnit)=>void;
  onAd:(n:OrgUnit)=>void;
  onDl:(n:OrgUnit)=>void;
}) {
  // Fixed geometry (px) — must match actual card heights
  const CARD_H     = 26;  // approximate rendered card height
  const LEAF_H     = 22;  // leaf card height
  const PARENT_GAP = 10;  // gap between parent groups
  const LEAF_GAP   = 5;   // gap between leaves inside a group
  const H_LEN      = 14;  // horizontal branch stub length
  const H_LEN_LEAF = 12;  // horizontal stub for sub-leaves

  // Total rail height = sum of all rows heights
  // Rail starts at vertical-center of first parent card, ends at vertical-center of last parent card
  function railHeight(): number {
    if (items.length <= 1) return 0;
    let h = 0;
    items.forEach((it, i) => {
      h += CARD_H;
      const kidsH = it.node.children.length > 0
        ? it.node.children.length * (LEAF_H + LEAF_GAP) - LEAF_GAP
        : 0;
      h += kidsH;
      if (i < items.length - 1) h += PARENT_GAP;
    });
    // rail spans from center-of-first to center-of-last
    return h - CARD_H;
  }

  if (items.length === 0) return null;

  return (
    <div style={{ position:"relative", display:"flex", flexDirection:"row" }}>
      {/* ── Vertical rail ── */}
      <div style={{
        position:"absolute",
        left: 0,
        top: CARD_H / 2,
        width: 2,
        height: railHeight(),
        background: LC,
        flexShrink: 0,
      }}/>

      {/* ── Items column ── */}
      <div style={{ display:"flex", flexDirection:"column", gap: PARENT_GAP }}>
        {items.map(({ node: n }, gi) => (
          <div key={n.id} style={{ display:"flex", flexDirection:"column" }}>
            {/* Parent row: H ─► Card */}
            <div style={{ display:"flex", alignItems:"center" }}>
              <H w={H_LEN}/><AR/>
              <Card node={n} w={parentW} onClick={()=>onC(n)} em={em}
                onEd={()=>onEd(n)} onAd={()=>onAd(n)} onDl={()=>onDl(n)}/>
            </div>

            {/* Sub-children (leaves) */}
            {n.children.length > 0 && (
              <div style={{ position:"relative", marginLeft: H_LEN + 5, display:"flex", flexDirection:"row" }}>
                {/* Sub-vertical rail */}
                <div style={{
                  position:"absolute",
                  left: 0,
                  top: LEAF_H / 2,
                  width: 2,
                  height: Math.max(0, (n.children.length - 1) * (LEAF_H + LEAF_GAP) + 2),
                  background: LC,
                }}/>
                {/* Sub-items */}
                <div style={{ display:"flex", flexDirection:"column", gap: LEAF_GAP }}>
                  {n.children.map(leaf => (
                    <div key={leaf.id} style={{ display:"flex", alignItems:"center" }}>
                      <H w={H_LEN_LEAF}/><AR/>
                      <Card node={leaf} w={leafW} onClick={()=>onC(leaf)} em={em}
                        onEd={()=>onEd(leaf)} onAd={()=>onAd(leaf)} onDl={()=>onDl(leaf)}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────── Main Component ──────────────────────────── */
export default function OrgStructureClient({ orgData=[], employees=[] }: Props) {
  const router = useRouter();

  const [tab, setTab] = useState<"visual"|"employees">("visual");
  const [q, setQ] = useState("");
  const [em, setEm] = useState(false);
  const [modal, setModal] = useState<null|"info"|"edit"|"add"|"del">(null);
  const [sel, setSel] = useState<OrgUnit|null>(null);
  const [mounted, setMounted] = useState(false);
  const chartInnerRef = React.useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  useEffect(()=>setMounted(true),[]);

  const handleExportPNG = async () => {
    if (!chartInnerRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(chartInnerRef.current, { backgroundColor: "#F8FAFC", pixelRatio: 2, skipFonts: true });
      const link = document.createElement("a");
      link.download = "struktur-organisasi-ptpgp.png";
      link.href = dataUrl;
      link.click();
    } catch (err) { console.error(err); }
    setExporting(false);
  };

  const handleExportPDF = async () => {
    if (!chartInnerRef.current || exporting) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(chartInnerRef.current, { backgroundColor: "#F8FAFC", pixelRatio: 2, skipFonts: true });
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

  // form
  const [fName, setFName] = useState("");
  const [lQ, setLQ] = useState("");
  const [lSel, setLSel] = useState<Employee|null>(null);
  const [showDrop, setShowDrop] = useState(false);
  const [fLoading, setFLoading] = useState(false);
  const [fErr, setFErr] = useState("");

  /* ── tree ─────────────────────────────────────────────────────────────── */
  const comm = useMemo(()=>orgData.find(u=>u.name.toLowerCase().includes("commissioner"))??orgData[0],[orgData]);
  const audit = useMemo(()=>comm?.children.find(u=>u.name.toLowerCase().includes("audit")),[comm]);
  const dir   = useMemo(()=>comm?.children.find(u=>{const n=u.name.toLowerCase();return(n.includes("director")||n==="director")&&!n.includes("deputy")&&!n.includes("audit");}),[comm]);
  const dep   = useMemo(()=>dir?.children.find(u=>u.name.toLowerCase().includes("deputy")),[dir]);
  const proc  = useMemo(()=>dir?.children.find(u=>u.name.toLowerCase().includes("procurement")),[dir]);
  const mr    = useMemo(()=>dir?.children.find(u=>u.name.toLowerCase().includes("management representative")||u.name.toLowerCase()==="mr"),[dir]);
  const hse   = useMemo(()=>dir?.children.find(u=>u.name.toLowerCase().includes("health")||u.name.toLowerCase().includes("hse")||u.name.toLowerCase().includes("environment")),[dir]);
  const hrga  = useMemo(()=>dep?.children.find(u=>u.name.toLowerCase().includes("hr")),[dep]);
  const fin   = useMemo(()=>dep?.children.find(u=>u.name.toLowerCase().includes("finance")),[dep]);
  const mkt   = useMemo(()=>dep?.children.find(u=>u.name.toLowerCase().includes("marketing")),[dep]);
  const ops   = useMemo(()=>dep?.children.find(u=>u.name.toLowerCase().includes("operational")),[dep]);

  const selEmp = useMemo(()=>sel?.leader_email?employees.find(e=>e.email===sel.leader_email)??null:null,[sel,employees]);

  const filtLeaders = useMemo(()=>{
    const s=lQ.toLowerCase().trim();
    if(!s) return employees.slice(0,6);
    return employees.filter(e=>e.full_name.toLowerCase().includes(s)||e.email.toLowerCase().includes(s)||e.position.toLowerCase().includes(s)).slice(0,8);
  },[employees,lQ]);

  const deptMap = useMemo(()=>{
    const m:Record<string,Employee[]>={};
    employees.forEach(e=>{const d=e.department||"Lainnya";if(!m[d])m[d]=[];m[d].push(e);});
    return m;
  },[employees]);

  const flat = useMemo(()=>{
    const out:{id:string;name:string;leader:string;email:string;path:string[]}[]=[];
    const walk=(n:OrgUnit,p:string[])=>{const np=[...p,n.name];out.push({id:n.id,name:n.name,leader:n.leader_name,email:n.leader_email,path:np});n.children.forEach(c=>walk(c,np));};
    orgData.forEach(r=>walk(r,[]));
    return out;
  },[orgData]);

  const srch = useMemo(()=>{
    const s=q.toLowerCase().trim();
    if(!s) return [];
    return flat.filter(i=>i.name.toLowerCase().includes(s)||i.leader.toLowerCase().includes(s)||i.email.toLowerCase().includes(s));
  },[q,flat]);

  /* ── actions ──────────────────────────────────────────────────────────── */
  const clickNode=(n:OrgUnit)=>{if(em)return;setSel(n);setModal("info");};
  const openEd=(n:OrgUnit)=>{setSel(n);setFName(n.name);const e=n.leader_email?employees.find(x=>x.email===n.leader_email)??null:null;setLSel(e);setLQ(n.leader_name||"");setFErr("");setModal("edit");};
  const openAd=(n:OrgUnit)=>{setSel(n);setFName("");setLSel(null);setLQ("");setFErr("");setModal("add");};
  const openDl=(n:OrgUnit)=>{setSel(n);setFErr("");setModal("del");};
  const closeM=()=>{setModal(null);setSel(null);};

  const doEdit=async()=>{
    if(!sel||!fName.trim()){setFErr("Nama wajib diisi.");return;}
    setFLoading(true);setFErr("");
    const fd=new FormData();
    fd.append("unit_code",sel.code);fd.append("unit_name",fName.trim());
    fd.append("leader_name",lSel?.full_name||lQ);fd.append("leader_email",lSel?.email||"");fd.append("level",String(sel.level));
    const r=await updateOrgUnit(fd);setFLoading(false);
    if(r.error){setFErr(r.error);return;}closeM();router.refresh();
  };
  const doAdd=async()=>{
    if(!sel||!fName.trim()){setFErr("Nama wajib diisi.");return;}
    setFLoading(true);setFErr("");
    const fd=new FormData();
    fd.append("parent_code",sel.code);fd.append("unit_name",fName.trim());
    fd.append("leader_name",lSel?.full_name||lQ);fd.append("leader_email",lSel?.email||"");
    const r=await addOrgUnit(fd);setFLoading(false);
    if(r.error){setFErr(r.error);return;}closeM();router.refresh();
  };
  const doDel=async()=>{
    if(!sel)return;setFLoading(true);setFErr("");
    const r=await deleteOrgUnit(sel.code);setFLoading(false);
    if(r.error){setFErr(r.error);return;}closeM();router.refresh();
  };

  /* ── card shorthand ───────────────────────────────────────────────────── */
  const C=(n:OrgUnit,w=160)=>(
    <Card node={n} w={w} onClick={()=>clickNode(n)} em={em}
      onEd={()=>openEd(n)} onAd={()=>openAd(n)} onDl={()=>openDl(n)}/>
  );

  /* ── Column builders ──────────────────────────────────────────────────── */

  // HR & GA:
  //   [HR & GA navy]
  //       │
  //   ├── Human Resources (blue) → Payroll, Recruitment and Development
  //   ├── General Affair (green) → Office Boy, Property, Office Driver
  //   ├── IT Application (green) → Help desk Staff
  //   └── Security (blue)        → Shift Leader, Personnell
  function HrGaCol({node}:{node:OrgUnit}) {
    const hr  = node.children.find(c=>c.name.toLowerCase().includes("human resources"));
    const ga  = node.children.find(c=>c.name.toLowerCase().includes("general affair"));
    const it  = node.children.find(c=>c.name.toLowerCase().includes("it application"));
    const sec = node.children.find(c=>c.name.toLowerCase().includes("security"));
    const grps = [hr,ga,it,sec].filter(Boolean) as OrgUnit[];
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        {C(node,175)}
        <V h={14}/><AD/>
        <RailList items={grps.map(g=>({node:g}))} parentW={152} leafW={130}
          em={em} onC={clickNode} onEd={openEd} onAd={openAd} onDl={openDl}/>
      </div>
    );
  }

  // Finance:
  //   [Finance navy]
  //       │
  //   [Finance, Accounting & Tax green]   ← single child, no rail
  //       │
  //   ┌───┴────────────────────┐
  //   │                        │
  // [Finance orange]    [Account Payable orange]
  //   │                        │
  // [Cashier orange]    [Account Receivable orange]
  function FinCol({node}:{node:OrgUnit}) {
    const fat = node.children[0]; // Finance, Accounting & Tax
    if(!fat) return <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>{C(node,175)}</div>;
    const fn2 = fat.children.find(c=>c.name.toLowerCase()==="finance"||c.name.toLowerCase().includes("keuangan"));
    const csh = fn2?.children[0];
    const ap  = fat.children.find(c=>c.name.toLowerCase().includes("payable"));
    const ar  = fat.children.find(c=>c.name.toLowerCase().includes("receivable"));

    // width of the two sub-columns + gap between them
    const LW = 112, RW = 118, GAP = 10;
    const totalW = LW + GAP + RW;
    // center of left col from left edge of totalW
    const lCx = LW / 2;
    const rCx = LW + GAP + RW / 2;

    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        {C(node,175)}
        <V h={12}/><AD/>
        {C(fat,totalW)}
        {/* Split: draw horizontal bar + two vertical stubs */}
        <div style={{position:"relative",width:totalW}}>
          {/* horizontal crossbar */}
          <svg width={totalW} height={20} style={{display:"block",overflow:"visible"}}>
            {/* vertical down from FAT center */}
            <line x1={totalW/2} y1={0} x2={totalW/2} y2={8} stroke={LC} strokeWidth={2}/>
            {/* horizontal bar */}
            <line x1={lCx} y1={8} x2={rCx} y2={8} stroke={LC} strokeWidth={2}/>
            {/* left stub down */}
            <line x1={lCx} y1={8} x2={lCx} y2={20} stroke={LC} strokeWidth={2}/>
            {/* right stub down */}
            <line x1={rCx} y1={8} x2={rCx} y2={20} stroke={LC} strokeWidth={2}/>
            {/* arrow left */}
            <polygon points={`${lCx-4},${14} ${lCx+4},${14} ${lCx},${20}`} fill={LC}/>
            {/* arrow right */}
            <polygon points={`${rCx-4},${14} ${rCx+4},${14} ${rCx},${20}`} fill={LC}/>
          </svg>
        </div>
        <div style={{display:"flex",flexDirection:"row",gap:GAP,alignItems:"flex-start"}}>
          {/* Left: Finance → Cashier */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:LW}}>
            {fn2&&<>{C(fn2,LW)}</>}
            {csh&&<><V h={8}/><AD/>{C(csh,LW)}</>}
          </div>
          {/* Right: AP → AR */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:RW}}>
            {ap&&<>{C(ap,RW)}</>}
            {ar&&<><V h={8}/><AD/>{C(ar,RW)}</>}
          </div>
        </div>
      </div>
    );
  }

  // Marketing:
  //   [Marketing navy]
  //       │
  //   ├── Project Appraisal (blue) → REGIONAL, Forwarder, PPJK, Warehouse, Project & Heavy Equipment
  //   ├── Sales (orange)
  //   ├── Staff Admin (orange)
  //   └── Media and Promotion (orange)
  function MktCol({node}:{node:OrgUnit}) {
    const pa    = node.children.find(c=>c.name.toLowerCase().includes("project appraisal"));
    const sales = node.children.find(c=>c.name.toLowerCase().includes("sales"));
    const sa    = node.children.find(c=>c.name.toLowerCase().includes("staff admin"));
    const media = node.children.find(c=>c.name.toLowerCase().includes("media"));
    const grps  = [pa,sales,sa,media].filter(Boolean) as OrgUnit[];
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        {C(node,175)}
        <V h={14}/><AD/>
        <RailList items={grps.map(g=>({node:g}))} parentW={152} leafW={132}
          em={em} onC={clickNode} onEd={openEd} onAd={openAd} onDl={openDl}/>
      </div>
    );
  }

  // Operational:
  //   [Operational navy]
  //       │
  //   ├── Vehicle Operations (green) → Driver
  //   ├── Operasional Alat Berat (green) → Operator
  //   ├── Operasional Plant (green) → Rigger
  //   ├── Traffic System (orange)
  //   └── Quality Control (green) → Service Advisor, Vehicle Registration, Equipment Control, Staff Admin
  function OpsCol({node}:{node:OrgUnit}) {
    const vo  = node.children.find(c=>c.name.toLowerCase().includes("vehicle operations")||c.name.toLowerCase().includes("vehicle ops"));
    const oab = node.children.find(c=>c.name.toLowerCase().includes("alat berat"));
    const op  = node.children.find(c=>{const n=c.name.toLowerCase();return (n.includes("operasional plant")||n==="plant")&&!n.includes("alat berat");});
    const ts  = node.children.find(c=>c.name.toLowerCase().includes("traffic"));
    const qc  = node.children.find(c=>c.name.toLowerCase().includes("quality control"));
    const grps = [vo,oab,op,ts,qc].filter(Boolean) as OrgUnit[];
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        {C(node,175)}
        <V h={14}/><AD/>
        <RailList items={grps.map(g=>({node:g}))} parentW={158} leafW={136}
          em={em} onC={clickNode} onEd={openEd} onAd={openAd} onDl={openDl}/>
      </div>
    );
  }

  // HSE: [HSE sky] → [Delivery Note Document Control navy] → [Staff orange]
  function HseCol({node}:{node:OrgUnit}) {
    const dn = node.children.find(c=>
      c.name.toLowerCase().includes("delivery")||c.name.toLowerCase().includes("document control"));
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        {C(node,178)}
        {dn&&(
          <><V h={12}/><AD/>
          {C(dn,175)}
          {dn.children.map(leaf=>(
            <React.Fragment key={leaf.id}>
              <V h={8}/><AD/>
              {C(leaf,120)}
            </React.Fragment>
          ))}
          </>
        )}
      </div>
    );
  }

  /* ── HBar: renders a horizontal line spanning a flex-row container ──────
     Works by rendering a real zero-height element with an absolutely-
     positioned line that only becomes visible because of overflow:visible  */
  function HBar({width}:{width:number}) {
    return (
      <div style={{position:"relative",width,height:2,flexShrink:0}}>
        <div style={{position:"absolute",top:0,left:0,right:0,bottom:0,background:LC}}/>
      </div>
    );
  }

  /* ── Chart ────────────────────────────────────────────────────────────── */
  function Chart() {
    if(!comm) return (
      <div style={{padding:40,color:"#94a3b8",fontSize:14}}>Data belum tersedia.</div>
    );

    // We lay out the chart as:
    //
    //  [Audit]──[Commissioner]
    //               │
    //           [Director]
    //               │
    //   ┌───────────┬──────────┬──────────┬──────────┐
    //   │           │          │          │          │
    // [Dep.Dir]  [Proc]      [MR]       [HSE]
    //   │
    //   ┌─────┬──────┬──────┐
    //   │     │      │      │
    // [HR] [Fin]  [Mkt]  [Ops]
    //
    // The horizontal bars are built with CSS position:absolute inside
    // a position:relative flex container. Each column has a paddingTop
    // equal to the stub height so the bar sits exactly at the top of
    // the padded area.

    const STUB = 22; // vertical stub from bar down to card top
    const COL_GAP = 20;

    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",paddingBottom:64,paddingTop:24,userSelect:"none"}}>

        {/* ── Row 0: Internal Audit ──── Commissioner ── */}
        <div style={{display:"flex",flexDirection:"row",alignItems:"center"}}>
          {audit&&(
            <div style={{display:"flex",flexDirection:"row",alignItems:"center"}}>
              {C(audit,148)}
              <svg width={48} height={16} style={{flexShrink:0,display:"block"}}>
                <line x1={0} y1={8} x2={42} y2={8} stroke={LC} strokeWidth={1.5} strokeDasharray="5,3"/>
                <polygon points="38,5 48,8 38,11" fill={LC}/>
              </svg>
            </div>
          )}
          {comm&&C(comm,188)}
        </div>

        {/* ── Stub: Commissioner → Director ── */}
        <V h={18}/><AD/>

        {/* ── Row 1: Director ── */}
        {dir&&C(dir,196)}

        {/* ── Stub: Director → top-level hub bar ── */}
        <V h={18}/>

        {/* ── Top-level hub: [Deputy+Divs] [Proc] [MR] [HSE] ── */}
        {/* We calculate the total width of this row so the bar spans it exactly */}
        <div style={{position:"relative",display:"flex",flexDirection:"row",gap:COL_GAP,alignItems:"flex-start"}}>
          {/* horizontal bar spanning full width */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:LC}}/>

          {/* ─── Col A: Deputy Director block ─── */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:1}}>
            <V h={STUB}/><AD/>
            {dep&&C(dep,185)}
            <V h={12}/>
            {/* 4-division hub */}
            <div style={{position:"relative",display:"flex",flexDirection:"row",gap:COL_GAP,alignItems:"flex-start"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:LC}}/>
              {([hrga,fin,mkt,ops] as (OrgUnit|undefined)[]).map((div,i)=>div&&(
                <div key={div.id} style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:1}}>
                  <V h={STUB}/><AD/>
                  {i===0&&<HrGaCol node={div}/>}
                  {i===1&&<FinCol node={div}/>}
                  {i===2&&<MktCol node={div}/>}
                  {i===3&&<OpsCol node={div}/>}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Col B: Procurement ─── */}
          {proc&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:1}}>
              <V h={STUB}/><AD/>
              {C(proc,185)}
            </div>
          )}

          {/* ─── Col C: Management Representative ─── */}
          {mr&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:1}}>
              <V h={STUB}/><AD/>
              {C(mr,185)}
            </div>
          )}

          {/* ─── Col D: HSE ─── */}
          {hse&&(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",position:"relative",zIndex:1}}>
              <V h={STUB}/><AD/>
              <HseCol node={hse}/>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── Modals (via portal) ──────────────────────────────────────────────── */
  function Portal({children}:{children:React.ReactNode}) {
    if(!mounted) return null;
    return createPortal(children, document.body);
  }

  function Backdrop({onClose,children}:{onClose:()=>void;children:React.ReactNode}) {
    return (
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[5vh]"
        onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"/>
        <motion.div initial={{scale:0.94,opacity:0,y:12}} animate={{scale:1,opacity:1,y:0}} exit={{scale:0.94,opacity:0,y:12}}
          transition={{type:"spring",stiffness:340,damping:30}}
          className="relative z-10 w-full max-w-lg"
          onClick={e=>e.stopPropagation()}>
          {children}
        </motion.div>
      </motion.div>
    );
  }

  function InfoModal() {
    if(!sel) return null;
    const emp=selEmp;
    const kind=getKind(sel);
    const s=KS[kind];
    const hdrBg=s.hdr??"bg-slate-700";
    const ini=(sel.leader_name||"?").split(" ").map((w:string)=>w[0]).join("").toUpperCase().slice(0,2);
    return (
      <Portal>
        <AnimatePresence>
          <Backdrop onClose={closeM}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* header banner */}
              <div className={`${hdrBg} px-6 py-5 relative`}>
                <button onClick={closeM}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white"/>
                </button>
                <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mb-1">{sel.name}</p>
                <h2 className="text-white font-black text-2xl leading-tight">{sel.leader_name||"Belum ditentukan"}</h2>
                {emp?.position&&<p className="text-white/75 text-sm mt-1">{emp.position}</p>}
              </div>

              {/* avatar + info */}
              <div className="px-6 pt-5 pb-6 space-y-3 max-h-[60vh] overflow-y-auto">
                {/* avatar row */}
                <div className="flex items-center gap-4 pb-3 border-b border-slate-100">
                  <div className={`w-16 h-16 rounded-2xl ${hdrBg} flex items-center justify-center text-white font-black text-2xl shadow`}>
                    {ini}
                  </div>
                  <div>
                    <p className="text-slate-800 font-black text-lg leading-tight">{sel.leader_name||"—"}</p>
                    <p className="text-slate-500 text-sm">{emp?.department||sel.name}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full uppercase tracking-wide">
                      Level {sel.level}
                    </span>
                  </div>
                </div>

                {emp ? (
                  <div className="grid grid-cols-1 gap-2.5">
                    <InfoRow icon={<Mail className="w-4 h-4"/>} label="Email" value={emp.email} color="sky"/>
                    <InfoRow icon={<Briefcase className="w-4 h-4"/>} label="Jabatan" value={emp.position||"—"} color="violet"/>
                    <InfoRow icon={<Building2 className="w-4 h-4"/>} label="Departemen" value={emp.department||"—"} color="emerald"/>
                    <InfoRow icon={<IdCard className="w-4 h-4"/>} label="ID Karyawan" value={emp.id} color="amber"/>
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-5 text-center">
                    {sel.leader_email?(
                      <>
                        <Mail className="w-6 h-6 text-slate-300 mx-auto mb-2"/>
                        <p className="text-slate-600 text-sm font-semibold">{sel.leader_email}</p>
                        <p className="text-slate-400 text-xs mt-1">Data karyawan tidak ditemukan di direktori.</p>
                      </>
                    ):(
                      <>
                        <User className="w-6 h-6 text-slate-300 mx-auto mb-2"/>
                        <p className="text-slate-400 text-sm">Pimpinan unit belum ditetapkan.</p>
                      </>
                    )}
                  </div>
                )}

                {/* unit info */}
                <div className="bg-slate-50 rounded-xl p-4 mt-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Info Unit</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><p className="text-[9px] text-slate-400">Nama Unit</p><p className="text-xs font-bold text-slate-700">{sel.name}</p></div>
                    <div><p className="text-[9px] text-slate-400">Kode</p><p className="text-xs font-bold text-slate-700 font-mono">{sel.code}</p></div>
                  </div>
                </div>

                {em&&(
                  <button onClick={()=>{closeM();openEd(sel);}}
                    className="w-full flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 rounded-xl py-3 text-sm font-bold transition-colors">
                    <Edit3 className="w-4 h-4"/> Edit Unit Ini
                  </button>
                )}
              </div>
            </div>
          </Backdrop>
        </AnimatePresence>
      </Portal>
    );
  }

  function InfoRow({icon,label,value,color}:{icon:React.ReactNode;label:string;value:string;color:string}) {
    const clr:{[k:string]:string}={
      sky:"bg-sky-50 text-sky-600",violet:"bg-violet-50 text-violet-600",
      emerald:"bg-emerald-50 text-emerald-600",amber:"bg-amber-50 text-amber-600",
    };
    return (
      <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${clr[color]||"bg-slate-100 text-slate-500"}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
        </div>
      </div>
    );
  }

  function EditModal() {
    const isAdd=modal==="add";
    return (
      <Portal>
        <AnimatePresence>
          <Backdrop onClose={closeM}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-slate-900 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isAdd?<PlusCircle className="w-5 h-5 text-emerald-400"/>:<Edit3 className="w-5 h-5 text-sky-400"/>}
                  <h3 className="text-white font-bold text-sm truncate max-w-xs">
                    {isAdd?`Tambah sub-unit ke "${sel?.name}"`:`Edit: ${sel?.name}`}
                  </h3>
                </div>
                <button onClick={closeM} className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white"/>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nama Unit <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={fName} onChange={e=>setFName(e.target.value)}
                    placeholder="Contoh: Human Resources"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-400/30 focus:border-sky-400 transition-all"/>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pimpinan Unit</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-sky-400/30 focus-within:border-sky-400 transition-all">
                      <User className="w-4 h-4 text-slate-400 shrink-0"/>
                      <input type="text" value={lQ} onChange={e=>{setLQ(e.target.value);setLSel(null);setShowDrop(true);}} onFocus={()=>setShowDrop(true)}
                        placeholder="Ketik nama atau email karyawan..."
                        className="flex-1 bg-transparent text-sm text-slate-800 font-medium focus:outline-none placeholder:text-slate-400"/>
                      {lSel&&<button onClick={()=>{setLSel(null);setLQ("");}}>
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500"/>
                      </button>}
                    </div>
                    <AnimatePresence>
                      {showDrop&&filtLeaders.length>0&&(
                        <motion.div initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                          className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                          {filtLeaders.map(e=>(
                            <button key={e.id} onClick={()=>{setLSel(e);setLQ(e.full_name);setShowDrop(false);}}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-sky-50 transition-colors text-left">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">{e.full_name[0]}</div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{e.full_name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{e.position} · {e.department}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {lSel&&<p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"/>{lSel.email}</p>}
                </div>
                {fErr&&<div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0"/><p className="text-red-600 text-sm">{fErr}</p></div>}
                <div className="flex gap-3">
                  <button onClick={closeM} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                  <button onClick={isAdd?doAdd:doEdit} disabled={fLoading}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
                    {fLoading?"Menyimpan...":"Simpan"}
                  </button>
                </div>
              </div>
            </div>
          </Backdrop>
        </AnimatePresence>
      </Portal>
    );
  }

  function DelModal() {
    return (
      <Portal>
        <AnimatePresence>
          <Backdrop onClose={closeM}>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-red-500 px-6 py-5 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Trash2 className="w-5 h-5 text-white"/></div>
                <div><h3 className="text-white font-black text-base">Hapus Unit?</h3><p className="text-red-100 text-xs">Tindakan ini tidak dapat diurungkan.</p></div>
                <button onClick={closeM} className="ml-auto w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"><X className="w-4 h-4 text-white"/></button>
              </div>
              <div className="p-6">
                <p className="text-slate-600 text-sm mb-1">Anda akan menghapus unit <span className="font-black text-slate-900">"{sel?.name}"</span> beserta semua sub-unitnya secara permanen.</p>
                {fErr&&<div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mt-3"><AlertTriangle className="w-4 h-4 text-red-500 shrink-0"/><p className="text-red-600 text-sm">{fErr}</p></div>}
                <div className="flex gap-3 mt-5">
                  <button onClick={closeM} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">Batal</button>
                  <button onClick={doDel} disabled={fLoading} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">{fLoading?"Menghapus...":"Ya, Hapus"}</button>
                </div>
              </div>
            </div>
          </Backdrop>
        </AnimatePresence>
      </Portal>
    );
  }

  /* ── Directory helpers ────────────────────────────────────────────────── */
  function DeptIcon({name}:{name:string}) {
    const l=name.toLowerCase();
    if(l.includes("hr")||l.includes("human")) return <Users className="w-4 h-4 text-emerald-600"/>;
    if(l.includes("finance")||l.includes("account")) return <DollarSign className="w-4 h-4 text-amber-600"/>;
    if(l.includes("marketing")||l.includes("sales")) return <TrendingUp className="w-4 h-4 text-indigo-600"/>;
    if(l.includes("operat")) return <Truck className="w-4 h-4 text-blue-600"/>;
    if(l.includes("procure")) return <Settings className="w-4 h-4 text-cyan-600"/>;
    if(l.includes("safety")||l.includes("hse")) return <ShieldCheck className="w-4 h-4 text-rose-600"/>;
    if(l.includes("doc")||l.includes("delivery")) return <FileText className="w-4 h-4 text-teal-600"/>;
    return <Building2 className="w-4 h-4 text-slate-500"/>;
  }

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm print:hidden">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl self-start">
          {(["visual","employees"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab===t?"bg-white text-slate-900 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>
              {t==="visual"?<><Activity className="w-3.5 h-3.5"/>Bagan Struktur</>:<><Users className="w-3.5 h-3.5"/>Direktori ({employees.length})</>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <span className={`text-xs font-bold ${em?"text-sky-600":"text-slate-500"}`}>{em?"Edit Aktif":"Mode Edit"}</span>
            <button onClick={()=>setEm(v=>!v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${em?"bg-sky-500":"bg-slate-300"}`}>
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${em?"translate-x-4":"translate-x-0.5"}`}/>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportPNG} disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
              <ImageIcon className="w-3.5 h-3.5"/>PNG
            </button>
            <button onClick={handleExportPDF} disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#004A8F] hover:bg-[#003870] text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
              <FileText className="w-3.5 h-3.5"/>PDF
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab==="visual" ? (
          <motion.div key="v" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            {em&&(
              <div className="mb-3 flex items-center gap-2 bg-sky-50 border border-sky-200 text-sky-700 rounded-xl px-4 py-2.5 text-xs font-bold">
                <Edit3 className="w-3.5 h-3.5"/>Mode Edit Aktif — hover di atas node untuk opsi Edit / Tambah / Hapus
              </div>
            )}
            {/* Fixed chart area — scrollable, not draggable */}
            <div className="w-full overflow-auto bg-slate-50 border border-slate-200 rounded-2xl"
              style={{maxHeight:"calc(100vh - 260px)"}}>
              <div className="p-6" style={{minWidth:"max-content"}} ref={chartInnerRef}>
                <Chart/>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="e" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
            transition={{duration:0.2}} className="space-y-4 max-w-4xl mx-auto">
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
              <input type="text" placeholder="Cari nama, jabatan, atau divisi..." value={q}
                onChange={e=>setQ(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400 transition-all text-slate-800"/>
            </div>
            <div className="space-y-2.5">
              {q.trim() ? (
                srch.length>0 ? srch.map(item=>(
                  <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {item.path.slice(0,-1).map((p,i)=>(
                          <span key={i} className="flex items-center gap-0.5">{p}<ChevronRight className="w-2.5 h-2.5"/></span>
                        ))}
                        <span className="text-red-500 font-extrabold">{item.path[item.path.length-1]}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">{item.name}</h4>
                    </div>
                    {item.leader&&(
                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">{item.leader[0]}</div>
                        <div><p className="text-xs font-bold text-slate-700">{item.leader}</p>{item.email&&<p className="text-[10px] text-slate-400">{item.email}</p>}</div>
                      </div>
                    )}
                  </div>
                )):(
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-10 text-center text-slate-400 text-sm">Tidak ada hasil ditemukan.</div>
                )
              ):(
                <div className="space-y-3">
                  {Object.keys(deptMap).map(dept=>(
                    <div key={dept} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                      <h4 className="font-black text-slate-800 text-xs border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                        <DeptIcon name={dept}/>{dept}
                        <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-2 py-0.5 rounded-full ml-auto">{deptMap[dept].length} orang</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {deptMap[dept].map(e=>(
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

      {/* Modals */}
      {mounted&&modal==="info"&&sel&&<InfoModal/>}
      {mounted&&(modal==="edit"||modal==="add")&&sel&&<EditModal/>}
      {mounted&&modal==="del"&&sel&&<DelModal/>}
    </div>
  );
}
