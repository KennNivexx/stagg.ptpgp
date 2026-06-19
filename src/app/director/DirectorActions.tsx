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
  const [toast, setToast] = useState("");

  const handleAction = async (status: string) => {
    setLoading(status === "Disetujui" ? "approve" : "reject");
    await updateRequestStatus(id, status);
    setLoading(null);
    setToast(status === "Disetujui" ? "Request disetujui!" : "Request ditolak.");
    setTimeout(() => setToast(""), 3000);
    router.refresh();
  };

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
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
