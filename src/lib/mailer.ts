import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabase";

async function getMailConfig(): Promise<{ user: string; pass: string }> {
  try {
    const { data } = await supabaseAdmin
      .from("pengaturan_sistem")
      .select("key, value")
      .in("key", ["mail_gmail_user", "mail_gmail_app_password"]);

    const map = Object.fromEntries(
      (data || []).map((r: { key: string; value: string }) => [r.key, r.value])
    );

    const dbUser = (map.mail_gmail_user || "").trim();
    const dbPass = (map.mail_gmail_app_password || "").replace(/\s+/g, "");

    const envUser = (process.env.GMAIL_USER || "").trim();
    const envPass = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, "");

    const user = dbUser || envUser;
    const pass = dbPass || envPass;

    return { user, pass };
  } catch {
    return {
      user: (process.env.GMAIL_USER || "").trim(),
      pass: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, ""),
    };
  }
}

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: MailOptions): Promise<void> {
  const { user, pass } = await getMailConfig();

  if (!user || !pass) {
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ [DEV MAIL] SMTP Gmail belum dikonfigurasi. Mengalihkan email ke console log:");
      console.log(`--------------------------------------------------`);
      console.log(`Kepada: ${to}`);
      console.log(`Subjek: ${subject}`);
      const urlMatch = html.match(/href="([^"]+)"/);
      if (urlMatch && urlMatch[1]) {
        console.log(`Link Login: ${urlMatch[1]}`);
      }
      console.log(`--------------------------------------------------`);
      return;
    }
    throw new Error(
      "Gmail belum dikonfigurasi. Buka HRD → Admin → Pengaturan → Email Pengirim dan isi kredensial Gmail."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  await transporter.sendMail({
    from: `"PT Pratama Galuh Perkasa" <${user}>`,
    to,
    subject,
    html,
  });
}

export async function testMailConfig(): Promise<{ ok: boolean; error?: string; user?: string }> {
  const { user, pass } = await getMailConfig();
  if (!user || !pass) return { ok: false, error: "Gmail belum dikonfigurasi. Isi email & App Password terlebih dahulu." };
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
    });
    await transporter.verify();
    return { ok: true, user };
  } catch (e) {
    const err = e as Error & { code?: string; responseCode?: number };
    let msg = err.message || "Gagal menghubungkan ke Gmail SMTP.";
    if (msg.includes("535") || msg.includes("BadCredentials") || msg.includes("Username and Password not accepted")) {
      msg = "Kredensial ditolak oleh Gmail (Error 535). Pastikan Anda menggunakan Google App Password 16 karakter (bukan password akun biasa) dan 2-Step Verification sudah diaktifkan di akun Google Anda.";
    } else if (msg.includes("ETIMEDOUT") || msg.includes("ECONNREFUSED")) {
      msg = "Koneksi ke SMTP Gmail timeout / diblokir jaringan. Periksa koneksi internet Anda.";
    }
    return { ok: false, error: msg };
  }
}

export function emailOTP(otp: string, name: string): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#CC0000;padding:28px 32px;">
        <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800;letter-spacing:-0.5px;">PT Pratama Galuh Perkasa</h2>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Reset Password - Kode Verifikasi</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Halo, <strong>${name}</strong>,</p>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
          Anda menerima email ini karena ada permintaan reset password untuk akun Anda.
          Gunakan kode OTP berikut untuk melanjutkan proses:
        </p>
        <div style="background:#f9fafb;border:2px solid #e5e7eb;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9ca3af;letter-spacing:2px;text-transform:uppercase;">Kode OTP Anda</p>
          <p style="margin:0;font-size:40px;font-weight:900;color:#CC0000;letter-spacing:8px;font-family:monospace;">${otp}</p>
          <p style="margin:12px 0 0;font-size:11px;color:#9ca3af;">Berlaku selama <strong>10 menit</strong></p>
        </div>
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
          Jika Anda tidak merasa meminta reset password, abaikan email ini.
          Kode ini akan otomatis kedaluwarsa.
        </p>
      </div>
    </div>`;
}

export function emailApplicantLoginLink(opts: {
  name: string;
  email: string;
  loginUrl: string;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#1A2530;padding:28px 32px;">
        <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800;">PT Pratama Galuh Perkasa</h2>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">Akun Portal Pelamar Telah Dibuat</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Halo, <strong>${opts.name}</strong>,</p>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
          Terima kasih telah melamar di PT Pratama Galuh Perkasa.
          Akun portal pelamar Anda telah berhasil dibuat. Klik tombol di bawah untuk login:
        </p>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${opts.loginUrl}" style="display:inline-block;background:#CC0000;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;">
            Login ke Portal Pelamar →
          </a>
        </div>
        <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;line-height:1.6;">
          Link ini hanya berlaku <strong>24 jam</strong> dan hanya bisa digunakan <strong>sekali</strong>.
          Setelah login pertama, Anda akan diminta untuk membuat password baru.
        </p>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;">
          <p style="margin:0;font-size:12px;color:#92400e;line-height:1.6;">
            Akun akan dihapus apabila lamaran tidak lolos seleksi.
          </p>
        </div>
      </div>
    </div>`;
}

export function emailInterviewInvite(opts: {
  name: string;
  position?: string;
  date: string;
  time?: string;
  interviewer?: string;
  location?: string;
  onlineLink?: string;
  notes?: string;
}): string {
  const whereLine = opts.onlineLink
    ? `<a href="${opts.onlineLink}" style="color:#CC0000;">${opts.onlineLink}</a> (online)`
    : (opts.location || "Akan diinformasikan lebih lanjut");
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#1A2530;padding:28px 32px;">
        <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800;">PT Pratama Galuh Perkasa</h2>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">Undangan Interview</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Halo, <strong>${opts.name}</strong>,</p>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
          Selamat! Anda mengikuti tahap wawancara${opts.position ? ` untuk posisi <strong>${opts.position}</strong>` : ""} di PT Pratama Galuh Perkasa. Berikut detail jadwalnya:
        </p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;font-size:13px;color:#374151;border-collapse:collapse;">
            <tr><td style="padding:4px 0;color:#9ca3af;width:110px;">Tanggal</td><td style="padding:4px 0;font-weight:700;">${opts.date}</td></tr>
            ${opts.time ? `<tr><td style="padding:4px 0;color:#9ca3af;">Waktu</td><td style="padding:4px 0;font-weight:700;">${opts.time}</td></tr>` : ""}
            <tr><td style="padding:4px 0;color:#9ca3af;">Lokasi</td><td style="padding:4px 0;font-weight:700;">${whereLine}</td></tr>
            ${opts.interviewer ? `<tr><td style="padding:4px 0;color:#9ca3af;">Pewawancara</td><td style="padding:4px 0;font-weight:700;">${opts.interviewer}</td></tr>` : ""}
          </table>
        </div>
        ${opts.notes ? `<p style="margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.6;"><strong>Catatan:</strong> ${opts.notes}</p>` : ""}
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
          Mohon hadir tepat waktu. Jika ada kendala jadwal, segera hubungi HRD di hrga@ptpgp.co.id.
        </p>
      </div>
    </div>`;
}

export function emailApplicationRejected(opts: { name: string; position?: string }): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#1A2530;padding:28px 32px;">
        <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800;">PT Pratama Galuh Perkasa</h2>
        <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:13px;">Informasi Status Lamaran</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Halo, <strong>${opts.name}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
          Terima kasih atas waktu dan minat Anda melamar${opts.position ? ` untuk posisi <strong>${opts.position}</strong>` : ""} di PT Pratama Galuh Perkasa.
          Setelah melalui proses seleksi, dengan berat hati kami informasikan bahwa Anda belum dapat kami lanjutkan ke tahap berikutnya kali ini.
        </p>
        <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.6;">
          Keputusan ini tidak mengurangi apresiasi kami terhadap kualifikasi Anda. Kami akan menyimpan data Anda dan dengan senang hati menghubungi kembali apabila ada kesempatan yang lebih sesuai di masa mendatang.
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
          Kami mengucapkan terima kasih dan semoga sukses selalu untuk langkah karier Anda selanjutnya.
        </p>
      </div>
    </div>`;
}

export function emailOfferLetter(opts: { name: string; contentHtml: string }): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#CC0000;padding:28px 32px;">
        <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800;">PT Pratama Galuh Perkasa</h2>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Surat Penawaran Kerja</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 20px;font-size:14px;color:#374151;">Halo, <strong>${opts.name}</strong>,</p>
        <div style="font-size:13px;color:#374151;line-height:1.7;">${opts.contentHtml}</div>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
          Silakan login ke Portal Pelamar untuk melihat dan merespons surat penawaran ini secara resmi.
        </p>
      </div>
    </div>`;
}

export function emailEmployeeLoginLink(opts: {
  name: string;
  email: string;
  loginUrl: string;
}): string {
  return `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#CC0000;padding:28px 32px;">
        <h2 style="color:#fff;margin:0;font-size:20px;font-weight:800;">PT Pratama Galuh Perkasa</h2>
        <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px;">Selamat! Anda Resmi Bergabung</p>
      </div>
      <div style="padding:32px;">
        <p style="margin:0 0 16px;font-size:14px;color:#374151;">Halo, <strong>${opts.name}</strong>,</p>
        <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
          Selamat bergabung dengan keluarga PT Pratama Galuh Perkasa!
          Akun karyawan Anda telah diaktifkan. Klik tombol di bawah untuk login pertama kali:
        </p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:24px;">
          <p style="margin:0;font-size:13px;color:#374151;">
            Gunakan email Anda: <strong>${opts.email}</strong>
          </p>
        </div>
        <div style="text-align:center;margin-bottom:24px;">
          <a href="${opts.loginUrl}" style="display:inline-block;background:#CC0000;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;">
            Login ke Portal Karyawan →
          </a>
        </div>
        <p style="margin:0 0 16px;font-size:12px;color:#9ca3af;line-height:1.6;">
          Link ini hanya berlaku <strong>24 jam</strong> dan hanya bisa digunakan <strong>sekali</strong>.
          Anda akan diminta membuat password baru setelah login pertama.
        </p>
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          Jika ada pertanyaan, hubungi HRD di hrga@ptpgp.co.id.
        </p>
      </div>
    </div>`;
}
