"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Key, CheckCircle2, Copy, Eye, EyeOff } from "lucide-react";
import { createEmployee } from "@/app/actions/hrd";
import { getOrgStructure } from "@/app/actions/org";
import { generateCompanyEmail } from "@/lib/auth";

export default function NewEmployeeForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState("");
  const [nik, setNik] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [department, setDepartment] = useState("Operasional");
  const [position, setPosition] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [status, setStatus] = useState("Tetap");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [orgUnits, setOrgUnits] = useState<{code: string; name: string}[]>([]);
  const [orgCode, setOrgCode] = useState("");

  useEffect(() => {
    if (fullName && !email) {
      setGeneratedEmail(generateCompanyEmail(fullName));
    }
  }, [fullName, email]);

  useEffect(() => {
    getOrgStructure().then(tree => {
      const flat: {code: string; name: string}[] = [];
      function walk(units: any[]) {
        for (const u of units) {
          flat.push({ code: u.code, name: u.name });
          if (u.children) walk(u.children);
        }
      }
      walk(tree);
      setOrgUnits(flat);
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("address", address || nik);
    formData.append("department", department);
    formData.append("position", position);
    formData.append("join_date", joinDate);
    formData.append("status", status);
    if (orgCode) formData.append("org_code", orgCode);

    const res = await createEmployee(formData);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else if (res.email && res.password) {
      setGeneratedEmail(res.email);
      setGeneratedPassword(res.password);
      setSuccess(true);
      setLoading(false);
    } else {
      setError("Gagal membuat akun.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Karyawan Berhasil Ditambahkan!</h1>
          <p className="text-sm text-gray-500 mb-8">Akun login otomatis telah dibuat. Simpan informasi berikut.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1">
              Penting! Simpan kredensial ini sekarang. Password tidak akan ditampilkan lagi.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
              <span className="text-sm">📋</span> Salin dan kirim ke karyawan via email/WA
            </p>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Email Perusahaan</p>
                  <p className="text-sm font-mono font-bold text-slate-800">{generatedEmail}</p>
                </div>
              </div>
              <button onClick={() => copyToClipboard(generatedEmail)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <Copy size={14} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Key size={16} className="text-slate-400" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Password Sementara</p>
                  <p className="text-sm font-mono font-bold text-slate-800">
                    {showPassword ? generatedPassword : "••••••••••••"}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setShowPassword(!showPassword)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => copyToClipboard(generatedPassword)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 space-y-1 pt-2 border-t border-slate-100">
            <p className="flex items-center gap-1"><span className="text-xs">ℹ️</span> Password ini hanya untuk login pertama. Karyawan wajib mengganti password setelah login.</p>
            <p>Password terdiri dari 12 karakter: huruf besar, kecil, angka, dan karakter khusus.</p>
            <p className="flex items-center gap-1"><span className="text-xs">🔄</span> Jika password hilang, HRD bisa reset ulang di halaman Edit Karyawan.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link href="/hrd/employees" className="flex-1 text-center py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors">
            Kembali ke Data Karyawan
          </Link>
          <button
            onClick={() => {
              setSuccess(false);
              setFullName("");
              setNik("");
              setEmail("");
              setPhone("");
              setAddress("");
              setDepartment("Operasional");
              setPosition("");
              setJoinDate("");
              setStatus("Tetap");
            }}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors"
          >
            + Tambah Karyawan Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Link href="/hrd/employees" className="inline-flex items-center text-sm text-gray-500 hover:text-[#CC0000] transition-colors mb-4">
        <ArrowLeft size={16} className="mr-1" /> Kembali ke Data Karyawan
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A2530]">Tambah Karyawan Baru</h1>
        <p className="text-sm text-gray-500 mt-1">Data karyawan akan otomatis dibuatkan akun login. Email dan password digenerate otomatis.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="p-6 lg:p-8 border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#1A2530] mb-6">Informasi Pribadi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Lengkap *</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none transition-all"
                  placeholder="Cth: Kevin Pratama" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">NIK</label>
                <input type="text" value={nik} onChange={(e) => setNik(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none transition-all"
                  placeholder="Nomor Induk Karyawan" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Email Perusahaan <span className="text-[10px] font-normal text-gray-400">(dikunci — digenerate otomatis)</span>
                </label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none transition-all bg-gray-50"
                  placeholder={generatedEmail || "kevin.pratama@ptpgp.co.id"} />
                <p className="text-[10px] text-gray-400 mt-1">Ketik manual untuk override, atau kosongkan untuk auto-generate.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor Telepon</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none transition-all"
                  placeholder="0812xxxxxx" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alamat Lengkap</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none transition-all"
                  placeholder="Jl. Sudirman No. 1, Jakarta Utara" />
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg font-bold text-[#1A2530] mb-6">Informasi Pekerjaan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Departemen *</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none bg-white">
                  <option>Operasional</option>
                  <option>Administrasi</option>
                  <option>Keuangan</option>
                  <option>IT & Sistem</option>
                  <option>HRD</option>
                  <option>Marketing</option>
                  <option>Legal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jabatan / Posisi *</label>
                <input type="text" required value={position} onChange={(e) => setPosition(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none transition-all"
                  placeholder="Cth: Staff Logistik" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tanggal Bergabung *</label>
                <input type="date" required value={joinDate} onChange={(e) => setJoinDate(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status Karyawan</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none bg-white">
                  <option>Tetap</option>
                  <option>Kontrak</option>
                  <option>Magang</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Unit Organisasi</label>
                <select value={orgCode} onChange={(e) => setOrgCode(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl text-sm focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000]/20 outline-none bg-white">
                  <option value="">Pilih Unit Organisasi</option>
                  {orgUnits.map(u => (
                    <option key={u.code} value={u.code}>{u.code} — {u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 border-b border-slate-100 bg-amber-50/30">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                <Key size={16} className="text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">Akun Login Otomatis</p>
                <p className="text-xs text-amber-700 mt-1">
                  Password akan digenerate otomatis (12 karakter: huruf besar, kecil, angka, simbol).
                  Kredensial login akan ditampilkan setelah data tersimpan.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 flex justify-end gap-4 bg-gray-50">
            <Link href="/hrd/employees" className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl transition-colors">
              Batal
            </Link>
            <button type="submit" disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#CC0000] hover:bg-[#aa0000] rounded-xl transition-colors disabled:opacity-50 shadow-sm shadow-red-600/10">
              {loading ? "Menyimpan..." : "Simpan & Buat Akun"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
