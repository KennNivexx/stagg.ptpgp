"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, KeyRound, ScanFace, Lock, CheckCircle2, Eye, EyeOff, RefreshCw, Camera, CameraOff, ShieldCheck } from "lucide-react";
import {
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  verifyFaceForReset,
  resetForgotPassword,
  skipFaceVerification,
} from "@/app/actions/forgot-password";

const MODEL_URL = "/models";

type Step = 1 | 2 | 3 | 4 | 5;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasFaceData, setHasFaceData] = useState(true);

  // ── OTP input refs ────────────────────────────────────────────────
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      otpRefs.current[5]?.focus();
    }
  };

  // ── Face scan state ───────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceReady, setFaceReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanStatus, setScanStatus] = useState<"idle" | "scanning" | "success" | "fail" | "scanning">("idle");

  const stopCamera = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setCameraActive(false);
  }, []);

  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const startFaceScan = useCallback(async () => {
    setFaceLoading(true);
    setCameraError("");
    setScanStatus("idle");

    try {
      const faceapi = await import("face-api.js");
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setFaceReady(true);

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const detection = await faceapi.detectSingleFace(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
        ).withFaceLandmarks();
        setFaceDetected(!!detection);
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (detection) {
          const { x, y, width, height } = detection.detection.box;
          const scaleX = canvasRef.current.width / (videoRef.current.videoWidth || 640);
          const scaleY = canvasRef.current.height / (videoRef.current.videoHeight || 480);
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 2;
          ctx.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
        }
      }, 200);
    } catch (e) {
      setCameraError("Gagal membuka kamera. Pastikan izin kamera diberikan.");
      console.error(e);
    } finally {
      setFaceLoading(false);
    }
  }, []);

  const handleFaceScan = useCallback(async () => {
    if (!faceDetected || !videoRef.current) return;
    setScanStatus("scanning");
    setError("");

    try {
      const faceapi = await import("face-api.js");
      const detection = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        setScanStatus("fail");
        setError("Wajah tidak terdeteksi. Pastikan wajah terlihat jelas.");
        return;
      }

      const descriptor = Array.from(detection.descriptor);
      const res = await verifyFaceForReset(email, descriptor);

      if (res.error) {
        setScanStatus("fail");
        setError(res.error);
      } else {
        setScanStatus("success");
        stopCamera();
        setTimeout(() => setStep(4), 800);
      }
    } catch (e) {
      setScanStatus("fail");
      setError("Terjadi kesalahan saat memindai wajah.");
      console.error(e);
    }
  }, [email, faceDetected, stopCamera]);

  // ── Step handlers ─────────────────────────────────────────────────
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const res = await sendPasswordResetOTP(email.trim());
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setStep(2);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Masukkan 6 digit kode OTP."); return; }
    setLoading(true);
    setError("");
    const res = await verifyPasswordResetOTP(email, code);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setHasFaceData(res.hasFaceData ?? true);
    setStep(3);
  };

  const handleSkipFace = async () => {
    setLoading(true);
    setError("");
    const res = await skipFaceVerification(email);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setStep(4);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { setError("Password minimal 6 karakter."); return; }
    if (newPassword !== confirmPassword) { setError("Konfirmasi password tidak cocok."); return; }
    setLoading(true);
    setError("");
    const res = await resetForgotPassword(email, newPassword);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setStep(5);
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    await sendPasswordResetOTP(email);
    setLoading(false);
    setOtp(["", "", "", "", "", ""]);
  };

  // ── UI ────────────────────────────────────────────────────────────
  const stepConfig = [
    { icon: Mail, label: "Email" },
    { icon: KeyRound, label: "OTP" },
    { icon: ScanFace, label: "Wajah" },
    { icon: Lock, label: "Password" },
  ];

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FCFBF9] p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-pgp-red/10 mb-4">
            <ShieldCheck size={28} className="text-pgp-red" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-sm text-slate-500 mt-1">Verifikasi identitas Anda melalui 4 langkah</p>
        </div>

        {/* Step indicator */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {stepConfig.map((s, i) => {
              const stepNum = i + 1;
              const done = step > stepNum;
              const active = step === stepNum;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    done ? "bg-emerald-500 text-white" :
                    active ? "bg-pgp-red text-white shadow-lg shadow-pgp-red/25" :
                    "bg-slate-100 text-slate-400"
                  }`}>
                    {done ? <CheckCircle2 size={16} /> : <s.icon size={16} />}
                  </div>
                  <span className={`text-[10px] font-bold hidden sm:block ${
                    done ? "text-emerald-600" : active ? "text-pgp-red" : "text-slate-400"
                  }`}>{s.label}</span>
                  {i < 3 && <div className={`w-8 h-0.5 rounded-full ${step > stepNum ? "bg-emerald-400" : "bg-slate-200"}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          {/* ── Step 1: Email ───────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Masukkan Email</h2>
                <p className="text-xs text-slate-500">Kode verifikasi akan dikirim ke email Anda.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Alamat Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@ptpgp.co.id"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 transition-all"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-pgp-red hover:bg-pgp-red/80 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Mengirim...</> : "Kirim Kode OTP"}
              </button>
              <div className="text-center">
                <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
                  <ArrowLeft size={12} /> Kembali ke Login
                </Link>
              </div>
            </form>
          )}

          {/* ── Step 2: OTP ─────────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Masukkan Kode OTP</h2>
                <p className="text-xs text-slate-500">
                  Kode 6 digit dikirim ke <strong className="text-slate-700">{email}</strong>. Berlaku 10 menit.
                </p>
              </div>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-extrabold border-2 border-slate-200 rounded-xl focus:outline-none focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 transition-all"
                  />
                ))}
              </div>
              <button type="submit" disabled={loading || otp.join("").length !== 6}
                className="w-full py-3 bg-pgp-red hover:bg-pgp-red/80 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memverifikasi...</> : "Verifikasi Kode"}
              </button>
              <div className="flex justify-between items-center">
                <button type="button" onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                  <ArrowLeft size={12} /> Ganti email
                </button>
                <button type="button" onClick={handleResendOTP} disabled={loading} className="text-xs text-pgp-red hover:underline flex items-center gap-1 disabled:opacity-50">
                  <RefreshCw size={11} /> Kirim ulang
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Face scan ────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Verifikasi Wajah</h2>
                <p className="text-xs text-slate-500">Pastikan wajah Anda terlihat jelas di kamera.</p>
              </div>

              {!hasFaceData ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto">
                    <ScanFace size={28} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Data Wajah Tidak Ditemukan</p>
                    <p className="text-xs text-slate-500 mt-1">Anda belum mendaftarkan wajah ke sistem.</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800">
                    Untuk akun <strong>non-karyawan</strong>, Anda bisa skip langkah ini.
                    Karyawan wajib mendaftarkan wajah terlebih dahulu melalui HRD.
                  </div>
                  {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}
                  <button onClick={handleSkipFace} disabled={loading}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50">
                    {loading ? "Memproses..." : "Lanjut Tanpa Wajah (Non-Karyawan)"}
                  </button>
                </div>
              ) : (
                <>
                  {!cameraActive && scanStatus !== "success" && (
                    <div className="text-center py-6 space-y-4">
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto ${
                        scanStatus === "fail" ? "bg-red-50" : "bg-blue-50"
                      }`}>
                        {scanStatus === "fail" ? <CameraOff size={32} className="text-red-400" /> : <Camera size={32} className="text-blue-500" />}
                      </div>
                      {cameraError && <p className="text-xs text-red-600 font-semibold">{cameraError}</p>}
                      <button onClick={startFaceScan} disabled={faceLoading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        {faceLoading
                          ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Memuat model...</>
                          : <><Camera size={16} /> {scanStatus === "fail" ? "Coba Lagi" : "Buka Kamera"}</>
                        }
                      </button>
                    </div>
                  )}

                  {scanStatus === "success" && (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} className="text-emerald-500" />
                      </div>
                      <p className="font-bold text-emerald-700">Wajah terverifikasi!</p>
                      <p className="text-xs text-slate-500">Melanjutkan ke langkah berikutnya...</p>
                    </div>
                  )}

                  {cameraActive && (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                        <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" width={640} height={480} />
                        <div className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          faceDetected ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                        }`}>
                          {faceDetected ? "Wajah Terdeteksi" : "Tidak Ada Wajah"}
                        </div>
                      </div>

                      {scanStatus === "scanning" && (
                        <div className="flex items-center justify-center gap-2 text-blue-600 text-sm font-bold">
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                          Memverifikasi wajah...
                        </div>
                      )}

                      {scanStatus !== "scanning" && (
                        <button onClick={handleFaceScan} disabled={!faceDetected}
                          className="w-full py-3 bg-pgp-red hover:bg-pgp-red/80 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                          <ScanFace size={16} /> Scan Wajah Sekarang
                        </button>
                      )}

                      <button onClick={() => { stopCamera(); setScanStatus("idle"); }} className="w-full py-2 text-xs text-slate-400 hover:text-slate-600">
                        Batal
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Step 4: New password ─────────────────────────────── */}
          {step === 4 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Buat Password Baru</h2>
                <p className="text-xs text-slate-500">Minimal 6 karakter.</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Password Baru</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-2">Konfirmasi Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 transition-all ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                        : "border-slate-200 focus:border-pgp-red focus:ring-pgp-red/20"
                    }`}
                  />
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-500 mt-1 font-semibold">Password tidak cocok.</p>
                )}
              </div>
              <button type="submit" disabled={loading || !newPassword || newPassword !== confirmPassword}
                className="w-full py-3 bg-pgp-red hover:bg-pgp-red/80 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</> : "Simpan Password Baru"}
              </button>
            </form>
          )}

          {/* ── Step 5: Success ──────────────────────────────────── */}
          {step === 5 && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 mb-2">Password Berhasil Direset!</h2>
                <p className="text-sm text-slate-500">
                  Password akun <strong className="text-slate-700">{email}</strong> telah diperbarui.
                  Silakan login dengan password baru Anda.
                </p>
              </div>
              <Link href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-pgp-red hover:bg-pgp-red/80 text-white font-bold rounded-xl text-sm transition-all">
                Login Sekarang
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
