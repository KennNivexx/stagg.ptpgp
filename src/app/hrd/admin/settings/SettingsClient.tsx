"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import { Building2, Clock, Calendar, Mail, Eye, EyeOff, CheckCircle2, XCircle, Loader2, MessageCircle, QrCode, Unplug } from "lucide-react";
import { saveMultipleSettings, testGmailConfig } from "@/app/actions/admin";
import {
  setWaProviderSetting,
  getBaileysConnectionStatus, startBaileysConnectionAction, disconnectBaileysSessionAction,
} from "@/app/actions/whatsapp";
import type { WaProvider } from "@/lib/whatsapp";
import type { BaileysStatus } from "@/lib/whatsapp-baileys";

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{m.text}</div>;
}

function Section({ title, icon: Icon, color, children, onSave, loading, msg }: {
  title: string; icon: React.ElementType; color: string; children: React.ReactNode;
  onSave: () => void; loading: boolean; msg: { type: "success" | "error"; text: string } | null;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${color} rounded-lg`}><Icon size={16} /></div>
          <h3 className="font-extrabold text-slate-800 text-sm">{title}</h3>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {children}
        <Msg m={msg} />
        <button type="button" onClick={onSave} disabled={loading}
          className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] active:scale-[0.97] active:bg-[#990000] transition-all disabled:opacity-60">
          {loading ? "Menyimpan..." : `Simpan ${title}`}
        </button>
      </div>
    </div>
  );
}

export default function SettingsClient({ initialSettings = {} }: { initialSettings?: Record<string, string> }) {
  const s = initialSettings;
  const companyRef = useRef<HTMLFormElement>(null);
  const workRef = useRef<HTMLFormElement>(null);
  const leaveRef = useRef<HTMLFormElement>(null);
  const mailRef = useRef<HTMLFormElement>(null);
  const waRef = useRef<HTMLFormElement>(null);
  const [showWaToken, setShowWaToken] = useState(false);
  const [showWaSecret, setShowWaSecret] = useState(false);
  const [waProvider, setWaProviderState] = useState<WaProvider>(s.wa_provider === "meta" ? "meta" : "baileys");
  const [waProviderSaving, setWaProviderSaving] = useState(false);
  const [baileysStatus, setBaileysStatus] = useState<{ status: BaileysStatus; qrDataUrl: string | null; number: string | null }>({ status: "disconnected", qrDataUrl: null, number: null });
  const [baileysBusy, setBaileysBusy] = useState(false);

  const refreshBaileysStatus = useCallback(() => {
    getBaileysConnectionStatus().then(setBaileysStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (waProvider !== "baileys") return;
    refreshBaileysStatus();
    const interval = setInterval(refreshBaileysStatus, 3_000);
    return () => clearInterval(interval);
  }, [waProvider, refreshBaileysStatus]);

  async function handleWaProviderChange(next: WaProvider) {
    setWaProviderSaving(true);
    const result = await setWaProviderSetting(next);
    setWaProviderSaving(false);
    if ("success" in result) setWaProviderState(next);
  }

  async function handleBaileysConnect() {
    setBaileysBusy(true);
    const status = await startBaileysConnectionAction();
    setBaileysStatus(status);
    setBaileysBusy(false);
  }

  async function handleBaileysDisconnect() {
    setBaileysBusy(true);
    await disconnectBaileysSessionAction();
    setBaileysBusy(false);
    refreshBaileysStatus();
  }

  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [msgMap, setMsgMap] = useState<Record<string, { type: "success" | "error"; text: string } | null>>({});
  const [showPass, setShowPass] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string; user?: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function handleTestGmail() {
    setTesting(true);
    setTestResult(null);
    const res = await testGmailConfig();
    setTestResult(res);
    setTesting(false);
  }

  async function save(key: string, ref: React.RefObject<HTMLFormElement | null>) {
    if (!ref.current) return;
    setLoadingMap((p) => ({ ...p, [key]: true }));
    setMsgMap((p) => ({ ...p, [key]: null }));
    const fd = new FormData(ref.current);
    const settings: Record<string, string> = {};
    fd.forEach((val, k) => { settings[`${key}_${k}`] = val as string; });
    const result = await saveMultipleSettings(settings);
    setLoadingMap((p) => ({ ...p, [key]: false }));
    if ("error" in result) {
      setMsgMap((p) => ({ ...p, [key]: { type: "error", text: String((result as Record<string, unknown>).error ?? "Terjadi kesalahan") } }));
    } else {
      setMsgMap((p) => ({ ...p, [key]: { type: "success", text: "Pengaturan berhasil disimpan!" } }));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <Section title="Informasi Perusahaan" icon={Building2} color="bg-blue-50 text-blue-600"
        onSave={() => save("company", companyRef)} loading={!!loadingMap.company} msg={msgMap.company || null}>
        <form ref={companyRef} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Perusahaan</label>
              <input name="name" type="text" defaultValue={s.company_name ?? "PT Pratama Galuh Perkasa"} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Bidang Usaha</label>
              <input name="industry" type="text" defaultValue={s.company_industry ?? "Logistik & Ekspedisi"} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Alamat</label>
            <textarea name="address" rows={2} defaultValue={s.company_address ?? ""} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="Alamat lengkap perusahaan..." />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Telepon</label>
              <input name="phone" type="text" defaultValue={s.company_phone ?? ""} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="+62 xxx" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email</label>
              <input name="email" type="email" defaultValue={s.company_email ?? ""} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="info@..." />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Website</label>
              <input name="website" type="text" defaultValue={s.company_website ?? ""} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" placeholder="www..." />
            </div>
          </div>
        </form>
      </Section>

      <Section title="Jam Kerja" icon={Clock} color="bg-amber-50 text-amber-600"
        onSave={() => save("work", workRef)} loading={!!loadingMap.work} msg={msgMap.work || null}>
        <form ref={workRef} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jam Masuk</label>
              <input name="start_time" type="time" defaultValue={s.work_start_time ?? "08:00"} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jam Keluar</label>
              <input name="end_time" type="time" defaultValue={s.work_end_time ?? "17:00"} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Hari Kerja</label>
            <div className="flex flex-wrap gap-2">
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat"].map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input name="work_days" type="checkbox" value={d} defaultChecked className="accent-[#CC0000]" />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Toleransi Keterlambatan (menit)</label>
            <input name="late_tolerance" type="number" defaultValue={s.work_late_tolerance ?? 15} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
          </div>
        </form>
      </Section>

      <Section title="Kebijakan Cuti" icon={Calendar} color="bg-emerald-50 text-emerald-600"
        onSave={() => save("leave", leaveRef)} loading={!!loadingMap.leave} msg={msgMap.leave || null}>
        <form ref={leaveRef} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cuti Tahunan (hari)</label>
              <input name="annual_leave" type="number" defaultValue={s.leave_annual_leave ?? 12} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Cuti Sakit (hari)</label>
              <input name="sick_leave" type="number" defaultValue={s.leave_sick_leave ?? 12} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pengajuan Cuti Min. (hari sebelumnya)</label>
            <input name="leave_notice_days" type="number" defaultValue={s.leave_leave_notice_days ?? 3} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Carry Over Sisa Cuti</label>
            <select name="carry_over" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none bg-white">
              <option value="yes">Ya, diperbolehkan</option>
              <option value="no">Tidak, hangus di akhir tahun</option>
            </select>
          </div>
        </form>
      </Section>

      {/* Gmail / Email Pengirim — full width */}
      <div className="lg:col-span-2">
        <Section title="Email Pengirim (Gmail)" icon={Mail} color="bg-red-50 text-red-600"
          onSave={() => save("mail", mailRef)} loading={!!loadingMap.mail} msg={msgMap.mail || null}>
          <form ref={mailRef} className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
              <strong>Cara setup Gmail App Password:</strong><br />
              1. Buka <strong>myaccount.google.com/apppasswords</strong><br />
              2. Pastikan 2-Step Verification aktif di akun Gmail pengirim<br />
                             3. Buat App Password baru → pilih &quot;Mail&quot; → salin kode 16 karakter<br />
              4. Isi di bawah. Setiap email pengirim punya App Password masing-masing.
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Email Pengirim (Gmail)
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="gmail_user"
                  type="email"
                  defaultValue={s.mail_gmail_user ?? ""}
                  placeholder="contoh: hrga@ptpgp.co.id atau gmail pribadi"
                  className="w-full pl-8 text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Email ini akan tampil sebagai pengirim di setiap notifikasi yang dikirim sistem.</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                Gmail App Password
              </label>
              <div className="relative">
                <input
                  name="gmail_app_password"
                  type={showPass ? "text" : "password"}
                  defaultValue={s.mail_gmail_app_password ?? ""}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full pr-10 text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Bukan password Gmail biasa. Harus berupa App Password 16 karakter dari Google.</p>
            </div>

            {/* Test connection */}
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={handleTestGmail} disabled={testing}
                className="px-4 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2">
                {testing ? <><Loader2 size={12} className="animate-spin" /> Menguji...</> : "Test Koneksi Gmail"}
              </button>
              {testResult && (
                <span className={`text-xs font-bold flex items-center gap-1.5 ${testResult.ok ? "text-emerald-600" : "text-red-600"}`}>
                  {testResult.ok
                    ? <><CheckCircle2 size={14} /> Berhasil! Kirim dari {testResult.user}</>
                    : <><XCircle size={14} /> Gagal: {testResult.error}</>
                  }
                </span>
              )}
            </div>
          </form>
        </Section>
      </div>

      {/* WhatsApp Bot — full width */}
      <div className="lg:col-span-2">
        <Section title="Bot WhatsApp" icon={MessageCircle} color="bg-emerald-50 text-emerald-600"
          onSave={() => save("wa", waRef)} loading={!!loadingMap.wa} msg={msgMap.wa || null}>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Mode Bot WhatsApp</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button type="button" disabled={waProviderSaving} onClick={() => handleWaProviderChange("baileys")}
                  className={`text-left p-3 rounded-xl border-2 transition-colors ${waProvider === "baileys" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <p className="text-xs font-bold text-slate-800">Demo (QR Code)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Pakai nomor WA biasa, scan QR seperti WhatsApp Web. Gratis, tanpa approval Meta — cocok untuk demo sekarang.</p>
                </button>
                <button type="button" disabled={waProviderSaving} onClick={() => handleWaProviderChange("meta")}
                  className={`text-left p-3 rounded-xl border-2 transition-colors ${waProvider === "meta" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-slate-300"}`}>
                  <p className="text-xs font-bold text-slate-800">Resmi (Meta Cloud API)</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Butuh akun WhatsApp Business Platform &amp; approval Meta. Aktifkan setelah disetujui — isi kredensial di bawah.</p>
                </button>
              </div>
            </div>

            {waProvider === "baileys" && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><QrCode size={14} /> Status Koneksi Demo</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    baileysStatus.status === "connected" ? "bg-emerald-100 text-emerald-700"
                    : baileysStatus.status === "qr" ? "bg-amber-100 text-amber-700"
                    : baileysStatus.status === "connecting" ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 text-slate-600"
                  }`}>
                    {baileysStatus.status === "connected" ? "Terhubung"
                      : baileysStatus.status === "qr" ? "Menunggu Scan QR"
                      : baileysStatus.status === "connecting" ? "Menghubungkan..."
                      : "Belum Terhubung"}
                  </span>
                </div>

                {baileysStatus.status === "connected" && (
                  <p className="text-xs text-slate-600">Nomor aktif: <span className="font-mono font-bold">{baileysStatus.number}</span></p>
                )}

                {baileysStatus.status === "qr" && baileysStatus.qrDataUrl && (
                  <div className="flex flex-col items-center gap-2 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={baileysStatus.qrDataUrl} alt="QR code WhatsApp" className="w-48 h-48 border border-slate-200 rounded-lg bg-white p-2" />
                    <p className="text-[10px] text-slate-500 text-center">Buka WhatsApp di HP → Perangkat Tertaut → Tautkan Perangkat → scan kode ini.</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {baileysStatus.status === "disconnected" && (
                    <button type="button" onClick={handleBaileysConnect} disabled={baileysBusy}
                      className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                      {baileysBusy ? <Loader2 size={12} className="animate-spin" /> : <QrCode size={12} />} Hubungkan (Tampilkan QR)
                    </button>
                  )}
                  {(baileysStatus.status === "connected" || baileysStatus.status === "qr" || baileysStatus.status === "connecting") && (
                    <button type="button" onClick={handleBaileysDisconnect} disabled={baileysBusy}
                      className="px-3 py-2 border border-red-200 bg-white text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-60 flex items-center gap-1.5">
                      {baileysBusy ? <Loader2 size={12} className="animate-spin" /> : <Unplug size={12} />} Putuskan
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <form ref={waRef} className="space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
              <strong>Cara setup WhatsApp Cloud API (Meta) — hanya berlaku jika mode di atas = &quot;Resmi&quot;:</strong><br />
              1. Buat aplikasi di <strong>developers.facebook.com</strong>, tambahkan produk WhatsApp<br />
              2. Salin <strong>Phone Number ID</strong>, <strong>Access Token</strong> (permanen/System User), dan <strong>App Secret</strong> dari dashboard aplikasi<br />
              3. Daftarkan URL webhook di bawah pada Meta, isi Verify Token yang sama persis dengan yang Anda isi di sini<br />
              4. Isi <strong>Nomor WhatsApp Bot</strong> di bawah — karyawan yang chat duluan ke nomor ini (lewat tombol di Profil Saya), jadi <strong>tidak perlu Message Template</strong> untuk alur utama & tidak ada biaya per pesan<br />
              5. (Opsional) Kalau nanti mau kirim pengingat otomatis tanpa karyawan chat duluan, baru perlu ajukan Message Template — isi field di bagian bawah setelah disetujui Meta
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nomor WhatsApp Bot</label>
              <input name="bot_number" type="text" defaultValue={s.wa_bot_number ?? ""}
                placeholder="6281234567890"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
              <p className="text-[10px] text-slate-400 mt-1">Nomor yang didaftarkan ke WhatsApp Cloud API di atas (format 62xxx, tanpa +/spasi). Karyawan mengetuk tombol di Profil Saya untuk chat ke nomor ini duluan. Di mode Demo, field ini terisi otomatis setelah scan QR berhasil.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">URL Webhook (daftarkan ini di Meta)</label>
              <input readOnly value={typeof window !== "undefined" ? `${window.location.origin}/api/wa/webhook` : "/api/wa/webhook"}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-500 font-mono" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Phone Number ID</label>
                <input name="phone_number_id" type="text" defaultValue={s.wa_phone_number_id ?? ""}
                  placeholder="1234567890"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">API Version</label>
                <input name="api_version" type="text" defaultValue={s.wa_api_version ?? "v21.0"}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Access Token</label>
              <div className="relative">
                <input name="access_token" type={showWaToken ? "text" : "password"} defaultValue={s.wa_access_token ?? ""}
                  placeholder="EAAxxxxxxxxxxxx"
                  className="w-full pr-10 text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
                <button type="button" onClick={() => setShowWaToken(!showWaToken)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center">
                  {showWaToken ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">App Secret</label>
                <div className="relative">
                  <input name="app_secret" type={showWaSecret ? "text" : "password"} defaultValue={s.wa_app_secret ?? ""}
                    className="w-full pr-10 text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
                  <button type="button" onClick={() => setShowWaSecret(!showWaSecret)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center">
                    {showWaSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Dipakai untuk verifikasi signature webhook — wajib diisi.</p>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Webhook Verify Token</label>
                <input name="webhook_verify_token" type="text" defaultValue={s.wa_webhook_verify_token ?? ""}
                  placeholder="Bebas, isi string apapun"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
                <p className="text-[10px] text-slate-400 mt-1">Harus persis sama dengan yang didaftarkan di Meta.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Opsional — hanya untuk pengingat otomatis di luar chat aktif</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nama Template Pesan</label>
                  <input name="template_name" type="text" defaultValue={s.wa_template_name ?? ""}
                    placeholder="hubungkan_bot_wa"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Kode Bahasa Template</label>
                  <input name="template_lang" type="text" defaultValue={s.wa_template_lang ?? "id"}
                    placeholder="id"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
                </div>
              </div>
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}
