import { supabaseAdmin } from "@/lib/supabase";
import { getResignations } from "@/app/actions/relations";
import ResignationsClient from "./ResignationsClient";

export default async function PengunduranDiri() {
  const [{ data: activeEmployees }, { count: resignedCount }, resignations] = await Promise.all([
    supabaseAdmin.from("employees").select("id, full_name, department, position").neq("status", "Resigned").neq("id", "__settings__").order("full_name").limit(200),
    supabaseAdmin.from("employees").select("*", { count: "exact", head: true }).eq("status", "Resigned"),
    getResignations().catch(() => []),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengunduran Diri</h1>
        <p className="text-sm text-gray-500">Kelola proses pengunduran diri, exit interview, dan clearance checklist.</p>
      </div>
      <ResignationsClient
        activeEmployees={(activeEmployees || []) as Array<{ id: string; full_name: string; department: string; position: string; }>}
        initialResignations={resignations as Parameters<typeof ResignationsClient>[0]["initialResignations"]}
        resignedCount={resignedCount || 0}
      />
    </div>
  );
}
