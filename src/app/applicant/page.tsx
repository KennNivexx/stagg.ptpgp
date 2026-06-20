import { cookies } from "next/headers";
import { getMyApplicationData } from "@/app/actions/applicant";
import { ClipboardList, Building2, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  "Menunggu Review": { label: "Menunggu Review", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: Clock },
  "Direview": { label: "Sedang Direview", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", icon: AlertCircle },
  "Wawancara": { label: "Jadwal Wawancara", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", icon: AlertCircle },
  "Tes": { label: "Tahap Tes", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", icon: AlertCircle },
  "Diterima": { label: "Diterima 🎉", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 },
  "Ditolak": { label: "Tidak Lolos", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
};

export default async function ApplicantDashboard() {
  const cookieStore = await cookies();
  const userName = cookieStore.get("user_name")?.value || "Pelamar";

  const data = await getMyApplicationData();

  const statusInfo = data
    ? (STATUS_CONFIG[data.application.status] || STATUS_CONFIG["Menunggu Review"])
    : null;

  const appliedDate = data?.application.applied_at
    ? new Date(data.application.applied_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : "-";

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h1 className="text-2xl font-extrabold text-slate-900">
          Halo, {userName.split(" ")[0]}! 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Selamat datang di Portal Pelamar PT Pratama Galuh Perkasa. Pantau perkembangan lamaran Anda di sini.
        </p>
      </div>

      {data ? (
        <>
          {/* Status card */}
          <div className={`rounded-2xl border-2 p-6 ${statusInfo?.bg} ${statusInfo?.border}`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-white/60`}>
                {statusInfo && <statusInfo.icon size={24} className={statusInfo.color} />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status Lamaran Anda</p>
                <p className={`text-xl font-extrabold ${statusInfo?.color}`}>{statusInfo?.label}</p>
                <p className="text-sm text-slate-600 mt-2">
                  Posisi: <span className="font-bold">{data.job?.position || "—"}</span> — {data.job?.department || "—"}
                </p>
                <p className="text-xs text-slate-400 mt-1">Tanggal daftar: {appliedDate}</p>
              </div>
              <Link
                href="/applicant/status"
                className={`px-4 py-2 rounded-xl text-xs font-bold ${statusInfo?.color} bg-white/60 hover:bg-white transition-colors flex items-center gap-1.5 shrink-0`}
              >
                Lihat Detail <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/applicant/status" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ClipboardList size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Status Lamaran</h3>
              </div>
              <p className="text-xs text-slate-500">Lihat detail progress dan timeline tahapan seleksi Anda.</p>
              <p className="text-[10px] text-blue-600 font-bold mt-3 group-hover:underline flex items-center gap-1">
                Lihat Detail <ArrowRight size={10} />
              </p>
            </Link>

            <Link href="/applicant/company" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-red-50 text-[#CC0000] rounded-xl">
                  <Building2 size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Info Perusahaan</h3>
              </div>
              <p className="text-xs text-slate-500">Kenali lebih dalam PT Pratama Galuh Perkasa — visi, misi, dan budaya kerja.</p>
              <p className="text-[10px] text-[#CC0000] font-bold mt-3 group-hover:underline flex items-center gap-1">
                Lihat Profil <ArrowRight size={10} />
              </p>
            </Link>
          </div>

          {/* Notice if accepted */}
          {data.application.status === "Diterima" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <h3 className="font-extrabold text-emerald-800 text-sm mb-2">🎉 Selamat, Anda Diterima!</h3>
              <p className="text-xs text-emerald-700">
                Tim HRD akan segera menghubungi Anda melalui email <strong>{data.application.email}</strong> atau nomor telepon <strong>{data.application.phone || "—"}</strong> untuk informasi onboarding lebih lanjut.
              </p>
            </div>
          )}

          {/* Notice if rejected */}
          {data.application.status === "Ditolak" && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-700 text-sm mb-2">Terima kasih atas minat Anda</h3>
              <p className="text-xs text-slate-500">
                Kami mengapresiasi waktu dan usaha Anda dalam proses seleksi ini. Jangan menyerah — peluang karir lain mungkin lebih cocok untuk Anda. Akun portal ini akan segera dinonaktifkan.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <ClipboardList size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Data lamaran tidak ditemukan.</p>
          <p className="text-xs text-slate-400 mt-1">Silakan hubungi HRD untuk informasi lebih lanjut.</p>
        </div>
      )}

      {/* Info box */}
      <div className="bg-[#1A2530] rounded-2xl p-6 text-white">
        <h4 className="text-sm font-bold mb-3">ℹ️ Tentang Portal Ini</h4>
        <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
          <li>Portal ini bersifat <strong className="text-white">sementara</strong> khusus untuk memantau perkembangan lamaran Anda.</li>
          <li>Akun akan <strong className="text-white">otomatis dihapus</strong> apabila lamaran tidak lolos seleksi.</li>
          <li>Untuk pertanyaan, hubungi HRD di <strong className="text-white">hrga@ptpgp.co.id</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
