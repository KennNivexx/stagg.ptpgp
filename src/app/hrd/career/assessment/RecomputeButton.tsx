"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { recomputeAllCareerAssessments } from "@/app/actions/career-development";

export default function RecomputeButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleClick = () => {
    const period = new Date().toISOString().slice(0, 7);
    startTransition(async () => {
      const res = await recomputeAllCareerAssessments(period);
      if ("error" in res) { setMessage(res.error); return; }
      setMessage(`${res.count} career score dihitung ulang untuk periode ${period}.`);
      window.location.reload();
    });
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <button
        onClick={handleClick}
        disabled={pending}
        className="flex items-center gap-2 px-4 py-2 bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold rounded-xl disabled:opacity-50"
      >
        <RefreshCw size={16} className={pending ? "animate-spin" : ""} />
        {pending ? "Menghitung..." : "Hitung Ulang Career Score"}
      </button>
      {message && <span className="text-xs text-slate-500">{message}</span>}
    </div>
  );
}
