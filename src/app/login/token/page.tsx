"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { loginWithToken } from "@/app/actions/auth";
import { Loader2 } from "lucide-react";

function TokenContent() {
  const params = useSearchParams();
  const token = params.get("t");

  useEffect(() => {
    if (!token) return;
    loginWithToken(token);
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCF9F6] font-sans">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Link login tidak valid.</p>
          <p className="text-sm text-slate-500 mt-2">Silakan hubungi HRD untuk mendapatkan link baru.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCF9F6] font-sans">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin mx-auto text-pgp-red mb-4" />
        <p className="text-sm text-slate-500">Memverifikasi login...</p>
      </div>
    </div>
  );
}

export default function TokenLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FCF9F6] font-sans">
        <Loader2 size={32} className="animate-spin mx-auto text-pgp-red" />
      </div>
    }>
      <TokenContent />
    </Suspense>
  );
}
