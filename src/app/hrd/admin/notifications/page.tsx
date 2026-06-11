import { Bell, Mail, Smartphone, Monitor, ToggleLeft, ToggleRight } from "lucide-react";

export default function PengaturanNotifikasi() {
  const notificationTypes = [
    { id: "new_applicant", label: "Pelamar Baru", desc: "Notifikasi saat ada pelamar baru melamar lowongan", email: true, sms: false, inapp: true },
    { id: "leave_request", label: "Pengajuan Cuti", desc: "Notifikasi saat karyawan mengajukan cuti", email: true, sms: false, inapp: true },
    { id: "leave_approved", label: "Cuti Disetujui", desc: "Notifikasi saat pengajuan cuti disetujui", email: true, sms: true, inapp: true },
    { id: "contract_expiry", label: "Kontrak Akan Berakhir", desc: "Peringatan 30 hari sebelum kontrak berakhir", email: true, sms: false, inapp: true },
    { id: "training_due", label: "Pelatihan Terjadwal", desc: "Pengingat pelatihan yang akan datang", email: true, sms: false, inapp: true },
    { id: "overtime_approved", label: "Lembur Disetujui", desc: "Notifikasi persetujuan lembur", email: true, sms: false, inapp: true },
    { id: "warning_issued", label: "Surat Peringatan", desc: "Notifikasi penerbitan surat peringatan", email: true, sms: false, inapp: false },
    { id: "resignation", label: "Pengunduran Diri", desc: "Notifikasi proses pengunduran diri", email: true, sms: false, inapp: true },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengaturan Notifikasi</h1>
        <p className="text-sm text-gray-500">Konfigurasi notifikasi email, SMS, dan in-app untuk berbagai event HR.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Mail size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Email Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">
                {notificationTypes.filter((t) => t.email).length}/{notificationTypes.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Smartphone size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">SMS Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">
                {notificationTypes.filter((t) => t.sms).length}/{notificationTypes.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Monitor size={18} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">In-App Aktif</p>
              <p className="text-xl font-extrabold text-slate-800">
                {notificationTypes.filter((t) => t.inapp).length}/{notificationTypes.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Daftar Notifikasi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Aktifkan/nonaktifkan notifikasi per tipe</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tipe Notifikasi</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase">Deskripsi</th>
                <th className="text-center px-4 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="text-center px-4 py-4 text-xs font-bold text-slate-500 uppercase">SMS</th>
                <th className="text-center px-4 py-4 text-xs font-bold text-slate-500 uppercase">In-App</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {notificationTypes.map((notif) => (
                <tr key={notif.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Bell size={14} /></div>
                      <p className="text-xs font-bold text-slate-800">{notif.label}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">{notif.desc}</td>
                  <td className="px-4 py-4 text-center">
                    <label className="cursor-pointer">
                      <input type="checkbox" className="accent-[#CC0000] w-4 h-4" defaultChecked={notif.email} />
                    </label>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <label className="cursor-pointer">
                      <input type="checkbox" className="accent-[#CC0000] w-4 h-4" defaultChecked={notif.sms} />
                    </label>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <label className="cursor-pointer">
                      <input type="checkbox" className="accent-[#CC0000] w-4 h-4" defaultChecked={notif.inapp} />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Template Notifikasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">Edit template pesan notifikasi</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Pilih Template</label>
              <select className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none">
                {notificationTypes.map((n) => (
                  <option key={n.id} value={n.id}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Subjek Email</label>
              <input type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" defaultValue="Notifikasi: {{event_type}}" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Isi Pesan</label>
              <textarea rows={4} className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" defaultValue={`Halo {{employee_name}},\n\n{{message_body}}\n\nSalam,\nTim HRD`} />
            </div>
            <p className="text-[10px] text-slate-400">
              Variabel: {"{{employee_name}}"}, {"{{message_body}}"}, {"{{event_type}}"}, {"{{date}}"}
            </p>
            <button className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              Simpan Template
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Pengaturan Pengiriman</h3>
            <p className="text-xs text-slate-400 mt-0.5">Konfigurasi email dan SMS gateway</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">SMTP Host</label>
              <input type="text" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="smtp.perusahaan.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Email Pengirim</label>
              <input type="email" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="hrd@perusahaan.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">SMS Gateway API Key</label>
              <input type="password" className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-600 focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] outline-none" placeholder="••••••••••••••••" />
            </div>
            <button className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors">
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
