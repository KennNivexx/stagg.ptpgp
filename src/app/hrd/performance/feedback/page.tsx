import { supabaseAdmin } from "@/lib/supabase";
import { getFeedbackHistory } from "@/app/actions/performance-hrd";
import FeedbackClient from "./FeedbackClient";

export default async function FeedbackPage() {
  const [{ data: employees }, history] = await Promise.all([
    supabaseAdmin.from("employees").select("id, full_name, kode, department, position").neq("id", "__settings__").neq("email", "superadmin@ptpgp.co.id").order("full_name").limit(100),
    getFeedbackHistory().catch(() => []),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Umpan Balik 360<span className="align-super text-xs">o</span></h1>
        <p className="text-sm text-gray-500">Berikan dan kelola umpan balik kinerja dari berbagai sudut pandang.</p>
      </div>
      <FeedbackClient
        employees={(employees || []) as Array<{ id: string; full_name: string; department: string; }>}
        initialHistory={history as Parameters<typeof FeedbackClient>[0]["initialHistory"]}
      />
    </div>
  );
}
