import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { Download, FileText, DollarSign, Eye } from "lucide-react";

export default async function EmployeePayroll() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "";
  const userName = cookieStore.get("user_name")?.value || "";

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const employeeId = employee?.id;

  const { data: payslips } = employeeId ? await supabaseAdmin
    .from("payroll")
    .select("*")
    .eq("employee_id", employeeId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(12) : { data: [] };

  const monthNames = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Payroll & Payslips</h1>
        <p className="text-sm text-gray-500">Unduh dan lihat riwayat slip gaji bulanan Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!payslips || payslips.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <FileText size={40} className="mx-auto text-slate-300 mb-4" />
              <p className="text-sm text-slate-500">Belum ada slip gaji tersedia.</p>
              <p className="text-xs text-slate-400 mt-1">Slip gaji akan muncul setelah diproses oleh HRD.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payslips.map((slip: Record<string, unknown>) => (
                <div key={slip.id as string} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">
                          {monthNames[Number(slip.month)] || "-"} {String(slip.year || "")}
                        </h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span>Gaji Pokok: <span className="font-semibold text-slate-700">Rp {(Number(slip.basic_salary) || 0).toLocaleString("id-ID")}</span></span>
                          <span>Tunjangan: <span className="font-semibold text-emerald-600">Rp {(Number(slip.allowances) || 0).toLocaleString("id-ID")}</span></span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            slip.status === "Paid" ? "bg-emerald-50 text-emerald-700" :
                            slip.status === "Approved" ? "bg-blue-50 text-blue-700" :
                            "bg-amber-50 text-amber-700"
                          }`}>
                            {slip.status === "Draft" ? "Draft" : slip.status === "Paid" ? "Dibayar" : slip.status as string}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-slate-800">
                        Rp {(Number(slip.net_salary) || 0).toLocaleString("id-ID")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Total Bersih</p>
                      <div className="flex gap-2 mt-3">
                        <button className="px-3 py-1.5 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1">
                          <Eye size={11} /> Lihat
                        </button>
                        <button className="px-3 py-1.5 text-[10px] font-bold bg-[#0F172A] text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1">
                          <Download size={11} /> Unduh PDF
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Info Karyawan</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama</span>
                <span className="font-bold text-slate-800">{userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Departemen</span>
                <span className="font-bold text-slate-800">{employee?.department || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jabatan</span>
                <span className="font-bold text-slate-800">{employee?.position || "-"}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0F172A] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2">Ringkasan Tahun Ini</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Diterima</span>
                <span className="font-bold">
                  Rp {(payslips?.reduce((sum: number, s: Record<string, unknown>) => sum + (Number(s.net_salary) || 0), 0) || 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slip Tersedia</span>
                <span className="font-bold">{payslips?.length || 0} bulan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
