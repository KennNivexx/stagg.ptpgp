import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import HireForm from "./HireForm";

export default async function HirePage({ params }: { params: Promise<{ jobId: string }> }) {
  await requireRole("hrd", "superadmin");
  const { jobId } = await params;
  const { data: job } = await supabaseAdmin.from("lowongan_kerja").select("*").eq("id", jobId).maybeSingle();
  if (!job) return <div className="p-8 text-center text-slate-500">Lowongan tidak ditemukan.</div>;
  return <HireForm jobPosting={job} />;
}
