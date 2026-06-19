import { supabaseAdmin } from "@/lib/supabase";
import HireForm from "./HireForm";

export default async function HirePage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const { data: job } = await supabaseAdmin.from("job_postings").select("*").eq("id", jobId).maybeSingle();
  if (!job) return <div className="p-8 text-center text-slate-500">Lowongan tidak ditemukan.</div>;
  return <HireForm jobPosting={job} />;
}
