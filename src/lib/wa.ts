export function generateWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/[^0-9]/g, "");
  const normalized = cleaned.startsWith("0") ? "62" + cleaned.slice(1) : cleaned;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function formatPasswordMessage(name: string, email: string): string {
  return `Halo *${name}*,\n\nAkun HRIS PT Pratama Galuh Perkasa Anda telah dibuat.\n\n📧 Email: ${email}\n🔑 Password telah dikirim melalui email terpisah.\n\n🔗 Login di: https://hr.ptpgp.co.id/login\n\nHarap segera ganti password setelah login pertama.\n\nTerima kasih,\n*PT Pratama Galuh Perkasa*`;
}
