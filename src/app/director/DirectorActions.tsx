"use client";

import { useState } from "react";
import { updateRequestStatus } from "@/app/actions/requests";
import { useRouter } from "next/navigation";

interface Props {
  id: string;
}

export default function DirectorActions({ id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const handleAction = async (status: string) => {
    setLoading(status === "Disetujui" ? "approve" : "reject");
    const result = await updateRequestStatus(id, status) as { success?: boolean; error?: string };
    setLoading(null);
    if (result?.error) {
      setToast({ msg: result.error, ok: false });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    const ok = status === "Disetujui";
    setToast({ msg: ok ? "Request disetujui!" : "Request ditolak.", ok });
    setTimeout(() => setToast(null), 3000);
    router.refresh();
  };

  return (
    <>
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg border text-sm font-bold ${
          toast.ok
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {toast.msg}
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleAction("Disetujui")}
          disabled={loading !== null}
          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
        >
          {loading === "approve" ? "..." : "Approve"}
        </button>
        <button
          onClick={() => handleAction("Ditolak")}
          disabled={loading !== null}
          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
        >
          {loading === "reject" ? "..." : "Tolak"}
        </button>
      </div>
    </>
  );
}
