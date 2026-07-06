export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  // Indonesian mobile numbers may be stored as 08xx (local), 8xx (missing the
  // leading 0), or 62xx (already international) — only rewriting the leading
  // "0" case left "8xx"-only numbers with no country code, producing a
  // broken wa.me link.
  const normalized = cleaned.startsWith("0") ? "62" + cleaned.slice(1)
    : cleaned.startsWith("62") ? cleaned
    : cleaned.startsWith("8") ? "62" + cleaned
    : cleaned;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function formatPasswordMessage(name: string, email: string): string {
  return `Halo *${name}*,\n\nAkun HRIS PT Pratama Galuh Perkasa Anda telah dibuat.\n\n📧 Email: ${email}\n🔑 Password telah dikirim melalui email terpisah.\n\n🔗 Login di: https://hr.ptpgp.co.id/login\n\nHarap segera ganti password setelah login pertama.\n\nTerima kasih,\n*PT Pratama Galuh Perkasa*`;
}
