"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, CameraOff, MapPin, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import * as faceapi from "face-api.js";

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface CameraCaptureProps {
  onCapture?: (photoBase64: string, location: Location) => void;
  buttonLabel?: string;
  employeeName?: string;
}

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function CameraCapture({ onCapture, buttonLabel = "Ambil Foto", employeeName = "Karyawan" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [cameraError, setCameraError] = useState("");
  const [gpsError, setGpsError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [location, setLocation] = useState<Location>({ lat: 0, lng: 0, name: "" });
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ]);
        if (!cancelled) setModelsLoaded(true);
      } catch {
        if (!cancelled) { setModelsLoaded(true); setLoading(false); }
      }
    }
    init();
    return () => {
      cancelled = true;
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!modelsLoaded || cameraError) return;
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 640 } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; }
        setStreamReady(true);
        setLoading(false);
      } catch {
        if (!cancelled) { setCameraError("Izin kamera & lokasi wajib untuk absensi. Silakan izinkan di pengaturan browser."); setLoading(false); }
      }
    }

    function getGps() {
      if (!navigator.geolocation) { setGpsError("GPS tidak didukung."); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const lat = pos.coords.latitude; const lng = pos.coords.longitude;
          let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          try { const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`); const json = await res.json(); if (json?.display_name) name = json.display_name; } catch {}
          if (!cancelled) setLocation({ lat, lng, name });
        },
        () => { if (!cancelled) setGpsError("Izin kamera & lokasi wajib untuk absensi. Silakan izinkan di pengaturan browser."); },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }

    start(); getGps();
    return () => { cancelled = true; };
  }, [modelsLoaded, cameraError]);

  useEffect(() => {
    if (!streamReady) return;
    const video = videoRef.current; const overlay = overlayRef.current;
    if (!video || !overlay) return;
    const id = setInterval(async () => {
      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        setFaceDetected(detections.length > 0);
        const ctx = overlay.getContext("2d"); if (!ctx) return;
        overlay.width = video.videoWidth; overlay.height = video.videoHeight;
        ctx.clearRect(0, 0, overlay.width, overlay.height);
        detections.forEach((d) => { const { x, y, width, height } = d.box; ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2; ctx.strokeRect(x, y, width, height); });
      } catch {}
    }, 500);
    intervalRef.current = id;
    return () => { clearInterval(id); intervalRef.current = null; };
  }, [streamReady]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onCapture || capturing) return;
    setCapturing(true);
    const canvas = document.createElement("canvas"); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d"); if (!ctx) { setCapturing(false); return; }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const now = new Date();
    const lines = [employeeName, formatTime(now), formatDate(now), location.name || `${location.lat}, ${location.lng}`];
    const fontSize = Math.max(14, Math.floor(canvas.width / 40));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.lineWidth = 2; ctx.textAlign = "left";
    const padding = Math.floor(fontSize * 0.8); const lineHeight = fontSize * 1.4;
    const startY = canvas.height - padding - (lines.length - 1) * lineHeight;
    lines.forEach((line, i) => { const y = startY + i * lineHeight; ctx.strokeText(line, padding, y); ctx.fillText(line, padding, y); });
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    onCapture(base64, location);
    setCapturing(false);
  }, [employeeName, location, onCapture, capturing]);

  const errorMsg = cameraError || gpsError;
  const permissionDenied = errorMsg.includes("Izin kamera");

  if (errorMsg && permissionDenied) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
        <CameraOff size={48} className="mx-auto text-red-400 mb-4" />
        <p className="text-sm text-red-700 font-semibold">{errorMsg}</p>
        <p className="text-xs text-red-400 mt-2">Buka pengaturan browser &gt; izinkan kamera dan lokasi</p>
      </div>
    );
  }

  const ringColor = capturing ? "border-amber-400 ring-amber-400/20" : faceDetected ? "border-emerald-500 ring-emerald-500/20" : "border-slate-400";

  return (
    <div className="bg-[#0F172A] rounded-3xl p-6 space-y-5">
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw size={32} className="text-slate-500 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Mengaktifkan kamera...</p>
        </div>
      )}

      {/* Circular Camera */}
      <div className="flex justify-center">
        <div className={`relative w-full max-w-[260px] aspect-square rounded-full overflow-hidden border-[3px] ${ringColor} transition-all duration-500 shadow-2xl`}>
          <video
            ref={videoRef}
            autoPlay playsInline muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            onLoadedMetadata={() => setLoading(false)}
          />
          <canvas ref={overlayRef} className="absolute inset-0 w-full h-full" />
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex flex-col items-center gap-2">
        {/* Face detection status */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${faceDetected ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"}`}>
          {faceDetected ? <><CheckCircle size={13} /> Wajah terdeteksi</> : <><AlertTriangle size={13} /> Wajah tidak terdeteksi</>}
        </div>

        {/* Location */}
        {location.name && (
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-700/80 text-white text-[10px] font-medium max-w-[260px] truncate">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{location.name}</span>
          </div>
        )}

        {/* GPS Coords */}
        {location.lat !== 0 && (
          <p className="text-[10px] text-slate-500 font-mono">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        )}
      </div>

      {/* Error warning */}
      {errorMsg && !permissionDenied && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-400">{errorMsg}</p>
        </div>
      )}

      {/* Shutter Button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleCapture}
          disabled={capturing || loading || !streamReady || !faceDetected}
          className="group relative"
        >
          {/* Outer ring */}
          <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 ${
            !capturing && !loading && streamReady && faceDetected
              ? "bg-white hover:scale-105 active:scale-95 shadow-lg shadow-white/10"
              : "bg-slate-700 cursor-not-allowed"
          }`}>
            {/* Inner circle */}
            <div className={`w-[54px] h-[54px] rounded-full border-[3px] transition-all duration-300 ${
              !capturing && !loading && streamReady && faceDetected
                ? "border-slate-300 group-hover:border-slate-400"
                : "border-slate-600"
            } flex items-center justify-center`}>
              {/* Center dot */}
              <div className={`w-[32px] h-[32px] rounded-full transition-all duration-300 ${
                !capturing && !loading && streamReady && faceDetected
                  ? "bg-red-500 shadow-inner"
                  : "bg-slate-500"
              }`} />
            </div>
          </div>
        </button>
        <p className="text-xs font-bold text-slate-400">
          {!faceDetected && streamReady ? "Wajah tidak terdeteksi" : capturing ? "Memproses..." : buttonLabel}
        </p>
      </div>
    </div>
  );
}
