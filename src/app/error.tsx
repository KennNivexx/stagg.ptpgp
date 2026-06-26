"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-amber-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Halaman Tidak Dapat Dimuat</h2>
        <p className="text-sm text-slate-500 mb-6">
          Silakan coba muat ulang halaman ini.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <RefreshCw size={14} />
            Muat Ulang
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            <Home size={14} />
            Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
