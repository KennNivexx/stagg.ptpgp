import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { User, Mail, Phone, Building, Briefcase, Calendar, ShieldCheck, Save, MapPin } from "lucide-react";

export default async function EmployeeProfile() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "";
  const userName = cookieStore.get("user_name")?.value || "Karyawan";

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("full_name, email, phone, address, department, position, join_date, status")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const initials = (employee?.full_name || userName)
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Profil Saya</h1>
        <p className="text-sm text-gray-500">Informasi pribadi dan kepegawaian Anda yang tercatat di sistem.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
          <div className="h-24 w-24 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-extrabold shadow-md mb-4">
            {initials}
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">{employee?.full_name || userName}</h2>
          <p className="text-xs text-slate-500 mt-1">{employee?.position || "-"}</p>
          <span className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold ${
            employee?.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}>
            {employee?.status || "Active"}
          </span>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Informasi Pribadi</h3>
              <p className="text-xs text-slate-400 mt-0.5">Data diri Anda yang tercatat di sistem</p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DetailItem icon={User} label="Nama Lengkap" value={employee?.full_name || userName} />
              <DetailItem icon={Mail} label="Email" value={employee?.email || userEmail} />
              <DetailItem icon={Phone} label="Telepon" value={employee?.phone || "-"} />
              <DetailItem icon={MapPin} label="Alamat" value={employee?.address || "-"} />
              <DetailItem icon={Building} label="Departemen" value={employee?.department || "-"} />
              <DetailItem icon={Briefcase} label="Jabatan" value={employee?.position || "-"} />
              <DetailItem icon={Calendar} label="Tanggal Masuk" value={formatDate(employee?.join_date as string)} />
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30 rounded-b-2xl">
              <div className="flex items-center gap-3 text-xs text-slate-600">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Data departemen, jabatan, dan status hanya dapat diubah oleh Administrator HRD.</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <User size={16} className="text-[#CC0000]" />
                Edit Profil
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Perbarui informasi kontak dan data pribadi Anda</p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                <input
                  type="text"
                  defaultValue={employee?.full_name || userName}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telepon</label>
                <input
                  type="text"
                  defaultValue={employee?.phone || ""}
                  placeholder="08123456789"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat</label>
                <textarea
                  rows={3}
                  defaultValue={employee?.address || ""}
                  placeholder="Alamat lengkap Anda"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
                  <Save size={14} /> Simpan Perubahan
                </button>
                <button className="px-6 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
