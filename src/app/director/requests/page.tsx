import { supabaseAdmin } from "@/lib/supabase";
import DirectorRequestsClient from "./DirectorRequestsClient";

export interface DirectorRequest {
  id: string;
  department: string;
  position: string;
  quantity: number;
  reason: string;
  urgency: string;
  status: string;
  requested_by: string;
  created_at: string;
}

export default async function DirectorRequestsPage() {
  const { data } = await supabaseAdmin
    .from("workforce_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const requests = (data || []) as DirectorRequest[];

  return <DirectorRequestsClient requests={requests} />;
}
