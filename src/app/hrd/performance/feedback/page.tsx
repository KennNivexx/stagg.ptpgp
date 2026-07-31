import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { getFeedbackHistory, getBudayaPerusahaan } from "@/app/actions/performance-hrd";
import FeedbackClient from "./FeedbackClient";

export default async function FeedbackPage() {
  await requireRole("hrd", "superadmin", "department_manager");
  const [{ data: employees }, history, budaya] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, kode, department, position").neq("email", "__settings__@ptpgp.co.id").order("full_name").limit(100),
    getFeedbackHistory().catch(() => []),
    getBudayaPerusahaan().catch(() => []),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Umpan Balik 360<span className="align-super text-xs">o</span></h1>
        <p className="text-sm text-gray-500">Berikan dan kelola umpan balik kinerja dari berbagai sudut pandang.</p>
      </div>
      <FeedbackClient
        employees={(employees || []) as Array<{ id: string; full_name: string; kode?: string; department: string; }>}
        initialHistory={history as Parameters<typeof FeedbackClient>[0]["initialHistory"]}
        budayaList={budaya as Array<{ id: string; nama: string }>}
      />
    </div>
  );
}
