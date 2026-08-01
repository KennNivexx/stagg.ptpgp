"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CameraOff, MapPin, CheckCircle, AlertTriangle, RefreshCw, UserCheck, UserX, Eye } from "lucide-react";
import { findBestFaceMatch, type FaceReference } from "@/lib/face-recognition";

// Models served locally from /public/models — NOT from external CDN
const MODEL_URL = "/models";

interface Location {
  lat: number;
  lng: number;
  name: string;
}

export interface RecognitionResult {
  descriptor: Float32Array;
  employeeId: string;
  employeeName: string;
  distance: number;
}

interface CameraCaptureProps {
  onCapture?: (photoBase64: string, location: Location, recognition?: RecognitionResult) => void;
  buttonLabel?: string;
  employeeName?: string;
  mode?: "detection" | "recognition" | "registration";
  referenceDescriptors?: FaceReference[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Eye Aspect Ratio (Soukupová & Čech) from 6 landmark points of one eye —
 * drops sharply when the eye closes. Used for a cheap liveness check (a
 * held-up photo can't blink) without any extra model beyond the 68-point
 * landmarks this component already loads. */
function eyeAspectRatio(pts: { x: number; y: number }[]): number {
  const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
  return (dist(pts[1], pts[5]) + dist(pts[2], pts[4])) / (2 * dist(pts[0], pts[3]));
}

const EAR_CLOSED_THRESHOLD = 0.22;

export default function CameraCapture({
  onCapture,
  buttonLabel = "Ambil Foto",
  employeeName = "Karyawan",
  mode = "detection",
  referenceDescriptors = [],
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDescriptorRef = useRef<Float32Array | null>(null);
  const recognizedNameRef = useRef("");
  const recognitionConfidenceRef = useRef(0);
  const recognitionMatchedRef = useRef(false);
  const eyeStateRef = useRef<"open" | "closed">("open");
  const blinkVerifiedRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [modelError, setModelError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [gpsError, setGpsError] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [location, setLocation] = useState<Location>({ lat: 0, lng: 0, name: "" });
  const [capturing, setCapturing] = useState(false);
  const router = useRouter();

  const [recognizedName, setRecognizedName] = useState("");
  const [recognitionConfidence, setRecognitionConfidence] = useState(0);
  const [recognitionDistance, setRecognitionDistance] = useState(0);
  const [recognitionMatched, setRecognitionMatched] = useState(false);
  const [blinkVerified, setBlinkVerified] = useState(false);

  const isRecognitionMode = mode === "recognition";
  const isRegistrationMode = mode === "registration";
  const needsDescriptors = isRecognitionMode || isRegistrationMode;

  const faceapiRef = useRef<typeof import("face-api.js") | null>(null);

  // ── Load face-api.js + Models ─────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadModels() {
      try {
        // Dynamic import: face-api.js (~5MB) only loaded when camera opens
        if (!faceapiRef.current) {
          faceapiRef.current = await import("face-api.js");
        }
        const faceapi = faceapiRef.current;
        const loads: Promise<void>[] = [
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
        ];
        if (needsDescriptors) {
          loads.push(faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL));
        }
        await Promise.all(loads);
        if (!cancelled) {
          setModelsLoaded(true);
          setModelError("");
        }
      } catch (err) {
        console.error("[CameraCapture] Model load error:", err);
        if (!cancelled) {
          setModelError("Gagal memuat model face recognition. Pastikan folder /public/models tersedia.");
          setLoading(false);
        }
      }
    }
    loadModels();
    return () => {
      cancelled = true;
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    };
  }, [mode, needsDescriptors]);

  // ── Start Camera + GPS ───────────────────────────────────────────
  useEffect(() => {
    if (!modelsLoaded || cameraError) return;
    let cancelled = false;

    async function startCamera() {
      try {
        // Try HD first, fall back to SD
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        }
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch((e) => console.error("[CameraCapture] Video play failed:", e));
        }
        setStreamReady(true);
        setLoading(false);
      } catch (err) {
        console.error("[CameraCapture] Camera error:", err);
        if (!cancelled) {
          setCameraError("Izin kamera diperlukan untuk fitur ini. Silakan izinkan di pengaturan browser.");
          setLoading(false);
        }
      }
    }

    function startGps() {
      if (!navigator.geolocation) { setGpsError("GPS tidak didukung di perangkat ini."); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          const { latitude: lat, longitude: lng } = pos.coords;
          let name = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
              { headers: { "Accept-Language": "id" } }
            );
            const json = await res.json();
            if (json?.display_name) name = json.display_name;
          } catch { /* use coords as fallback */ }
          if (!cancelled) setLocation({ lat, lng, name });
        },
        () => { if (!cancelled) setGpsError("Lokasi tidak tersedia — absensi tetap bisa dilakukan tanpa GPS."); },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    }

    startCamera();
    startGps();
    return () => { cancelled = true; };
  }, [modelsLoaded, cameraError]);

  // ── Detection Loop ───────────────────────────────────────────────
  useEffect(() => {
    if (!streamReady) return;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!video || !overlay) return;

    const faceapi = faceapiRef.current;
    if (!faceapi) return;
    const detectOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,      // better accuracy than default 224
      scoreThreshold: 0.4, // lower threshold → detects more easily
    });

    const id = setInterval(async () => {
      if (video.readyState < 2) return; // video not ready yet
      try {
        // Size canvas to match the DISPLAYED video size (not native resolution)
        const { videoWidth: vw, videoHeight: vh } = video;
        if (vw === 0 || vh === 0) return;
        overlay.width = vw;
        overlay.height = vh;
        const ctx = overlay.getContext("2d");

        if (needsDescriptors) {
          const detections = await faceapi
            .detectAllFaces(video, detectOptions)
            .withFaceLandmarks(true) // true = use tiny landmark model
            .withFaceDescriptors();

          const detected = detections.length > 0;
          setFaceDetected(detected);

          ctx?.clearRect(0, 0, overlay.width, overlay.height);

          if (detected && ctx) {
            const det = detections[0];
            const { x, y, width, height } = det.detection.box;
            lastDescriptorRef.current = det.descriptor;

            // Bounding box
            ctx.strokeStyle = isRecognitionMode ? "#3b82f6" : "#22c55e";
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, width, height);

            // Face matching — do this BEFORE drawing label
            if (isRecognitionMode && referenceDescriptors.length > 0) {
              // 0.45 matches face-api.js's own documented sane threshold for
              // its 128-dim descriptor space — was previously 0.72, loose
              // enough that visibly different faces were accepted as a match.
              const match = findBestFaceMatch(det.descriptor, referenceDescriptors, 0.45);
              if (match) {
                const matchLabel = match.distance < 0.35 ? "Sangat Cocok" : "Cocok";
                setRecognizedName(match.employeeName);
                setRecognitionConfidence(Math.round(matchLabel === "Sangat Cocok" ? 95 : 85));
                setRecognitionDistance(match.distance);
                setRecognitionMatched(match.distance < 0.45);
                recognizedNameRef.current = `${match.employeeName} · ${matchLabel}`;
                recognitionMatchedRef.current = match.distance < 0.45;
              } else {
                setRecognizedName(""); setRecognitionConfidence(0);
                setRecognitionDistance(1); setRecognitionMatched(false);
                recognizedNameRef.current = "";
                recognitionMatchedRef.current = false;
              }

              // Liveness: require one full open→closed→open blink cycle before
              // the shutter unlocks, so a held-up photo (which can't blink)
              // can't be used to clock in for someone else. Landmarks 36-41 =
              // left eye, 42-47 = right eye (standard 68-point scheme).
              const pts = det.landmarks.positions;
              if (pts.length >= 48) {
                const ear = (eyeAspectRatio(pts.slice(36, 42)) + eyeAspectRatio(pts.slice(42, 48))) / 2;
                const eyesClosed = ear < EAR_CLOSED_THRESHOLD;
                if (eyesClosed && eyeStateRef.current === "open") {
                  eyeStateRef.current = "closed";
                } else if (!eyesClosed && eyeStateRef.current === "closed") {
                  eyeStateRef.current = "open";
                  blinkVerifiedRef.current = true;
                  setBlinkVerified(true);
                }
              }
            }

            // Label for recognition mode (drawn AFTER matching)
            if (isRecognitionMode && recognizedNameRef.current) {
              const labelText = recognizedNameRef.current;
              const fontSize = Math.max(12, Math.floor(width / 10));
              ctx.font = `bold ${fontSize}px sans-serif`;
              const bg = recognitionMatchedRef.current ? "rgba(34,197,94,0.92)" : "rgba(239,68,68,0.9)";
              const tw = ctx.measureText(labelText).width + 16;
              ctx.fillStyle = bg;
              ctx.fillRect(x, y - fontSize - 14, tw, fontSize + 10);
              ctx.fillStyle = "#fff";
              ctx.fillText(labelText, x + 8, y - 6);
            }
          } else {
            lastDescriptorRef.current = null;
            setRecognizedName(""); setRecognitionConfidence(0);
            setRecognitionMatched(false);
            recognizedNameRef.current = ""; recognitionConfidenceRef.current = 0;
            recognitionMatchedRef.current = false;
            // Face left the frame — require a fresh blink if it reappears,
            // so swapping in a different photo can't inherit a stale liveness pass.
            eyeStateRef.current = "open";
            blinkVerifiedRef.current = false;
            setBlinkVerified(false);
          }
        } else {
          // Detection-only mode (no descriptor needed)
          const detections = await faceapi.detectAllFaces(video, detectOptions);
          setFaceDetected(detections.length > 0);
          ctx?.clearRect(0, 0, overlay.width, overlay.height);
          if (ctx) {
          detections.forEach((d: { box: { x: number; y: number; width: number; height: number } }) => {
              const { x, y, width, height } = d.box;
              ctx.strokeStyle = "#22c55e";
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, width, height);
            });
          }
        }
      } catch (err) {
        // Only log unexpected errors, not routine "model not ready" ones
        if (String(err).includes("not yet loaded")) return;
        console.warn("[CameraCapture] Detection error:", err);
      }
    }, 400); // slightly faster than before

    intervalRef.current = id;
    return () => { clearInterval(id); intervalRef.current = null; };
  }, [streamReady, isRecognitionMode, isRegistrationMode, needsDescriptors, referenceDescriptors]);

  // ── Capture Photo ────────────────────────────────────────────────
  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onCapture || capturing) return;
    setCapturing(true);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) { setCapturing(false); return; }

    // Mirror the canvas to match the flipped video display
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform

    // Watermark
    const now = new Date();
    const lines = [employeeName, formatTime(now), formatDate(now), location.name || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`];
    const fontSize = Math.max(13, Math.floor(canvas.width / 38));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.strokeStyle = "rgba(0,0,0,0.6)";
    ctx.lineWidth = 2;
    ctx.textAlign = "left";
    const pad = Math.floor(fontSize * 0.75);
    const lh = fontSize * 1.45;
    const startY = canvas.height - pad - (lines.length - 1) * lh;
    lines.forEach((line, i) => {
      const y = startY + i * lh;
      ctx.strokeText(line, pad, y);
      ctx.fillText(line, pad, y);
    });

    const base64 = canvas.toDataURL("image/jpeg", 0.88);

    let recognitionResult: RecognitionResult | undefined;
    if (lastDescriptorRef.current) {
      if (isRecognitionMode && recognitionMatched) {
        recognitionResult = {
          descriptor: lastDescriptorRef.current,
          employeeId: "",
          employeeName: recognizedName,
          distance: recognitionDistance,
        };
      } else if (isRegistrationMode) {
        recognitionResult = { descriptor: lastDescriptorRef.current, employeeId: "", employeeName: "", distance: 0 };
      }
    }

    onCapture(base64, location, recognitionResult);
    setCapturing(false);
  }, [employeeName, location, onCapture, capturing, isRecognitionMode, isRegistrationMode,
      recognitionMatched, recognizedName, recognitionDistance]);

  // ── Render ───────────────────────────────────────────────────────

  if (modelError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
        <AlertTriangle size={40} className="mx-auto text-red-400 mb-3" />
        <p className="text-sm text-red-700 font-semibold">{modelError}</p>
        <p className="text-xs text-red-400 mt-2">Coba refresh halaman. Jika masalah berlanjut, hubungi administrator.</p>
        <button onClick={() => router.refresh()}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700">
          Refresh
        </button>
      </div>
    );
  }

  if (cameraError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
        <CameraOff size={40} className="mx-auto text-red-400 mb-3" />
        <p className="text-sm text-red-700 font-semibold">{cameraError}</p>
        <p className="text-xs text-red-400 mt-2">Buka pengaturan browser › klik ikon kunci di address bar › izinkan kamera</p>
      </div>
    );
  }

  const shutterEnabled = !capturing && !loading && streamReady && (
    isRecognitionMode ? (faceDetected && recognitionMatched && blinkVerified) : faceDetected
  );

  const ringColor = capturing
    ? "border-amber-400"
    : shutterEnabled
      ? "border-emerald-500"
      : "border-slate-400";

  const shutterHint = capturing ? "Memproses..."
    : !streamReady ? "Memuat kamera..."
    : !faceDetected ? "Wajah tidak terdeteksi"
    : isRecognitionMode && !recognitionMatched ? "Wajah tidak dikenali sistem"
    : isRecognitionMode && !blinkVerified ? "Kedipkan mata untuk verifikasi..."
    : buttonLabel;

  return (
    <div className="bg-[#0F172A] rounded-3xl p-5 space-y-4">
      {loading && (
        <div className="flex flex-col items-center justify-center py-10">
          <RefreshCw size={28} className="text-slate-500 animate-spin mb-3" />
          <p className="text-sm text-slate-400">Memuat model face recognition...</p>
          <p className="text-xs text-slate-500 mt-1">Proses ini memakan waktu beberapa detik</p>
        </div>
      )}

      {/* Camera View */}
      <div className="flex justify-center">
        <div className={`relative w-full max-w-[280px] aspect-square rounded-full overflow-hidden border-[3px] ${ringColor} transition-colors duration-300 shadow-2xl bg-slate-900`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
            onLoadedMetadata={() => setLoading(false)}
          />
          {/* Canvas MUST NOT be flipped — face-api draws in native video space */}
          <canvas
            ref={overlayRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: "scaleX(-1)" }} // mirror canvas to match flipped video
          />
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-col items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
          faceDetected ? "bg-emerald-500/90 text-white" : "bg-amber-500/90 text-white"
        }`}>
          {faceDetected
            ? <><CheckCircle size={13} /> Wajah terdeteksi</>
            : <><AlertTriangle size={13} /> Wajah tidak terdeteksi — arahkan wajah ke kamera</>
          }
        </div>

        {isRecognitionMode && faceDetected && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
            recognitionMatched ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
          }`}>
            {recognitionMatched
              ? <><UserCheck size={13} /> {recognizedName} — {recognitionConfidence >= 90 ? "Sangat Cocok" : recognitionConfidence >= 80 ? "Cocok" : "Cukup Cocok"}</>
              : <><UserX size={13} /> {recognizedName ? `${recognizedName}? (tidak yakin)` : "Wajah tidak dikenali"}</>
            }
          </div>
        )}

        {isRecognitionMode && faceDetected && recognitionMatched && !blinkVerified && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/90 text-white animate-pulse">
            <Eye size={13} /> Kedipkan mata untuk verifikasi wajah asli
          </div>
        )}

        {location.name && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/80 text-white text-[10px] font-medium max-w-[280px]">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{location.name}</span>
          </div>
        )}
        {location.lat !== 0 && (
          <p className="text-[9px] text-slate-500 font-mono">
            {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
          </p>
        )}
      </div>

      {gpsError && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center">
          <p className="text-xs text-amber-400">
            <MapPin size={11} className="inline mr-1" />
            {gpsError}
          </p>
        </div>
      )}

      {/* Shutter */}
      <div className="flex flex-col items-center gap-2">
        <button onClick={handleCapture} disabled={!shutterEnabled} className="group">
          <div className={`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all duration-200 ${
            shutterEnabled
              ? "bg-white hover:scale-105 active:scale-95 shadow-lg"
              : "bg-slate-700 cursor-not-allowed opacity-60"
          }`}>
            <div className={`w-[52px] h-[52px] rounded-full border-[3px] flex items-center justify-center ${
              shutterEnabled ? "border-slate-300" : "border-slate-600"
            }`}>
              <div className={`w-[30px] h-[30px] rounded-full ${
                shutterEnabled ? "bg-pgp-red" : "bg-slate-500"
              }`} />
            </div>
          </div>
        </button>
        <p className="text-xs font-semibold text-slate-400 text-center max-w-[240px]">{shutterHint}</p>
      </div>
    </div>
  );
}
