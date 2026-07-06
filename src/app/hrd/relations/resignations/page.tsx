import { supabaseAdmin } from "@/lib/supabase";
import { getResignations } from "@/app/actions/relations";
import ResignationsClient from "./ResignationsClient";

export default async function PengunduranDiri() {
  const [{ count: resignedCount }, resignations] = await Promise.all([
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
        initialResignations={resignations as Parameters<typeof ResignationsClient>[0]["initialResignations"]}
        resignedCount={resignedCount || 0}
      />
    </div>
  );
}
