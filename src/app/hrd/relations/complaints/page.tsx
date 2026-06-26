import { supabaseAdmin } from "@/lib/supabase";
import { getComplaints } from "@/app/actions/relations";
import ComplaintsClient from "./ComplaintsClient";

export default async function KeluhanKaryawan() {
  const [{ data: employees }, complaints] = await Promise.all([
    supabaseAdmin.from("employees").select("id, full_name, department").neq("id", "__settings__").order("full_name").limit(200),
    getComplaints().catch(() => []),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Keluhan Karyawan</h1>
        <p className="text-sm text-gray-500">Kelola pengaduan dan keluhan karyawan secara profesional dan rahasia.</p>
      </div>
      <ComplaintsClient
        employees={(employees || []) as Array<{ id: string; full_name: string; department: string; }>}
        initialComplaints={complaints as Parameters<typeof ComplaintsClient>[0]["initialComplaints"]}
      />
    </div>
  );
}
