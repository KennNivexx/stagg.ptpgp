"use client";
import { useRef, useState } from "react";
import { Building2, Clock, Calendar, Mail, Eye, EyeOff, CheckCircle2, XCircle, Loader2, MessageCircle } from "lucide-react";
import { saveMultipleSettings, testGmailConfig } from "@/app/actions/admin";

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

      {/* WhatsApp Bot */}
      <div className="lg:col-span-2">
        <Section title="Bot WhatsApp" icon={MessageCircle} color="bg-emerald-50 text-emerald-600"
          onSave={() => save("wa", waRef)} loading={!!loadingMap.wa} msg={msgMap.wa || null}>
          <form ref={waRef} className="space-y-4">
            <input type="hidden" name="provider" value="fonnte" />

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
              <strong>Cara setup:</strong><br />
              1. Daftar &amp; login di <strong>fonnte.com</strong>, tambah device baru, scan QR dengan nomor WA bot<br />
              2. Salin <strong>Device Token</strong> dari dashboard Fonnte, tempel di bawah<br />
              3. Di dashboard Fonnte, buka menu Webhook, isi URL webhook di bawah ini<br />
              4. (Opsional tapi disarankan) Isi juga Secret Webhook di bawah, lalu tambahkan <code>?secret=isian_anda</code> di akhir URL webhook yang didaftarkan ke Fonnte — Fonnte sendiri tidak menandatangani request webhook-nya, jadi secret ini satu-satunya cara memverifikasi bahwa yang mengirim benar Fonnte
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Device Token Fonnte</label>
              <div className="relative">
                <input name="fonnte_token" type={showWaToken ? "text" : "password"} defaultValue={s.wa_fonnte_token ?? ""}
                  placeholder="xxxxxxxxxxxxxxxxxxxx"
                  className="w-full pr-10 text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
                <button type="button" onClick={() => setShowWaToken(!showWaToken)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center">
                  {showWaToken ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">URL Webhook (daftarkan ini di Fonnte)</label>
              <input readOnly value={typeof window !== "undefined" ? `${window.location.origin}/api/wa/webhook-fonnte` : "/api/wa/webhook-fonnte"}
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-slate-50 text-slate-500 font-mono" />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Secret Webhook (opsional)</label>
              <input name="fonnte_webhook_secret" type="text" defaultValue={s.wa_fonnte_webhook_secret ?? ""}
                placeholder="Bebas, isi string apapun"
                className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 focus:border-[#CC0000] outline-none font-mono" />
              <p className="text-[10px] text-slate-400 mt-1">Kalau diisi, tambahkan <code>?secret=...</code> yang sama di URL webhook yang didaftarkan ke Fonnte. Kalau dikosongkan, webhook tetap jalan tanpa verifikasi tambahan.</p>
            </div>
          </form>
        </Section>
      </div>
    </div>
  );
}
