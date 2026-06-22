"use client";
import { useState, useEffect, useCallback } from "react";
import CameraCapture from "@/components/CameraCapture";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { getTodayAttendance, clockIn, clockOut } from "@/app/actions/attendance";
import { getCookie } from "@/lib/cookie-client";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

export default function EmployeeAttendancePage() {
  const [today, setToday] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAction, setLastAction] = useState<"in" | "out" | null>(null);
  const [employeeName] = useState(() => getCookie("user_name") || "Karyawan");

  const fetchToday = useCallback(async () => {
    const data = await getTodayAttendance();
    setToday(data || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  useAutoRefresh(() => { fetchToday(); });

  const handleClockIn = useCallback(
    async (photoBase64: string, location: { lat: number; lng: number; name: string }) => {
      setResult("Memproses clock-in...");
      const fd = new FormData();
      fd.append("photo_url", photoBase64);
      fd.append("latitude", String(location.lat));
      fd.append("longitude", String(location.lng));
      fd.append("location_name", location.name);
      const res = await clockIn(fd);
      if (res?.error) { setResult(res.error); return; }
      setLastAction("in");
      setShowSuccess(true);
      setResult("");
      await fetchToday();
    },
    [fetchToday]
  );

  const handleClockOut = useCallback(
    async (photoBase64: string, location: { lat: number; lng: number; name: string }) => {
      setResult("Memproses clock-out...");
      const fd = new FormData();
      fd.append("photo_url", photoBase64);
      fd.append("latitude", String(location.lat));
      fd.append("longitude", String(location.lng));
      fd.append("location_name", location.name);
      const res = await clockOut(fd);
      if (res?.error) { setResult(res.error); return; }
      setLastAction("out");
      setShowSuccess(true);
      setResult("");
      await fetchToday();
    },
    [fetchToday]
  );

  const checkedIn = !!(today && today.check_in);
  const checkedOut = !!(today && today.check_out);
  const bothDone = checkedIn && checkedOut;

  const now = new Date();
  const currentHour = now.getHours();
  // Checkout cutoff hour (default 15:00 WIB / 3 PM)
  const CHECKOUT_HOUR = parseInt(process.env.NEXT_PUBLIC_CHECKOUT_HOUR || "15", 10);
  const afterCutoff = currentHour >= CHECKOUT_HOUR;
  const afterThreePM = afterCutoff; // kept for UI text reference
  const canClockOut = checkedIn && !checkedOut && afterCutoff;

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
    <div className="p-6 lg:p-8 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Absensi Hari Ini</h1>
      <p className="text-sm text-gray-500 mb-6">Lakukan check-in dan check-out dengan foto selfie.</p>

      {/* Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowSuccess(false)} />
          <div className="relative bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full animate-in zoom-in-50 duration-300">
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
            <button
              onClick={() => setShowSuccess(false)}
              className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-colors"
            >
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

      {/* Checked in but before 3 PM */}
      {checkedIn && !checkedOut && !afterThreePM && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800">✅ Sudah Hadir</h2>
            <p className="text-sm text-slate-500 mt-1">{employeeName}</p>
            <p className="text-xs text-slate-400 mt-0.5">Check-in: {new Date(today.check_in as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            <Clock size={14} className="inline mr-1" />
            Check-out tersedia setelah pukul 15:00 WIB
          </div>
        </div>
      )}

      {/* Can clock out (after 3 PM) */}
      {canClockOut && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl"><Clock size={20} /></div>
            <div>
              <p className="text-sm font-bold text-slate-800">{employeeName} — Sudah Hadir</p>
              <p className="text-xs text-slate-400">Check-in: {new Date(today.check_in as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </div>
          {result && (
            <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${result.includes("berhasil") || !result ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {result}
            </div>
          )}
          <CameraCapture onCapture={handleClockOut} buttonLabel="Clock Out" employeeName={employeeName} />
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
          {result && (
            <div className={`mb-4 p-3 rounded-xl text-xs font-semibold ${result.includes("berhasil") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {result}
            </div>
          )}
          <CameraCapture onCapture={handleClockIn} buttonLabel="Clock In" employeeName={employeeName} />
        </div>
      )}
    </div>
  );
}

