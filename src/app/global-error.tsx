"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-xl border border-slate-200 text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Terjadi Kesalahan Kritis</h1>
          <p className="text-sm text-slate-500 mb-6">
            Sistem mengalami kendala yang tidak terduga. Tim teknis telah diberitahu.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <RefreshCw size={14} />
              Coba Lagi
            </button>
            <a
              href="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
            >
              <Home size={14} />
              Beranda
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
