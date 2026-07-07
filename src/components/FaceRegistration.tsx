"use client";
import { useState, useCallback, useEffect } from "react";
import { X, CheckCircle2, Camera, AlertTriangle, RefreshCw, Trash2, UserPlus, ChevronLeft, ChevronRight } from "lucide-react";
import CameraCapture, { type RecognitionResult } from "@/components/CameraCapture";
import { registerFace, removeFaceData, getEmployeeFaceStatus } from "@/app/actions/attendance";

interface Props {
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSave?: (descriptors: Float32Array[], photos: string[]) => Promise<{ error?: string } | undefined>;
  saveLabel?: string;
  title?: string;
  /** Skip fetching existing face status — go straight to camera. Hides Hapus button. */
  skipExistingCheck?: boolean;
}

const ANGLE_STEPS = [
  { key: "depan", label: "Depan", icon: "⊡", hint: "Hadap lurus ke kamera" },
  { key: "kanan", label: "Serong Kanan", icon: "↗", hint: "Putar kepala sedikit ke kanan (~30°)" },
  { key: "kiri", label: "Serong Kiri", icon: "↖", hint: "Putar kepala sedikit ke kiri (~30°)" },
];

export default function FaceRegistration({ employeeId, employeeName, onClose, onSave, saveLabel, title, skipExistingCheck }: Props) {
  const [step, setStep] = useState(0); // 0, 1, 2 = taking photo; 3 = saving; 4 = done
  const [descriptors, setDescriptors] = useState<Float32Array[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingStatus, setExistingStatus] = useState<Record<string, unknown> | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [removing, setRemoving] = useState(false);

  const checkStatus = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const status = await getEmployeeFaceStatus(employeeId);
      setExistingStatus(status as Record<string, unknown> | null);
    } catch (e) {
      console.error("[FaceRegistration] Failed to check face status:", (e as Error).message);
    }
    setCheckingStatus(false);
  }, [employeeId]);

  useEffect(() => {
    if (skipExistingCheck) { setCheckingStatus(false); return; }
    checkStatus();
  }, [checkStatus, skipExistingCheck]);

  const handleCapture = useCallback((photoBase64: string, _location: unknown, recognition?: RecognitionResult) => {
    if (!recognition?.descriptor) {
      setError("Gagal mengambil data wajah. Pastikan wajah terlihat jelas.");
      return;
    }

    setPhotos((prev) => [...prev, photoBase64]);
    setDescriptors((prev) => [...prev, recognition.descriptor]);
    setError("");

    if (step < 2) {
      setStep(step + 1);
    } else {
      setStep(3); // All 3 done, move to save
    }
  }, [step]);

  const handleSave = async () => {
    if (descriptors.length === 0) return;
    setSaving(true);
    setError("");

    let result: { error?: string } | undefined;

    if (onSave) {
      result = await onSave(descriptors, photos);
    } else {
      const fd = new FormData();
      fd.append("employee_id", employeeId);
      fd.append("descriptors", JSON.stringify(descriptors.map((d) => Array.from(d))));
      fd.append("photo_url", photos[0] || "");
      result = await registerFace(fd);
    }

    setSaving(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    setStep(4);
    checkStatus();
  };

  const handleRemove = async () => {
    setRemoving(true);
    const result = await removeFaceData(employeeId);
    setRemoving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setExistingStatus(null);
    setStep(0);
    setDescriptors([]);
    setPhotos([]);
  };

  const handleRetake = () => {
    setDescriptors([]);
    setPhotos([]);
    setStep(0);
    setError("");
  };

  if (checkingStatus) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[8vh]" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-12 text-center" onClick={(e) => e.stopPropagation()}>
          <RefreshCw size={32} className="text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Memuat data wajah...</p>
        </div>
      </div>
    );
  }

  // ── DONE STATE ─────────────────────────────────────────────────
  if (step === 4) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[8vh]" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 flex items-center justify-between bg-emerald-600">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={18} className="text-white" />
              <h3 className="text-white font-bold text-sm">Registrasi Wajah Berhasil</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
              <X size={14} className="text-white" />
            </button>
          </div>
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <UserPlus size={36} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{employeeName}</p>
              <p className="text-xs text-slate-500 mt-1">{descriptors.length} foto wajah berhasil disimpan</p>
            </div>
            <p className="text-xs text-slate-400">
              Karyawan sekarang dapat menggunakan face recognition untuk absensi.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={handleRetake} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
                Ambil Ulang
              </button>
              <button onClick={onClose} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-colors">
                Selesai
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EXISTING DATA ──────────────────────────────────────────────
  if (existingStatus && step < 3) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[8vh]" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 flex items-center justify-between bg-slate-900">
            <div className="flex items-center gap-2.5">
              <Camera size={18} className="text-sky-400" />
              <h3 className="text-white font-bold text-sm">Data Wajah — {employeeName}</h3>
            </div>
            <button onClick={onClose} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
              <X size={14} className="text-white" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold text-emerald-800">Wajah sudah terdaftar</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {existingStatus.photo_count as number} foto · Terakhir: {new Date(existingStatus.updated_at as string).toLocaleDateString("id-ID")}
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleRetake} className="flex-1 py-2.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-xl text-sm font-bold transition-colors">
                Daftarkan Ulang
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> {removing ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── REGISTRATION / SAVE STATE ─────────────────────────────────
  const currentAngle = ANGLE_STEPS[step] || ANGLE_STEPS[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 pt-[3vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <Camera size={18} className="text-sky-400" />
            <h3 className="text-white font-bold text-sm">{title || `Registrasi Wajah — ${employeeName}`}</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-colors">
            <X size={14} className="text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Step indicators */}
          <div className="px-5 pt-4">
            <div className="flex items-center gap-2 mb-3">
              {ANGLE_STEPS.map((a, i) => (
                <div key={a.key} className="flex items-center gap-2 flex-1">
                  <div className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-bold ${
                    i < descriptors.length
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : i === step
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "bg-slate-50 text-slate-400 border border-slate-100"
                  }`}>
                    <span className="text-xs">{a.icon}</span>
                    <span className="hidden sm:inline">{a.label}</span>
                    {i < descriptors.length && <CheckCircle2 size={10} className="shrink-0 ml-auto" />}
                  </div>
                  {i < 2 && <ChevronRight size={10} className="text-slate-300 shrink-0" />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 text-center">
              {step < 3 ? `${currentAngle.hint} — Foto ke-${step + 1} dari 3` : "Siap disimpan"}
            </p>
          </div>

          {error && (
            <div className="mx-5 mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Camera or Save */}
          {step < 3 ? (
            <div className="p-4">
              <CameraCapture
                onCapture={handleCapture}
                buttonLabel={`Ambil Foto ${currentAngle.label}`}
                employeeName={employeeName}
                mode="registration"
              />
            </div>
          ) : (
            /* Save confirmation */
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl p-4">
                <Camera size={20} className="text-sky-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-sky-800">Simpan data wajah?</p>
                  <p className="text-xs text-sky-600 mt-0.5">{descriptors.length} foto siap disimpan sebagai referensi face recognition.</p>
                </div>
              </div>

              {/* Photo thumbnails */}
              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI from canvas capture, not a next/image-optimizable URL */}
                    <img src={p} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={handleRetake} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors inline-flex items-center justify-center gap-1.5">
                  <ChevronLeft size={14} /> Ambil Ulang
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || descriptors.length === 0}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  {saving ? "Menyimpan..." : <><CheckCircle2 size={14} /> {saveLabel || "Simpan"}</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
