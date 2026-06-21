import NotificationsClient from "./NotificationsClient";

const DEFAULT_NOTIFICATION_TYPES = [
  { id: "new_applicant", label: "Pelamar Baru", desc: "Notifikasi saat ada pelamar baru melamar lowongan", email: true, sms: false, inapp: true },
  { id: "leave_request", label: "Pengajuan Cuti", desc: "Notifikasi saat karyawan mengajukan cuti", email: true, sms: false, inapp: true },
  { id: "leave_approved", label: "Cuti Disetujui", desc: "Notifikasi saat pengajuan cuti disetujui", email: true, sms: true, inapp: true },
  { id: "contract_expiry", label: "Kontrak Akan Berakhir", desc: "Peringatan 30 hari sebelum kontrak berakhir", email: true, sms: false, inapp: true },
  { id: "training_due", label: "Pelatihan Terjadwal", desc: "Pengingat pelatihan yang akan datang", email: true, sms: false, inapp: true },
  { id: "overtime_approved", label: "Lembur Disetujui", desc: "Notifikasi persetujuan lembur", email: true, sms: false, inapp: true },
  { id: "warning_issued", label: "Surat Peringatan", desc: "Notifikasi penerbitan surat peringatan", email: true, sms: false, inapp: false },
  { id: "resignation", label: "Pengunduran Diri", desc: "Notifikasi proses pengunduran diri", email: true, sms: false, inapp: true },
];

export default function PengaturanNotifikasi() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengaturan Notifikasi</h1>
        <p className="text-sm text-gray-500">Konfigurasi notifikasi email, SMS, dan in-app untuk berbagai event HR.</p>
      </div>
      <NotificationsClient initialTypes={DEFAULT_NOTIFICATION_TYPES} />
    </div>
  );
}
