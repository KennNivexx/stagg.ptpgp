"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginWithToken } from "@/app/actions/auth";
import { Loader2 } from "lucide-react";

function TokenContent() {
  const params = useSearchParams();
  const token = params.get("t");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    // loginWithToken() redirects internally on success (via next/navigation's
    // redirect(), which the framework handles transparently for a call like
    // this that isn't wrapped in the CALLER's own try/catch). On failure it
    // resolves to {error} instead of throwing — this used to be silently
    // discarded, leaving the spinner spinning forever with no way to recover.
    loginWithToken(token).then((res) => {
      if (res?.error) setError(res.error);
    });
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCF9F6] font-sans">
        <div className="text-center max-w-sm px-6">
          <p className="text-red-600 font-semibold">{error}</p>
          <a href="/login" className="inline-block mt-4 text-sm font-bold text-pgp-red hover:text-pgp-red-hover">Kembali ke halaman login</a>
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
