"use client";
import { useState, useEffect, useCallback } from "react";
import CameraCapture from "@/components/CameraCapture";
import FaceRegistration from "@/components/FaceRegistration";
import type { RecognitionResult } from "@/components/CameraCapture";
import {
  getTodayAttendance, clockIn, clockOut,
  getMyFaceStatus, submitFaceChangeRequest, getMyFaceChangeRequest,
  getMyFaceDescriptors,
} from "@/app/actions/attendance";
import type { FaceReference } from "@/lib/face-recognition";
import { useSession } from "@/hooks/useSession";
import { Calendar, Clock, CheckCircle2, Camera, UserCheck, AlertTriangle, Info, Send, ClockIcon } from "lucide-react";

export default function EmployeeAttendancePage() {
  const [today, setToday] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAction, setLastAction] = useState<"in" | "out" | null>(null);
  const { user } = useSession();
  const employeeName = user?.name || "Karyawan";
  const employeeId = user?.id || "";
  const [faceStatus, setFaceStatus] = useState<Record<string, unknown> | null>(null);
  const [faceRequest, setFaceRequest] = useState<Record<string, unknown> | null>(null);
  const [faceRefs, setFaceRefs] = useState<FaceReference[]>([]);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceModalMode, setFaceModalMode] = useState<"register" | "request">("register");

  const fetchToday = useCallback(async () => {
    const data = await getTodayAttendance();
    setToday(data || null);
    setLoading(false);
  }, []);

  const refreshFace = useCallback(async () => {
    getMyFaceStatus().then(({ status }) => setFaceStatus(status)).catch((e) => console.error("[Attendance] getMyFaceStatus failed:", e));
    getMyFaceChangeRequest().then(setFaceRequest).catch((e) => console.error("[Attendance] getMyFaceChangeRequest failed:", e));
    getMyFaceDescriptors().then(setFaceRefs).catch((e) => console.error("[Attendance] getMyFaceDescriptors failed:", e));
  }, []);

  useEffect(() => {
    fetchToday();
    refreshFace();
  }, [fetchToday, refreshFace]);

  const handleClockIn = useCallback(
    async (photoBase64: string, location: { lat: number; lng: number; name: string }, recognition?: RecognitionResult) => {
      setResult("Memproses clock-in...");
      const fd = new FormData();
      fd.append("photo_url", photoBase64);
      fd.append("latitude", String(location.lat));
      fd.append("longitude", String(location.lng));
      fd.append("location_name", location.name);
      if (recognition?.descriptor) {
        fd.append("face_descriptor", JSON.stringify(Array.from(recognition.descriptor)));
      }
      const res = await clockIn(fd);
      if ("error" in res) { setResult(res.error); return; }
      setLastAction("in"); setShowSuccess(true); setResult("");
      await fetchToday();
    },
    [fetchToday]
  );

  const handleClockOut = useCallback(
    async (photoBase64: string, location: { lat: number; lng: number; name: string }, recognition?: RecognitionResult) => {
      setResult("Memproses clock-out...");
      const fd = new FormData();
      fd.append("photo_url", photoBase64);
      fd.append("latitude", String(location.lat));
      fd.append("longitude", String(location.lng));
      fd.append("location_name", location.name);
      if (recognition?.descriptor) {
        fd.append("face_descriptor", JSON.stringify(Array.from(recognition.descriptor)));
      }
      const res = await clockOut(fd);
      if ("error" in res) { setResult(res.error); return; }
      setLastAction("out"); setShowSuccess(true); setResult("");
      await fetchToday();
    },
    [fetchToday]
  );

  const handleFaceChangeRequest = useCallback(
    async (descriptors: Float32Array[], photos: string[]) => {
      const fd = new FormData();
      fd.append("descriptors", JSON.stringify(descriptors.map((d) => Array.from(d))));
      fd.append("photo_url", photos[0] || "");
      return submitFaceChangeRequest(fd);
    },
    []
  );

  const checkedIn = !!(today && today.check_in);
  const checkedOut = !!(today && today.check_out);
  const bothDone = checkedIn && checkedOut;
  const CHECKOUT_HOUR = parseInt(process.env.NEXT_PUBLIC_CHECKOUT_HOUR || "15", 10);
  const afterCutoff = new Date().getHours() >= CHECKOUT_HOUR;
  const canClockOut = checkedIn && !checkedOut && afterCutoff;

  const hasFace = !!faceStatus;
  const hasPendingRequest = faceRequest && (faceRequest.status as string) === "Pending";
  const latestRequestStatus = faceRequest ? (faceRequest.status as string) : null;

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-sm text-slate-400">Memuat data absensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-1">Absensi Hari Ini</h1>
        <p className="text-sm text-gray-500">Lakukan check-in dan check-out dengan foto selfie.</p>
      </div>

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSuccess(false)} />
          <div className="relative bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2">
              {lastAction === "out" ? "Absensi Selesai!" : "Berhasil Hadir!"}
            </h2>
            <p className="text-sm text-slate-500 mb-1">{employeeName}</p>
            <p className="text-xs text-slate-400 mb-4">
              {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              {" · "}
              {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <button onClick={() => setShowSuccess(false)}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors">
              Oke
            </button>
          </div>
        </div>
      )}

      {/* Both done */}
      {bothDone && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800">Absensi Hari Ini Selesai</h2>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2"><Clock size={14} className="text-emerald-500" />{new Date(today.check_in as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-2"><Clock size={14} className="text-red-500" />{new Date(today.check_out as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>
      )}

      {/* Checked in but before cutoff */}
      {checkedIn && !checkedOut && !afterCutoff && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">Sudah Hadir</h2>
            <p className="text-sm text-slate-500 mt-1">{employeeName}</p>
            <p className="text-xs text-slate-400 mt-0.5">Check-in: {new Date(today.check_in as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            <Clock size={14} className="inline mr-1" />Check-out tersedia setelah pukul {CHECKOUT_HOUR}:00 WIB
          </div>
        </div>
      )}

      {/* Can clock out */}
      {canClockOut && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl"><Clock size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">{employeeName} — Sudah Hadir</p>
              <p className="text-xs text-slate-400">Check-in: {new Date(today.check_in as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
          {result && <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700">{result}</div>}
          <CameraCapture onCapture={handleClockOut} buttonLabel="Clock Out" employeeName={employeeName} mode="recognition" referenceDescriptors={faceRefs} />
        </div>
      )}

      {/* Not clocked in */}
      {!checkedIn && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl"><Calendar size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">{employeeName}</p>
              <p className="text-xs text-slate-400">Belum check-in hari ini</p>
            </div>
          </div>
          {result && <div className="mb-4 p-3 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700">{result}</div>}
          <CameraCapture onCapture={handleClockIn} buttonLabel="Clock In" employeeName={employeeName} mode="recognition" referenceDescriptors={faceRefs} />
        </div>
      )}

      {/* ── Face Recognition Section ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Camera size={18} className="text-[#CC0000]" />
            <div>
              <p className="text-sm font-extrabold text-slate-800">Face Recognition</p>
              <p className="text-xs text-slate-400">Verifikasi wajah untuk absensi</p>
            </div>
          </div>
          {hasFace
            ? <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold"><UserCheck size={12} /> Terdaftar</span>
            : <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold"><AlertTriangle size={12} /> Belum Daftar</span>
          }
        </div>

        <div className="p-6 space-y-3">
          {/* Face registered — show info + request change button */}
          {hasFace && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Wajah sudah terdaftar</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {faceStatus.photo_count as number} foto · Diperbarui: {new Date(faceStatus.updated_at as string).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>
          )}

          {/* Not registered — show register button */}
          {!hasFace && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Wajah belum terdaftar</p>
                <p className="text-xs text-amber-600 mt-0.5">Daftarkan wajah agar sistem bisa mengenali Anda saat absensi.</p>
              </div>
            </div>
          )}

          {/* Latest change request status */}
          {latestRequestStatus && (
            <div className={`flex items-start gap-3 rounded-xl p-3.5 border ${
              latestRequestStatus === "Pending"
                ? "bg-sky-50 border-sky-200"
                : latestRequestStatus === "Disetujui"
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-red-50 border-red-200"
            }`}>
              {latestRequestStatus === "Pending"
                ? <ClockIcon size={16} className="text-sky-600 shrink-0 mt-0.5" />
                : latestRequestStatus === "Disetujui"
                  ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  : <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              }
              <div>
                <p className={`text-xs font-bold ${
                  latestRequestStatus === "Pending" ? "text-sky-800"
                  : latestRequestStatus === "Disetujui" ? "text-emerald-800" : "text-red-800"
                }`}>
                  Pengajuan Perubahan Wajah — {latestRequestStatus}
                </p>
                <p className={`text-xs mt-0.5 ${
                  latestRequestStatus === "Pending" ? "text-sky-600"
                  : latestRequestStatus === "Disetujui" ? "text-emerald-600" : "text-red-600"
                }`}>
                  {latestRequestStatus === "Pending"
                    ? "Menunggu persetujuan HRD."
                    : latestRequestStatus === "Disetujui"
                      ? `Disetujui pada ${faceRequest ? new Date(faceRequest.reviewed_at as string).toLocaleDateString("id-ID") : ""}.`
                      : `Ditolak. ${faceRequest?.notes ? `Catatan: ${faceRequest.notes}` : ""}`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!hasFace && (
            <button
              onClick={() => { setFaceModalMode("register"); setShowFaceModal(true); }}
              className="w-full py-3 bg-[#CC0000] hover:bg-[#aa0000] text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Camera size={16} /> Daftarkan Wajah Sekarang
            </button>
          )}

          {hasFace && !hasPendingRequest && (
            <button
              onClick={() => { setFaceModalMode("request"); setShowFaceModal(true); }}
              className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Send size={15} /> Ajukan Perubahan Wajah
            </button>
          )}

          {hasFace && hasPendingRequest && (
            <p className="text-center text-xs text-slate-400 py-1">
              Tidak dapat mengajukan perubahan baru selama ada pengajuan yang sedang diproses.
            </p>
          )}

          <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
            <Info size={12} className="shrink-0 mt-0.5" />
            <span>Registrasi pertama dapat dilakukan sendiri. Perubahan data wajah memerlukan persetujuan HRD.</span>
          </div>
        </div>
      </div>

      {/* Face Modal */}
      {showFaceModal && employeeId && (
        <FaceRegistration
          employeeId={employeeId}
          employeeName={employeeName}
          onClose={() => { setShowFaceModal(false); refreshFace(); }}
          onSave={faceModalMode === "request" ? handleFaceChangeRequest : undefined}
          saveLabel={faceModalMode === "request" ? "Kirim Pengajuan" : "Simpan"}
          title={faceModalMode === "request" ? `Ajukan Perubahan Wajah — ${employeeName}` : `Registrasi Wajah — ${employeeName}`}
          skipExistingCheck={faceModalMode === "request"}
        />
      )}
    </div>
  );
}
