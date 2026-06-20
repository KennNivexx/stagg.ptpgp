import { getMyApplicationData, getAllMyApplications } from "@/app/actions/applicant";
import { CheckCircle2, Circle, Clock, XCircle, FileText, MessageSquare, Award, UserCheck } from "lucide-react";

const STAGES = [
  { key: "Menunggu Review", label: "Lamaran Diterima", desc: "Lamaran Anda berhasil dikirim dan menunggu ditinjau oleh tim HRD.", icon: FileText },
  { key: "Direview", label: "Sedang Ditinjau", desc: "Tim HRD sedang meninjau CV dan dokumen lamaran Anda.", icon: Clock },
  { key: "Tes", label: "Tahap Tes", desc: "Anda dipanggil untuk mengikuti tes tertulis atau psikotes.", icon: MessageSquare },
  { key: "Wawancara", label: "Wawancara", desc: "Anda dijadwalkan untuk wawancara dengan tim HRD dan user.", icon: UserCheck },
  { key: "Diterima", label: "Diterima", desc: "Selamat! Anda berhasil lolos seleksi dan akan bergabung bersama kami.", icon: Award },
];

function getStageStatus(currentStatus: string, stageKey: string): "done" | "current" | "pending" | "rejected" {
  if (currentStatus === "Ditolak") {
    const currentIdx = STAGES.findIndex(s => s.key === currentStatus);
    const stageIdx = STAGES.findIndex(s => s.key === stageKey);
    if (stageIdx < currentIdx) return "done";
    return "rejected";
  }
  const currentIdx = STAGES.findIndex(s => s.key === currentStatus);
  const stageIdx = STAGES.findIndex(s => s.key === stageKey);
  if (stageIdx < currentIdx) return "done";
  if (stageIdx === currentIdx) return "current";
  return "pending";
}

export default async function ApplicantStatusPage() {
  const [data, allApps] = await Promise.all([
    getMyApplicationData(),
    getAllMyApplications(),
  ]);

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Data lamaran tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const currentStatus = data.application.status;
  const isRejected = currentStatus === "Ditolak";
  const isAccepted = currentStatus === "Diterima";

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Status Lamaran</h1>
        <p className="text-sm text-gray-500">Detail perkembangan proses seleksi Anda.</p>
      </div>

      {/* Lamaran utama */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-800">Informasi Lamaran</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Posisi yang Dilamar</p>
            <p className="font-bold text-slate-800">{data.job?.position || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Departemen</p>
            <p className="font-semibold text-slate-700">{data.job?.department || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Tanggal Melamar</p>
            <p className="font-semibold text-slate-700">
              {new Date(data.application.applied_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Status Saat Ini</p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
              isAccepted ? "bg-emerald-50 text-emerald-700" :
              isRejected ? "bg-red-50 text-red-700" :
              "bg-amber-50 text-amber-700"
            }`}>
              {currentStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-800">Timeline Seleksi</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tahapan proses seleksi yang akan Anda jalani</p>
        </div>
        <div className="p-6 space-y-0">
          {STAGES.map((stage, idx) => {
            const stageStatus = getStageStatus(currentStatus, stage.key);
            const isLast = idx === STAGES.length - 1;

            return (
              <div key={stage.key} className="flex gap-4">
                {/* Connector */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    stageStatus === "done" ? "bg-emerald-500 border-emerald-500 text-white" :
                    stageStatus === "current" ? "bg-[#CC0000] border-[#CC0000] text-white" :
                    stageStatus === "rejected" ? "bg-slate-200 border-slate-200 text-slate-400" :
                    "bg-white border-slate-200 text-slate-300"
                  }`}>
                    {stageStatus === "done" ? (
                      <CheckCircle2 size={18} />
                    ) : stageStatus === "rejected" ? (
                      <XCircle size={18} />
                    ) : stageStatus === "current" ? (
                      <stage.icon size={18} />
                    ) : (
                      <Circle size={18} />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 my-1 min-h-[32px] ${
                      stageStatus === "done" ? "bg-emerald-300" : "bg-slate-200"
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 flex-1 ${isLast ? "pb-2" : ""}`}>
                  <p className={`text-sm font-bold ${
                    stageStatus === "done" ? "text-emerald-700" :
                    stageStatus === "current" ? "text-[#CC0000]" :
                    stageStatus === "rejected" ? "text-slate-400" :
                    "text-slate-400"
                  }`}>
                    {stage.label}
                    {stageStatus === "current" && (
                      <span className="ml-2 text-[9px] bg-[#CC0000] text-white px-1.5 py-0.5 rounded-full font-bold">SAAT INI</span>
                    )}
                  </p>
                  <p className={`text-xs mt-1 ${
                    stageStatus === "rejected" ? "text-slate-300" :
                    stageStatus === "pending" ? "text-slate-300" :
                    "text-slate-500"
                  }`}>
                    {stage.desc}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Rejected state */}
          {isRejected && (
            <div className="flex gap-4 mt-2">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 bg-red-500 border-red-500 text-white">
                  <XCircle size={18} />
                </div>
              </div>
              <div className="pb-2 flex-1">
                <p className="text-sm font-bold text-red-600">Tidak Lolos Seleksi</p>
                <p className="text-xs mt-1 text-slate-500">Mohon maaf, lamaran Anda tidak dapat kami lanjutkan ke tahap berikutnya. Terima kasih atas minat dan waktu Anda.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* All applications history */}
      {allApps.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h2 className="font-extrabold text-slate-800">Riwayat Lamaran</h2>
            <p className="text-xs text-slate-400 mt-0.5">Semua posisi yang pernah Anda lamar</p>
          </div>
          <div className="divide-y divide-slate-50">
            {allApps.map((app) => (
              <div key={app.id} className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{app.position}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{app.department} — {new Date(app.applied_at).toLocaleDateString("id-ID")}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                  app.status === "Diterima" ? "bg-emerald-50 text-emerald-700" :
                  app.status === "Ditolak" ? "bg-red-50 text-red-700" :
                  "bg-amber-50 text-amber-700"
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact HRD */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
        <p className="font-bold text-slate-800 mb-1">Ada pertanyaan?</p>
        <p className="text-xs">Hubungi tim HRD kami melalui email <a href="mailto:hrga@ptpgp.co.id" className="text-[#CC0000] font-bold hover:underline">hrga@ptpgp.co.id</a> atau melalui telepon kantor pada jam kerja (Senin–Jumat, 08.00–17.00 WIB).</p>
      </div>
    </div>
  );
}
