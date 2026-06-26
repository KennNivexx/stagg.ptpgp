"use client";

import { useState } from "react";
import { Mail, Key, Clock, AlertTriangle, CheckCircle2, Copy, X } from "lucide-react";
import { resetUserPasswordByEmail } from "@/app/actions/hrd";

function getRoleBadge(role: string) {
  const base = "px-2 py-1 rounded text-[11px] font-bold";
  switch (role) {
    case "superadmin": return `${base} bg-red-100 text-red-700`;
    case "hrd": return `${base} bg-emerald-100 text-emerald-700`;
    case "director": return `${base} bg-purple-100 text-purple-700`;
    case "department_manager": return `${base} bg-indigo-100 text-indigo-700`;
    case "employee": return `${base} bg-slate-100 text-slate-600`;
    case "applicant": return `${base} bg-amber-100 text-amber-700`;
    default: return `${base} bg-slate-100 text-slate-600`;
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "superadmin": return "Superadmin";
    case "hrd": return "HRD";
    case "director": return "Direktur";
    case "department_manager": return "Dept. Manager";
    case "employee": return "Karyawan";
    case "applicant": return "Pelamar";
    default: return role;
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UserTable({ users }: { users: Record<string, unknown>[] }) {
  const [resetState, setResetState] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async (email: string, name: string) => {
    if (!confirm(`Reset password untuk "${name}" (${email})?\nPassword baru akan ditampilkan sekali.`)) return;

    setLoading(email);
    setError(null);
    setResetState(null);
    try {
      const res = await resetUserPasswordByEmail(email);
      if (res?.error) {
        setError(res.error);
      } else if (res?.password) {
        setResetState({ email, password: res.password });
      }
    } catch {
      setError("Gagal mereset password.");
    }
    setLoading(null);
  };

  const copyPassword = async () => {
    if (resetState) {
      await navigator.clipboard.writeText(resetState.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError(null)} className="ml-auto hover:text-red-900"><X size={14} /></button>
        </div>
      )}

      {resetState && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Key size={20} className="text-amber-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-800 mb-1">Password Baru — {resetState.email}</p>
            <code className="text-sm font-mono font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-lg select-all">
              {resetState.password}
            </code>
            <p className="text-[11px] text-amber-600 mt-1">Password hanya ditampilkan sekali. Salin sekarang.</p>
          </div>
          <button
            onClick={copyPassword}
            className="px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-bold text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? "Tersalin" : "Salin"}
          </button>
          <button onClick={() => setResetState(null)} className="text-amber-400 hover:text-amber-600">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Akun</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Kedaluwarsa</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Dibuat</th>
                <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => {
                const role = (u.role as string) || "employee";
                const isTemp = (u.is_temporary as boolean) || false;
                const expiresAt = (u.expires_at as string) || null;
                const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;
                const email = (u.email as string) || "";
                const name = (u.full_name as string) || "";

                return (
                  <tr key={u.id as string} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 text-sm">{name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <Mail size={11} className="shrink-0" /> {email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={getRoleBadge(role)}>{getRoleLabel(role)}</span>
                    </td>
                    <td className="px-4 py-3">
                      {isTemp ? (
                        <span className="px-2 py-1 rounded text-[11px] font-bold bg-orange-100 text-orange-700">
                          Sementara
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">
                          Tetap
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {expiresAt ? (
                        <span className={`text-xs flex items-center gap-1 ${isExpired ? "text-red-600" : "text-amber-600"}`}>
                          <Clock size={11} />
                          {isExpired ? "Kedaluwarsa" : formatDateTime(expiresAt)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">
                        {formatDateTime(u.created_at as string)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleReset(email, name)}
                        disabled={loading === email}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Key size={12} />
                        {loading === email ? "..." : "Reset PW"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Total: <span className="font-bold text-slate-800">{users.length}</span> akun
          </p>
          <p className="text-[10px] text-slate-400">
            Reset password menghasilkan password numerik 8 digit.
          </p>
        </div>
      </div>
    </>
  );
}
