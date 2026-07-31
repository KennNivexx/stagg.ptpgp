import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
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
  request_type?: string;
  need_by_date?: string;
  rejection_reason?: string;
  finance_required?: boolean;
  finance_approved?: boolean;
  cancel_reason?: string;
}

export default async function DirectorRequestsPage() {
  await requireRole("director", "superadmin");
  const { data } = await supabaseAdmin
    .from("permintaan_sdm")
    .select("*")
    .order("created_at", { ascending: false });

  const requests = (data || []) as DirectorRequest[];

  return <DirectorRequestsClient requests={requests} />;
}
