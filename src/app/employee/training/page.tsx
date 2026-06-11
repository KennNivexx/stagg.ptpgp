import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { GraduationCap, Calendar, Award, BookOpen, Clock, MapPin, CheckCircle } from "lucide-react";

export default async function EmployeeTraining() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("user_email")?.value || "";
  const userName = cookieStore.get("user_name")?.value || "Karyawan";

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, department, position")
    .eq("email", userEmail)
    .limit(1)
    .single();

  const myTrainings = [
    { id: 1, title: "Pelatihan Keselamatan Kerja (K3)", type: "Wajib", status: "Selesai", date: "15 Mei 2026", provider: "Internal HSE", certificate: true },
    { id: 2, title: "Supply Chain Management Dasar", type: "Teknis", status: "Sedang Berjalan", date: "01 Jun - 30 Jun 2026", provider: "Lembaga Logistik Indonesia", certificate: false },
    { id: 3, title: "Leadership & Supervisory Skills", type: "Soft Skill", status: "Terjadwal", date: "15 Jul 2026", provider: "HRD Internal", certificate: true },
    { id: 4, title: "Pengoperasian Sistem HRIS Lanjutan", type: "Teknis", status: "Selesai", date: "10 Mei 2026", provider: "Tim IT", certificate: true },
  ];

  const upcomingTrainings = [
    { id: 1, title: "Manajemen Risiko Operasional", date: "20 Jul 2026", time: "09:00 - 16:00 WIB", location: "Ruang Training Lt. 2", provider: "Konsultan Eksternal" },
    { id: 2, title: "Workshop Keselamatan Berkendara", date: "05 Agu 2026", time: "08:00 - 12:00 WIB", location: "Lapangan Parkir Utama", provider: "Tim HSE" },
  ];

  const myCertificates = [
    { id: 1, title: "Sertifikat K3 Umum", issueDate: "15 Mei 2026", issuer: "Kemenaker RI", validUntil: "15 Mei 2029" },
    { id: 2, title: "Sertifikat Pengoperasian HRIS", issueDate: "10 Mei 2026", issuer: "Tim IT Internal", validUntil: "-" },
    { id: 3, title: "Sertifikat Leadership Dasar", issueDate: "20 Mar 2026", issuer: "HRD Internal", validUntil: "-" },
  ];

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return dateStr; }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pelatihan Saya</h1>
        <p className="text-sm text-gray-500">Pusat pelatihan dan pengembangan kompetensi Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><BookOpen size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pelatihan</p>
              <p className="text-xl font-extrabold text-slate-800">{myTrainings.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Selesai</p>
              <p className="text-xl font-extrabold text-slate-800">{myTrainings.filter((t) => t.status === "Selesai").length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Award size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Sertifikat</p>
              <p className="text-xl font-extrabold text-slate-800">{myCertificates.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Daftar Pelatihan Saya</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pelatihan yang ditugaskan atau diikuti</p>
            </div>

            <div className="divide-y divide-slate-50">
              {myTrainings.map((training) => (
                <div key={training.id} className="p-6 hover:bg-slate-50/30 transition-colors flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-sm font-bold text-slate-800">{training.title}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        training.type === "Wajib" ? "bg-red-50 text-red-700" :
                        training.type === "Teknis" ? "bg-blue-50 text-blue-700" :
                        "bg-purple-50 text-purple-700"
                      }`}>{training.type}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        training.status === "Selesai" ? "bg-emerald-50 text-emerald-700" :
                        training.status === "Sedang Berjalan" ? "bg-amber-50 text-amber-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{training.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={9} /> {training.date}</span>
                      <span className="flex items-center gap-1"><GraduationCap size={9} /> {training.provider}</span>
                    </div>
                  </div>
                  {training.certificate && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[9px] font-bold flex items-center gap-1 shrink-0">
                      <Award size={10} /> Bersertifikat
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                Sertifikat Saya
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Daftar sertifikat yang telah diperoleh</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Sertifikat</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Terbit</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Penerbit</th>
                    <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Berlaku Hingga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {myCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-3 text-xs font-semibold text-slate-800">{cert.title}</td>
                      <td className="px-6 py-3 text-xs text-slate-600">{cert.issueDate}</td>
                      <td className="px-6 py-3 text-xs text-slate-600">{cert.issuer}</td>
                      <td className="px-6 py-3 text-xs text-slate-600">{cert.validUntil}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Clock size={16} className="text-[#CC0000]" />
                Jadwal Mendatang
              </h3>
            </div>
            <div className="divide-y divide-slate-50">
              {upcomingTrainings.map((ut) => (
                <div key={ut.id} className="p-5">
                  <h4 className="text-xs font-bold text-slate-800 mb-2">{ut.title}</h4>
                  <div className="space-y-1.5 text-[10px] text-slate-500">
                    <p className="flex items-center gap-1"><Calendar size={9} /> {ut.date}</p>
                    <p className="flex items-center gap-1"><Clock size={9} /> {ut.time}</p>
                    <p className="flex items-center gap-1"><MapPin size={9} /> {ut.location}</p>
                    <p className="flex items-center gap-1"><GraduationCap size={9} /> {ut.provider}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-2">Butuh Pelatihan Tambahan?</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              Ajukan permohonan pelatihan yang Anda butuhkan untuk pengembangan karir.
            </p>
            <button className="w-full px-4 py-2 bg-white text-slate-800 text-[10px] font-bold rounded-xl hover:bg-slate-100 transition-colors">
              Ajukan Pelatihan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
