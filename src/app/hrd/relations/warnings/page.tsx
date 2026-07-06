import { supabaseAdmin } from "@/lib/supabase";
import { AlertTriangle, FileText } from "lucide-react";
import IssueWarningButton from "@/components/IssueWarningButton";
import { expireOldWarnings } from "@/app/actions/employee";
import WarningsTable from "./WarningsTable";

export const dynamic = "force-dynamic";

export default async function SuratPeringatan() {
  await expireOldWarnings();

  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, email, kode, department, position")
    .neq("email", "superadmin@ptpgp.co.id")
    .neq("status", "Resigned")
    .order("full_name");

  let warnings: Record<string, unknown>[] = [];
  const { data: allWarnings, error: warnError } = await supabaseAdmin
    .from("warnings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (warnError && !warnError.message.includes("Could not find the table")) {
    warnings = [];
  } else {
    warnings = allWarnings || [];
  }

  const sp1Active = warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP1" && w.status === "Aktif").length;
  const sp2Active = warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP2" && w.status === "Aktif").length;
  const sp3Active = warnings.filter((w: Record<string, unknown>) => w.sp_level === "SP3" && w.status === "Aktif").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Surat Peringatan</h1>
          <p className="text-sm text-gray-500">Kelola surat peringatan dan riwayat pelanggaran karyawan.</p>
        </div>
        <IssueWarningButton employees={(employees || []).map((e: Record<string, unknown>) => ({
          id: e.id as string,
          full_name: e.full_name as string,
          email: e.email as string,
          department: e.department as string,
          position: e.position as string,
        }))} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP1 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{sp1Active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP2 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{sp2Active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl"><AlertTriangle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SP3 Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">{sp3Active}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><FileText size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total SP</p>
              <p className="text-xl font-extrabold text-slate-800">{warnings.length}</p>
            </div>
          </div>
        </div>
      </div>

      <WarningsTable warnings={warnings as Array<{
        id: string;
        employee_name: string;
        employee_email: string;
        sp_level: string;
        reason: string;
        status: string;
        created_at: string | null;
        valid_until: string | null;
        issued_by: string | null;
      }>} />
    </div>
  );
}
