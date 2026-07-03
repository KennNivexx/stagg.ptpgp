import { supabaseAdmin } from "@/lib/supabase";
import PositionsClient from "./PositionsClient";
import type { Employee } from "@/types/org";

// Data jabatan diturunkan langsung dari struktur organisasi & karyawan —
// harus selalu mencerminkan data terbaru, jangan cache statis.
export const dynamic = "force-dynamic";

export default async function Jabatan() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, email, department, position")
    .neq("status", "Inactive")
    .order("full_name");

  const { data: departments } = await supabaseAdmin
    .from("departments")
    .select("name")
    .order("name");
  const deptList = (departments || []).map((d: Record<string, unknown>) => d.name as string);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Jabatan</h1>
        <p className="text-sm text-gray-500">Pantau seluruh jabatan dalam organisasi secara langsung dari struktur organisasi dan data karyawan. Klik jabatan untuk melihat pemegang jabatan dan kepala departemennya.</p>
      </div>

      <PositionsClient
        departments={deptList}
        employees={(employees || []) as Employee[]}
      />
    </div>
  );
}
