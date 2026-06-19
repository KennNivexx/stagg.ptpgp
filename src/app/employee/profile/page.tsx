"use client";

import { useState, useEffect } from "react";
import { User, Mail, Phone, Building, Briefcase, Calendar, ShieldCheck, Save, MapPin, IdCard, Heart, Droplet, Users2, GraduationCap, Siren } from "lucide-react";
import { getCurrentEmployee } from "@/app/actions/employee";
import { saveEmployeeProfile } from "@/app/actions/profile";

interface Employee {
  id: string; full_name: string; email: string; phone: string; address: string;
  department: string; position: string; join_date: string; status: string;
  nik: string; birth_place: string; birth_date: string; religion: string;
  blood_type: string; marital_status: string; spouse_name: string;
  children_count: number | null; ktp_address: string; last_education: string;
  emergency_name: string; emergency_phone: string;
  photo_url?: string;
}

export default function EmployeeProfile() {
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"profil" | "pribadi">("profil");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCurrentEmployee().then((emp) => {
      setProfile(emp as Employee);
      setLoading(false);
    });
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleSaveKK = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    fd.set("employeeId", profile?.id || "");
    const r = await saveEmployeeProfile(fd);
    setSaving(false);
    if (r.error) { showToast(r.error); return; }
    showToast("Data pribadi berhasil disimpan!");
    getCurrentEmployee().then((emp) => setProfile(emp as Employee));
  };

  const initials = (profile?.full_name || "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CC0000]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] px-5 py-3 rounded-xl shadow-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Profil Saya</h1>
        <p className="text-sm text-gray-500">Informasi pribadi dan kepegawaian Anda yang tercatat di sistem.</p>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("profil")}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors ${tab === "profil" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Profil
        </button>
        <button
          onClick={() => setTab("pribadi")}
          className={`px-5 py-2 rounded-lg text-xs font-bold transition-colors ${tab === "pribadi" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
        >
          Data Pribadi
        </button>
      </div>

      {tab === "profil" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-slate-900 text-white flex items-center justify-center text-3xl font-extrabold shadow-md mb-4">
              {initials}
            </div>
            <h2 className="text-lg font-extrabold text-slate-800">{profile?.full_name}</h2>
            <p className="text-xs text-slate-500 mt-1">{profile?.position || "-"}</p>
            <span className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold ${
              profile?.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}>
              {profile?.status || "Active"}
            </span>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm">Informasi Pribadi</h3>
                <p className="text-xs text-slate-400 mt-0.5">Data diri Anda yang tercatat di sistem</p>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailItem icon={User} label="Nama Lengkap" value={profile?.full_name || "-"} />
                <DetailItem icon={Mail} label="Email" value={profile?.email || "-"} />
                <DetailItem icon={Phone} label="Telepon" value={profile?.phone || "-"} />
                <DetailItem icon={MapPin} label="Alamat" value={profile?.address || "-"} />
                <DetailItem icon={Building} label="Departemen" value={profile?.department || "-"} />
                <DetailItem icon={Briefcase} label="Jabatan" value={profile?.position || "-"} />
                <DetailItem icon={Calendar} label="Tanggal Masuk" value={formatDate(profile?.join_date as string)} />
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/30 rounded-b-2xl">
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  <span>Data departemen, jabatan, dan status hanya dapat diubah oleh Administrator HRD.</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <User size={16} className="text-[#CC0000]" />
                  Edit Profil
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Perbarui informasi kontak dan data pribadi Anda</p>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</label>
                  <input
                    type="text"
                    defaultValue={profile?.full_name || ""}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Telepon</label>
                  <input
                    type="text"
                    defaultValue={profile?.phone || ""}
                    placeholder="08123456789"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat</label>
                  <textarea
                    rows={3}
                    defaultValue={profile?.address || ""}
                    placeholder="Alamat lengkap Anda"
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <button className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2">
                    <Save size={14} /> Simpan Perubahan
                  </button>
                  <button className="px-6 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-colors">
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <IdCard size={16} className="text-[#CC0000]" />
                Data Pribadi (KK)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Kelola data Kartu Keluarga dan informasi pribadi Anda.</p>
            </div>

            <form onSubmit={handleSaveKK} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">NIK</label>
                <input
                  type="text" name="nik" defaultValue={profile?.nik || ""}
                  placeholder="Nomor Induk Kependudukan"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tempat Lahir</label>
                <input
                  type="text" name="birth_place" defaultValue={profile?.birth_place || ""}
                  placeholder="Kota / Kabupaten"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal Lahir</label>
                <input
                  type="date" name="birth_date" defaultValue={profile?.birth_date || ""}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agama</label>
                <select name="religion" defaultValue={profile?.religion || ""}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Agama</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen Protestan">Kristen Protestan</option>
                  <option value="Kristen Katolik">Kristen Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Golongan Darah</label>
                <select name="blood_type" defaultValue={profile?.blood_type || ""}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Golongan Darah</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Pernikahan</label>
                <select name="marital_status" defaultValue={profile?.marital_status || ""}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Status</option>
                  <option value="Belum Menikah">Belum Menikah</option>
                  <option value="Menikah">Menikah</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Pasangan</label>
                <input
                  type="text" name="spouse_name" defaultValue={profile?.spouse_name || ""}
                  placeholder="Nama suami/istri"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Anak</label>
                <input
                  type="number" name="children_count" defaultValue={profile?.children_count?.toString() || "0"}
                  min="0" max="20"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Alamat KTP</label>
                <textarea
                  rows={3} name="ktp_address" defaultValue={profile?.ktp_address || ""}
                  placeholder="Alamat sesuai KTP"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pendidikan Terakhir</label>
                <select name="last_education" defaultValue={profile?.last_education || ""}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                  <option value="">Pilih Pendidikan</option>
                  <option value="SD">SD</option>
                  <option value="SMP">SMP</option>
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="D1">D1</option>
                  <option value="D2">D2</option>
                  <option value="D3">D3</option>
                  <option value="D4">D4</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                  <option value="S3">S3</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kontak Darurat Nama</label>
                <input
                  type="text" name="emergency_name" defaultValue={profile?.emergency_name || ""}
                  placeholder="Nama kontak darurat"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kontak Darurat Telepon</label>
                <input
                  type="text" name="emergency_phone" defaultValue={profile?.emergency_phone || ""}
                  placeholder="0812..."
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save size={14} /> {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
