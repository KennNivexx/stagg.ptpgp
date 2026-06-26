import { supabaseAdmin } from "@/lib/supabase";
import { getAwards } from "@/app/actions/rewards";
import AwardsClient from "./AwardsClient";

export default async function AwardsPage() {
  const [{ data: employees }, awards] = await Promise.all([
    supabaseAdmin.from("employees").select("id, full_name, department, position").neq("id", "__settings__").order("full_name").limit(200),
    getAwards().catch(() => []),
  ]);

  return (
    <AwardsClient
      employees={(employees || []) as Array<{ id: string; full_name: string; department: string; }>}
      initialAwards={awards as Parameters<typeof AwardsClient>[0]["initialAwards"]}
    />
  );
}
