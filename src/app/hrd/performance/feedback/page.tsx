import { supabaseAdmin } from "@/lib/supabase";
import { MessageCircle, Star, Plus, Send, User, Clock, Filter } from "lucide-react";

export default async function FeedbackPage() {
  const { data: employees } = await supabaseAdmin
    .from("employees")
    .select("id, full_name, department, position")
    .limit(100);

  const feedbackHistory = [
    { id: 1, employee: "Budi Santoso", reviewer: "Andi Pratama (Manager)", category: "Kinerja", rating: 4, comment: "Budi menunjukkan peningkatan signifikan dalam penyelesaian proyek tepat waktu.", date: "05 Jun 2026" },
    { id: 2, employee: "Siti Rahayu", reviewer: "Dewi Lestari (Supervisor)", category: "Kerjasama Tim", rating: 5, comment: "Siti sangat kooperatif dan selalu membantu rekan tim.", date: "02 Jun 2026" },
    { id: 3, employee: "Ahmad Fauzi", reviewer: "Rudi Hartono (Manager)", category: "Kepemimpinan", rating: 3, comment: "Perlu meningkatkan kemampuan delegasi tugas kepada tim.", date: "28 Mei 2026" },
    { id: 4, employee: "Dian Permata", reviewer: "Sari Indah (Rekan Kerja)", category: "Komunikasi", rating: 4, comment: "Komunikasi jelas dan efektif dalam koordinasi proyek.", date: "25 Mei 2026" },
    { id: 5, employee: "Hendra Gunawan", reviewer: "Bambang S. (Supervisor)", category: "Kehadiran", rating: 2, comment: "Sering terlambat dan absen tanpa pemberitahuan.", date: "20 Mei 2026" },
  ];

  const categories = ["Kinerja", "Kerjasama Tim", "Kepemimpinan", "Komunikasi", "Kehadiran", "Inisiatif", "Teknis"];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Umpan Balik 360<span className="align-super text-xs">o</span></h1>
        <p className="text-sm text-gray-500">Berikan dan kelola umpan balik kinerja dari berbagai sudut pandang.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <MessageCircle size={16} className="text-[#CC0000]" />
                Formulir Umpan Balik
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Isi form untuk memberikan umpan balik</p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Karyawan yang Dinilai</label>
                <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Karyawan</option>
                  {employees?.map((e: Record<string, unknown>) => (
                    <option key={e.id as string} value={e.id as string}>{e.full_name as string} - {e.department as string}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Pemberi Umpan Balik</label>
                <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Reviewer</option>
                  {employees?.slice(0, 20).map((e: Record<string, unknown>) => (
                    <option key={e.id as string} value={e.id as string}>{e.full_name as string}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori</label>
                <select className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rating</label>
                <div className="flex items-center gap-1 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} className="text-slate-300 hover:text-amber-400 transition-colors">
                      <Star size={20} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Komentar</label>
                <textarea rows={3} placeholder="Tulis komentar atau masukan Anda..." className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none" />
              </div>
              <div className="md:col-span-2">
                <button className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
                  <Send size={14} /> Kirim Umpan Balik
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm">Riwayat Umpan Balik</h3>
              <p className="text-xs text-slate-400 mt-0.5">Semua umpan balik yang telah diberikan</p>
            </div>

            <div className="divide-y divide-slate-50">
              {feedbackHistory.map((fb) => (
                <div key={fb.id} className="p-6 hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-sm font-bold text-slate-800">{fb.employee}</h4>
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold">
                          {fb.category}
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={10}
                              className={star <= fb.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{fb.comment}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1"><User size={9} /> Reviewer: {fb.reviewer}</span>
                        <span className="flex items-center gap-1"><Clock size={9} /> {fb.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">Ringkasan Feedback</h3>
            <div className="space-y-4">
              {categories.slice(0, 5).map((cat, i) => (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <span className="text-slate-400">{[4.2, 4.5, 3.8, 4.0, 3.5][i]}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${i === 0 ? "bg-emerald-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-amber-500" : i === 3 ? "bg-purple-500" : "bg-red-500"}`}
                      style={{ width: `${[84, 90, 76, 80, 70][i]}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#1A2530] to-slate-800 rounded-2xl p-6 text-white shadow-sm">
            <h4 className="text-sm font-bold mb-3">Tentang Umpan Balik 360<span className="align-super text-[8px]">o</span></h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Umpan balik 360 derajat mengumpulkan penilaian dari berbagai sumber: atasan, rekan kerja, bawahan, dan diri sendiri untuk memberikan gambaran menyeluruh tentang kinerja karyawan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
