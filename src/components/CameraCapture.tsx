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
        if (!cancelled) {
          setCameraError("Gagal memuat model deteksi wajah.");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!modelsLoaded || cameraError) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStreamReady(true);
      } catch {
        if (!cancelled) {
          setCameraError("Izin kamera & lokasi wajib untuk absensi. Silakan izinkan di pengaturan browser.");
          setLoading(false);
        }
      }
    }

    function getGps() {
      if (!navigator.geolocation) {
        if (!cancelled) setGpsError("GPS tidak didukung di browser ini.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const json = await res.json();
            if (json?.display_name) name = json.display_name;
          } catch {}
          if (!cancelled) setLocation({ lat, lng, name });
        },
        () => {
          if (!cancelled) {
            setGpsError("Izin kamera & lokasi wajib untuk absensi. Silakan izinkan di pengaturan browser.");
          }
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }

    start();
    getGps();

    return () => {
      cancelled = true;
    };
  }, [modelsLoaded, cameraError]);

  useEffect(() => {
    if (!modelsLoaded || !streamReady) return;

    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;

    const id = setInterval(async () => {
      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        setFaceDetected(detections.length > 0);

        const ctx = overlay.getContext("2d");
        if (!ctx) return;

        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;
        ctx.clearRect(0, 0, overlay.width, overlay.height);

        detections.forEach((d) => {
          const { x, y, width, height } = d.box;
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
        });
      } catch {}
    }, 500);

    intervalRef.current = id;

    return () => {
      clearInterval(id);
      intervalRef.current = null;
    };
  }, [modelsLoaded, streamReady]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onCapture || capturing) return;

    setCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setCapturing(false); return; }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const now = new Date();
    const lines = [employeeName, formatTime(now), formatDate(now), location.name || `${location.lat}, ${location.lng}`];

    const fontSize = Math.max(14, Math.floor(canvas.width / 40));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 2;
    ctx.textAlign = "left";

    const padding = Math.floor(fontSize * 0.8);
    const lineHeight = fontSize * 1.4;
    const startY = canvas.height - padding - (lines.length - 1) * lineHeight;

    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      ctx.strokeText(line, padding, y);
      ctx.fillText(line, padding, y);
    });

    const base64 = canvas.toDataURL("image/jpeg", 0.8);
    onCapture(base64, location);
    setCapturing(false);
  }, [employeeName, location, onCapture, capturing]);

  const errorMsg = cameraError || gpsError;
  const permissionDenied = errorMsg.includes("Izin kamera");

  if (errorMsg && permissionDenied) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <CameraOff size={40} className="mx-auto text-red-400 mb-3" />
        <p className="text-sm text-red-700 font-semibold">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <RefreshCw size={40} className="mx-auto text-amber-500 mb-3 animate-spin" />
          <p className="text-sm text-amber-700 font-semibold">Memuat deteksi wajah...</p>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          onLoadedMetadata={() => setLoading(false)}
        />
        <canvas ref={overlayRef} className="absolute inset-0 w-full h-full" />

        {!loading && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                faceDetected ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"
              }`}
            >
              {faceDetected ? (
                <span className="flex items-center gap-1"><CheckCircle size={14} /> Wajah terdeteksi</span>
              ) : (
                <span className="flex items-center gap-1"><AlertTriangle size={14} /> Wajah tidak terdeteksi</span>
              )}
            </span>
            {location.name && (
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800/80 text-white flex items-center gap-1 truncate max-w-[60%]">
                <MapPin size={12} /> {location.name.slice(0, 40)}
              </span>
            )}
          </div>
        )}

        {location.lat !== 0 && (
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl text-[10px] font-semibold bg-slate-800/70 text-white">
            Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
          </div>
        )}
      </div>

      {errorMsg && !permissionDenied && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-xs text-amber-700">{errorMsg}</p>
        </div>
      )}

      <button
        onClick={handleCapture}
        disabled={!faceDetected || capturing || loading}
        className={`w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
          faceDetected && !capturing && !loading
            ? "bg-[#0F172A] text-white hover:bg-slate-800 shadow-lg shadow-slate-900/15 active:scale-[0.98]"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        <Camera size={18} />
        {capturing ? "Memproses..." : buttonLabel}
      </button>
    </div>
  );
}
