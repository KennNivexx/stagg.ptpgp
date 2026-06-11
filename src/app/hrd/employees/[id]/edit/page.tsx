"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { getEmployeeById, updateEmployee, resetEmployeePassword } from "@/app/actions/hrd";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [passwordResult, setPasswordResult] = useState<{ password: string; email: string } | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    department: "Operasional",
    position: "",
    join_date: "",
    status: "Tetap",
  });

  useEffect(() => {
    params.then(({ id }) => {
      setId(id);
      getEmployeeById(id).then((data) => {
        if (!data) {
          setError("Karyawan tidak ditemukan.");
          setLoading(false);
          return;
        }
        setFormData({
          full_name: (data as Record<string, unknown>).full_name as string || "",
          email: (data as Record<string, unknown>).email as string || "",
          phone: (data as Record<string, unknown>).phone as string || "",
          address: (data as Record<string, unknown>).address as string || "",
          department: (data as Record<string, unknown>).department as string || "Operasional",
          position: (data as Record<string, unknown>).position as string || "",
          join_date: (data as Record<string, unknown>).join_date as string || "",
          status: (data as Record<string, unknown>).status as string || "Tetap",
        });
        setLoading(false);
      }).catch(() => {
        setError("Gagal memuat data karyawan.");
        setLoading(false);
      });
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const fd = new FormData();
    fd.append("id", id);
    fd.append("full_name", formData.full_name);
    fd.append("email", formData.email);
    fd.append("phone", formData.phone);
    fd.append("address", formData.address);
    fd.append("department", formData.department);
    fd.append("position", formData.position);
    fd.append("join_date", formData.join_date);
    fd.append("status", formData.status);

    try {
      const res = await updateEmployee(fd);
      if (res.error) {
        setError(res.error);
      } else {
        window.location.href = "/hrd/employees";
      }
    } catch {
      setError("Terjadi kesalahan.");
    }
    setSaving(false);
  };

  const handleResetPassword = async () => {
    setResetting(true);
    setPasswordResult(null);
    setError("");
    try {
      const res = await resetEmployeePassword(id);
      if (res.error) {
        setError(res.error);
      } else {
        setPasswordResult({ password: res.password!, email: res.email! });
      }
    } catch {
      setError("Gagal mereset password.");
    }
    setResetting(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000] mx-auto mb-4" />
          <p className="text-sm text-gray-500">Memuat data karyawan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/hrd/employees" className="inline-flex items-center text-sm text-gray-500 hover:text-pgp-red transition-colors mb-4">
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Data Karyawan
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit Data Karyawan</h1>
        <p className="text-sm text-gray-500 mt-1">Perbarui informasi dan data karyawan yang sudah terdaftar.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-sm text-sm font-semibold">
          {error}
        </div>
      )}

      {passwordResult && (
        <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-sm text-sm">
          <p className="font-bold mb-1">Password berhasil direset!</p>
          <p>Email: <span className="font-mono">{passwordResult.email}</span></p>
          <p>Password baru: <span className="font-mono font-bold">{passwordResult.password}</span></p>
          <p className="text-xs text-emerald-500 mt-2">Salin password di atas, tidak akan ditampilkan lagi.</p>
        </div>
      )}

      <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>

          <div className="p-8 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#1A2530] mb-6">Informasi Pribadi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Nama Lengkap</label>
                <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Email Perusahaan</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Nomor Telepon</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-2">Alamat Lengkap</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" />
              </div>
            </div>
          </div>

          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-[#1A2530] mb-6">Informasi Pekerjaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Departemen</label>
                <select name="department" value={formData.department} onChange={handleChange} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors bg-white">
                  <option>Operasional</option>
                  <option>Administrasi</option>
                  <option>Keuangan</option>
                  <option>IT & Sistem</option>
                  <option>HRD</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Jabatan / Posisi</label>
                <input type="text" name="position" required value={formData.position} onChange={handleChange} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Tanggal Bergabung</label>
                <input type="date" name="join_date" required value={formData.join_date} onChange={handleChange} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Status Karyawan</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-gray-200 p-3 text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none transition-colors bg-white">
                  <option>Tetap</option>
                  <option>Kontrak</option>
                  <option>Magang</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-8 flex justify-between items-center bg-gray-50">
            <button type="button" onClick={handleResetPassword} disabled={resetting} className="px-4 py-2.5 text-sm font-semibold text-[#CC0000] bg-white border border-red-200 hover:bg-red-50 rounded-sm transition-colors disabled:opacity-50 inline-flex items-center gap-2">
              <KeyRound size={14} />
              {resetting ? "Mereset..." : "Reset Password"}
            </button>
            <div className="flex gap-4">
              <Link href="/hrd/employees" className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-sm transition-colors">
                Batal
              </Link>
              <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-sm transition-colors disabled:opacity-50">
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
