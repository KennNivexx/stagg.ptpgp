"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, UserCog, User } from "lucide-react";
import { getEmployeeById, updateEmployeeAsSuperadmin } from "@/app/actions/hrd";

type Employee = Record<string, unknown>;

function parseRole(address: unknown): string {
  if (!address || typeof address !== "string") return "employee";
  try {
    const parsed = JSON.parse(address);
    return parsed.__auth__?.role || "employee";
  } catch {
    return "employee";
  }
}

function getRoleIcon(role: string) {
  if (role === "superadmin")
    return <ShieldCheck size={14} className="text-amber-500" />;
  if (role === "hrd")
    return <UserCog size={14} className="text-emerald-500" />;
  return <User size={14} className="text-slate-400" />;
}

function getRoleBadge(role: string) {
  const base = "px-2.5 py-1 rounded-lg text-xs font-bold";
  if (role === "superadmin") return `${base} bg-amber-50 text-amber-700`;
  if (role === "hrd") return `${base} bg-emerald-50 text-emerald-700`;
  return `${base} bg-slate-100 text-slate-600`;
}

function getRoleLabel(role: string) {
  if (role === "superadmin") return "Superadmin";
  if (role === "hrd") return "HRD";
  return "Employee";
}

export default function SuperadminEditEmployee({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentRole, setCurrentRole] = useState("employee");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    getEmployeeById(id)
      .then((data) => {
        if (!cancelled) {
          if (data) {
            setEmployee(data as Employee);
            setCurrentRole(parseRole((data as Employee).address));
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Gagal memuat data karyawan.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    setGeneratedPassword("");

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateEmployeeAsSuperadmin(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Data user berhasil diperbarui.");
        if (res.password) {
          setGeneratedPassword(res.password);
          setShowPassword(true);
        }
        setNewPassword("");
      }
    } catch {
      setError("Terjadi kesalahan saat menyimpan.");
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let pw = "";
    for (let i = 0; i < 12; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pw);
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 p-12 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Memuat data user...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 text-sm font-semibold">
          User tidak ditemukan.
        </div>
        <Link
          href="/superadmin/employees"
          className="inline-flex items-center text-sm text-amber-600 hover:text-amber-700 mt-4 font-semibold"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Manajemen User
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/superadmin/employees"
          className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Manajemen User
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit User</h1>
        <p className="text-sm text-gray-500 mt-1">
          Ubah data akun, email, password, dan role pengguna.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold">
          {success}
        </div>
      )}

      {generatedPassword && showPassword && (
        <div className="mb-6 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
          <p className="text-sm font-bold mb-1">Password Baru:</p>
          <code className="bg-amber-100 px-3 py-1.5 rounded-lg text-sm font-mono text-amber-900 block break-all">
            {generatedPassword}
          </code>
          <p className="text-xs text-amber-600 mt-1">
            Salin password ini sekarang. Tidak akan ditampilkan lagi.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="id" value={id} />

          <div className="p-8 border-b border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <h2 className="text-lg font-bold text-[#1A2530]">
                Informasi Akun
              </h2>
              <span className={getRoleBadge(currentRole)}>
                {getRoleIcon(currentRole)}
                <span className="ml-1">{getRoleLabel(currentRole)}</span>
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="full_name"
                  required
                  defaultValue={employee.full_name as string}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={employee.email as string}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Mengubah email akan memperbarui kredensial login.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Departemen
                </label>
                <select
                  name="department"
                  defaultValue={employee.department as string}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors bg-white"
                >
                  <option>Operasional</option>
                  <option>Administrasi</option>
                  <option>Keuangan</option>
                  <option>IT & Sistem</option>
                  <option>HRD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  name="position"
                  defaultValue={employee.position as string}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Status Karyawan
                </label>
                <select
                  name="status"
                  defaultValue={employee.status as string}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors bg-white"
                >
                  <option>Tetap</option>
                  <option>Kontrak</option>
                  <option>Magang</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-8 border-b border-slate-100 bg-amber-50/30">
            <h2 className="text-lg font-bold text-[#1A2530] mb-6">
              Role & Keamanan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Role Pengguna
                </label>
                <select
                  name="role"
                  defaultValue={currentRole}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors bg-white"
                >
                  <option value="employee">Employee</option>
                  <option value="hrd">HRD</option>
                  <option value="superadmin">Superadmin</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">
                  Mengubah role akan mengubah hak akses pengguna.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Reset Password (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="new_password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Kosongkan jika tidak ingin reset"
                    className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shrink-0"
                  >
                    Generate
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Isi untuk mereset password. Kosongkan untuk mempertahankan
                  password lama.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 flex justify-end gap-4 bg-gray-50">
            <Link
              href="/superadmin/employees"
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
