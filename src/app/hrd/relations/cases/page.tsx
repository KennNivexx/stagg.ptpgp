import {
  ClipboardList, MessageSquare, Scale, ShieldAlert, AlertTriangle, Eye, Search,
  ClipboardCheck, FileWarning, Handshake, Users, Gavel, Split, Building2, ShieldCheck,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { getCases, getCaseCategories } from "@/app/actions/employee-relations";
import CaseClient from "@/components/hrd/CaseClient";
import HubTabs, { type HubTab } from "@/components/hrd/HubTabs";

export const dynamic = "force-dynamic";
// Merged hub: this route ("/hrd/relations/cases") used to render only
// "Semua Kasus". It now composes that same content as the default tab
// alongside 16 other Employee Relations pages so the top nav can link to a
// single page instead of 17. None of the original page.tsx files below were
// modified or deleted — they remain fully functional standalone routes,
// just no longer linked from top nav (per src/lib/hrd-menu.ts, untouched).
import ComplaintsPage from "../complaints/page";
import GrievancePage from "./grievance/page";
import EthicsPage from "./ethics/page";
import FraudPage from "./fraud/page";
import HarassmentPage from "./harassment/page";
import WhistleblowingPage from "./whistleblowing/page";
import InvestigationPage from "./investigation/page";
import CorrectiveActionPage from "./corrective-action/page";
import WarningsPage from "../warnings/page";
import UnionPage from "../industrial/union/page";
import BipartitePage from "../industrial/bipartite/page";
import TripartitePage from "../industrial/tripartite/page";
import MediationPage from "../industrial/mediation/page";
import DisputePage from "../industrial/dispute/page";
import PhiPage from "../industrial/phi/page";
import IndustrialCompliancePage from "../industrial/compliance/page";

// The original "Semua Kasus" (AllCasesPage) content, inlined as the default
// tab's data-fetch + render — unchanged logic, just no longer its own
// exported component.
async function AllCasesTabContent() {
  const [rows, categories, { data: employees }] = await Promise.all([
    getCases(),
    getCaseCategories(),
    supabaseAdmin.from("karyawan").select("id, full_name, kode_jabatan, nik, department, position").neq("status", "Inactive").order("full_name"),
  ]);
  return (
    <CaseClient
      type={null} title="Semua Kasus" description="Seluruh kasus hubungan karyawan lintas jenis."
      initialRows={rows as never} categories={categories as never} employees={employees || []} showTypeColumn
    />
  );
}

export default async function CaseManagementHub() {
  const tabs: HubTab[] = [
    { id: "all", label: "Semua Kasus", icon: <ClipboardList size={14} />, content: await AllCasesTabContent() },
    { id: "complaints", label: "Complaints", icon: <MessageSquare size={14} />, content: await ComplaintsPage() },
    { id: "grievance", label: "Grievance", icon: <Scale size={14} />, content: await GrievancePage() },
    { id: "ethics", label: "Ethics Violation", icon: <ShieldAlert size={14} />, content: await EthicsPage() },
    { id: "fraud", label: "Fraud", icon: <AlertTriangle size={14} />, content: await FraudPage() },
    { id: "harassment", label: "Harassment", icon: <Eye size={14} />, content: await HarassmentPage() },
    { id: "whistleblowing", label: "Whistleblowing", icon: <Search size={14} />, content: await WhistleblowingPage() },
    { id: "investigation", label: "Investigation", icon: <Search size={14} />, content: await InvestigationPage() },
    { id: "corrective-action", label: "Corrective Action", icon: <ClipboardCheck size={14} />, content: await CorrectiveActionPage() },
    { id: "warnings", label: "Surat Peringatan", icon: <FileWarning size={14} />, content: await WarningsPage() },
    { id: "union", label: "Labour Union", icon: <Users size={14} />, content: await UnionPage() },
    { id: "bipartite", label: "Bipartite Meeting", icon: <Handshake size={14} />, content: await BipartitePage() },
    { id: "tripartite", label: "Tripartite Meeting", icon: <Gavel size={14} />, content: await TripartitePage() },
    { id: "mediation", label: "Mediation", icon: <Handshake size={14} />, content: await MediationPage() },
    { id: "dispute", label: "Dispute", icon: <Split size={14} />, content: await DisputePage() },
    { id: "phi", label: "PHI (Perselisihan Hubungan Industrial)", icon: <Building2 size={14} />, content: await PhiPage() },
    { id: "compliance", label: "Industrial Compliance", icon: <ShieldCheck size={14} />, content: await IndustrialCompliancePage() },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Case Management</h1>
        <p className="text-sm text-gray-500">
          Kasus hubungan karyawan, surat peringatan, dan hubungan industrial dalam satu tempat.
        </p>
      </div>
      <HubTabs tabs={tabs} defaultTab="all" />
    </div>
  );
}
