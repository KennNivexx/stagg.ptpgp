import { supabaseAdmin } from "@/lib/supabase";
import { getSalaryReviews, getMeritMatrix } from "@/app/actions/rewards";
import SalaryReviewClient from "./SalaryReviewClient";

export default async function SalaryReviewPage() {
  const [{ data: employees }, { data: grades }, reviews, meritMatrix] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, department, position").neq("status", "Inactive").order("full_name").limit(200),
    supabaseAdmin.from("grade_jabatan").select("id, kode, nama").order("urutan"),
    getSalaryReviews().catch(() => []),
    getMeritMatrix().catch(() => []),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Salary Review</h1>
        <p className="text-sm text-gray-500">Merit Increase, Grade Adjustment, Promotion Adjustment, dan Market Adjustment — dengan rekomendasi otomatis dari Merit Matrix.</p>
      </div>
      <SalaryReviewClient
        employees={(employees || []) as Array<{ id: string; full_name: string; department: string; position: string }>}
        grades={(grades || []) as Array<{ id: string; kode: string; nama: string }>}
        reviews={reviews as Array<Record<string, unknown>>}
        meritMatrix={meritMatrix as Array<Record<string, unknown>>}
      />
    </div>
  );
}
