import { supabaseAdmin } from "@/lib/supabase";
import { requireRole, requireAuth } from "@/lib/auth-guard";
import { Wallet, DollarSign, Percent, Calculator } from "lucide-react";
import PayrollClient from "../../payroll/PayrollClient";
import HubTabs from "@/components/hrd/HubTabs";
import SalaryPage from "../salary/page";
import KomponenGajiPage from "../komponen-gaji/page";
import RewardFormulaPage from "../formula/page";
import { safeTab } from "@/lib/hub-safe";

export const dynamic = "force-dynamic";
async function PayrollTabContent() {
  const { role: currentRole } = await requireAuth();
  const [{ data: payrolls }, { data: employees }, { count: totalEmployees }] = await Promise.all([
    supabaseAdmin.from("penggajian").select("*, karyawan!inner(full_name, department, position)").order("year", { ascending: false }).order("month", { ascending: false }).limit(50),
    supabaseAdmin.from("karyawan").select("id, full_name, department, position").neq("status", "Resigned").order("full_name"),
    supabaseAdmin.from("karyawan").select("*", { count: "exact", head: true }),
  ]);

  // "Export Transfer Bank" — Approved payroll (Direktur sudah setujui,
  // menunggu dibayar) is the actual input Finance needs for a bank transfer
  // batch. Bank details live in data_pribadi_karyawan (keyed by email), not
  // on karyawan/penggajian — see 20260818003_karyawan_payroll_master_data.sql.
  const { data: approvedPayrolls } = await supabaseAdmin
    .from("penggajian")
    .select("net_salary, karyawan!inner(full_name, email)")
    .eq("status", "Approved");
  const approvedRows = (approvedPayrolls || []) as unknown as { net_salary: number; karyawan: { full_name: string; email: string } | { full_name: string; email: string }[] | null }[];
  const emails = approvedRows.map((r) => (Array.isArray(r.karyawan) ? r.karyawan[0] : r.karyawan)?.email).filter((e): e is string => !!e);
  const { data: bankRows } = emails.length > 0
    ? await supabaseAdmin.from("data_pribadi_karyawan").select("email, bank_name, bank_account_number, bank_account_holder").in("email", emails)
    : { data: [] };
  const bankByEmail = new Map(((bankRows || []) as { email: string; bank_name: string | null; bank_account_number: string | null; bank_account_holder: string | null }[]).map((b) => [b.email, b]));
  const bankTransferRows = approvedRows.map((r) => {
    const karyawan = Array.isArray(r.karyawan) ? r.karyawan[0] : r.karyawan;
    const bank = karyawan?.email ? bankByEmail.get(karyawan.email) : undefined;
    return {
      "Nama Karyawan": karyawan?.full_name || "-",
      Bank: bank?.bank_name || "BELUM DIISI",
      "Nomor Rekening": bank?.bank_account_number || "BELUM DIISI",
      "Nama Pemilik Rekening": bank?.bank_account_holder || karyawan?.full_name || "-",
      "Jumlah Transfer": Number(r.net_salary) || 0,
    };
  });

  return (
    <PayrollClient
      payrolls={(payrolls || []) as Record<string, unknown>[]}
      employees={(employees || []) as { id: string; full_name: string; department: string; position: string }[]}
      totalEmployees={totalEmployees || 0}
      bankTransferRows={bankTransferRows}
      currentRole={currentRole}
    />
  );
}

// Hub page for "Payroll & Komponen Gaji" — merges the former separate
// /hrd/rewards/payroll, /salary, /komponen-gaji and /formula routes into one
// page with tabs (see src/components/hrd/HubTabs.tsx). Each tab reuses the
// original page's Server Component output untouched; the original route
// files remain intact for anyone navigating to them directly.
export default async function PayrollPage() {
  await requireRole("hrd", "superadmin", "director");
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
