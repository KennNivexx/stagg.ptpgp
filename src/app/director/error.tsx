"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function DirectorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[director-error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center bg-white rounded-xl p-8 border border-slate-200">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-600" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-2">Gagal Memuat Portal Direktur</h2>
        <p className="text-xs text-slate-500 mb-5">Terjadi kesalahan saat memuat data. Silakan coba lagi.</p>
        <button
          onClick={reset}
          className="flex items-center gap-2 mx-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <RefreshCw size={14} />
          Muat Ulang
        </button>
      </div>
    </div>
  );
}
