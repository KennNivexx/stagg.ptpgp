"use client";
import { useState, useEffect, useCallback } from "react";
import CameraCapture from "@/components/CameraCapture";
import { getTodayAttendance, clockIn, clockOut } from "@/app/actions/attendance";
import { getCookie } from "@/lib/cookie-client";
import { Calendar, Clock, CheckCircle2 } from "lucide-react";

export default function EmployeeAttendancePage() {
  const [today, setToday] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<string | null>(null);
  const [employeeName] = useState(() => getCookie("user_name") || "Karyawan");

  const fetchToday = useCallback(async () => {
    const data = await getTodayAttendance();
    setToday(data || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getTodayAttendance().then((data) => {
      if (!cancelled) {
        setToday(data || null);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleClockIn = useCallback(
    async (photoBase64: string, location: { lat: number; lng: number; name: string }) => {
      setResult("Memproses clock-in...");
      const fd = new FormData();
      fd.append("photo_url", photoBase64);
      fd.append("latitude", String(location.lat));
      fd.append("longitude", String(location.lng));
      fd.append("location_name", location.name);
      const res = await clockIn(fd);
      if (res?.error) {
        setResult(res.error);
      } else {
        setResult("Clock-in berhasil!");
        await fetchToday();
      }
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
      if (res?.error) {
        setResult(res.error);
      } else {
        setResult("Clock-out berhasil!");
        await fetchToday();
      }
    },
    [fetchToday]
  );

  const checkedIn = today && today.check_in;
  const checkedOut = today && today.check_out;
  const bothDone = checkedIn && checkedOut;
  const status = today?.status as string;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Absensi Hari Ini</h1>
        <p className="text-sm text-gray-500">Lakukan check-in dan check-out dengan foto selfie.</p>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center">
          <p className="text-sm text-slate-400">Memuat data absensi...</p>
        </div>
      ) : bothDone ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center space-y-4">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <h2 className="text-xl font-extrabold text-slate-800">Absensi Hari Ini Selesai</h2>
          <div className="flex items-center justify-center gap-6 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-emerald-500" />
              <span>Check-in: {new Date(today.check_in as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-red-500" />
              <span>Check-out: {new Date(today.check_out as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">Status: {status || "Hadir"}</p>
        </div>
      ) : (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-slate-50 text-slate-700 rounded-xl">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{employeeName}</p>
                <p className="text-xs text-slate-400">
                  {checkedIn ? "Sudah check-in — lakukan check-out" : "Belum check-in hari ini"}
                </p>
              </div>
            </div>

            {result && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                  result.includes("berhasil") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {result}
              </div>
            )}

            {checkedIn && (
              <div className="mb-4 p-3 bg-emerald-50 rounded-xl flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                <CheckCircle2 size={14} />
                Check-in: {new Date(today.check_in as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}

            {checkedIn && !checkedOut ? (
              <CameraCapture
                onCapture={handleClockOut}
                buttonLabel="Clock Out"
                employeeName={employeeName}
              />
            ) : (
              <CameraCapture
                onCapture={handleClockIn}
                buttonLabel="Clock In"
                employeeName={employeeName}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
