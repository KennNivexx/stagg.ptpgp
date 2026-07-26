import { supabaseAdmin } from "@/lib/supabase";
import { Wallet, DollarSign, Percent, Calculator } from "lucide-react";
import PayrollClient from "../../payroll/PayrollClient";
import HubTabs from "@/components/hrd/HubTabs";
import SalaryPage from "../salary/page";
import KomponenGajiPage from "../komponen-gaji/page";
import RewardFormulaPage from "../formula/page";
import { safeTab } from "@/lib/hub-safe";

export const dynamic = "force-dynamic";
async function PayrollTabContent() {
  const [{ data: payrolls }, { data: employees }, { count: totalEmployees }] = await Promise.all([
    supabaseAdmin.from("penggajian").select("*, karyawan!inner(full_name, department, position)").order("year", { ascending: false }).order("month", { ascending: false }).limit(50),
    supabaseAdmin.from("karyawan").select("id, full_name, department, position").neq("status", "Resigned").order("full_name"),
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }),
  ]);

  return (
    <PayrollClient
      payrolls={(payrolls || []) as Record<string, unknown>[]}
      employees={(employees || []) as { id: string; full_name: string; department: string; position: string }[]}
      totalEmployees={totalEmployees || 0}
    />
  );
}

// Hub page for "Payroll & Komponen Gaji" — merges the former separate
// /hrd/rewards/payroll, /salary, /komponen-gaji and /formula routes into one
// page with tabs (see src/components/hrd/HubTabs.tsx). Each tab reuses the
// original page's Server Component output untouched; the original route
// files remain intact for anyone navigating to them directly.
export default async function PayrollPage() {
  const [payrollContent, salaryContent, komponenGajiContent, formulaContent] = await Promise.all([
    safeTab(() => PayrollTabContent(), "Payroll"),
    safeTab(() => SalaryPage(), "Komponen Gaji"),
    safeTab(() => KomponenGajiPage(), "Jenis Tunjangan & Potongan"),
    safeTab(() => RewardFormulaPage(), "Formula Reward"),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <HubTabs
        tabs={[
          { id: "payroll", label: "Payroll", icon: <Wallet size={14} />, content: payrollContent },
          { id: "salary", label: "Komponen Gaji", icon: <DollarSign size={14} />, content: salaryContent },
          { id: "komponen-gaji", label: "Jenis Tunjangan & Potongan", icon: <Percent size={14} />, content: komponenGajiContent },
          { id: "formula", label: "Formula Reward", icon: <Calculator size={14} />, content: formulaContent },
        ]}
        defaultTab="payroll"
      />
    </div>
  );
}
