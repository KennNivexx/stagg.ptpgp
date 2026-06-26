"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Key, CheckCircle2, Copy, Eye, EyeOff } from "lucide-react";
import { generateWhatsAppUrl, formatPasswordMessage } from "@/lib/wa";
import { createEmployee } from "@/app/actions/hrd";
import { getOrgStructure, getDepartments } from "@/app/actions/org";
import { generateCompanyEmail } from "@/lib/auth";
import type { OrgUnit } from "@/types/org";

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
  const [deptList, setDeptList] = useState<string[]>([]);

  const autoEmail = useMemo(() => {
    if (fullName && !email) return generateCompanyEmail(fullName);
    return "";
  }, [fullName, email]);

  useEffect(() => {
    getOrgStructure().then(tree => {
      const flat: {code: string; name: string}[] = [];
      function walk(units: OrgUnit[]) {
        for (const u of units) {
          flat.push({ code: u.code, name: u.name });
          if (u.children) walk(u.children);
        }
      }
      walk(tree);
      setOrgUnits(flat);
    });
    getDepartments().then(depts => {
      setDeptList(depts.map(d => d.name));
    });
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {/* clipboard unavailable */});
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
                  <p className="text-sm font-mono font-bold text-slate-800">{generatedEmail || autoEmail}</p>
                </div>
              </div>
              <button onClick={() => copyToClipboard(generatedEmail || autoEmail)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
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

          {phone && (
            <a
              href={generateWhatsAppUrl(phone, formatPasswordMessage(fullName, generatedEmail || autoEmail))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Kirim via WhatsApp
            </a>
          )}

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
                  placeholder={generatedEmail || autoEmail || "kevin.pratama@ptpgp.co.id"} />
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
                  {deptList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
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
