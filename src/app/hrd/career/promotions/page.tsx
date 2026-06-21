import { supabaseAdmin } from "@/lib/supabase";
import PromotionsClient from "./PromotionsClient";

export default async function PromotionsPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  let promotions: Array<Record<string, unknown>> = [];
  const { data, error } = await supabaseAdmin
    .from("career_promotions")
    .select("*, employees(full_name, department, position)")
    .order("created_at", { ascending: false });
  if (!error || (error as unknown as Record<string, unknown>)?.code !== "42P01") {
    promotions = data || [];
  }

  return (
    <PromotionsClient
      employees={employees || []}
      initialPromotions={promotions}
    />
  );
}
