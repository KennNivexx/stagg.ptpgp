"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DoorOpen, Plus, CalendarClock, CheckCircle, Clock, Sparkles, Ban,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  requestBooking, saveRoom, confirmBooking, rejectBooking, completeBooking,
  type RuangMeeting, type BookingRuangMeeting,
} from "@/app/actions/meetings";

interface Props {
  rooms: RuangMeeting[];
  bookings: BookingRuangMeeting[];
  canManage: boolean;
}

function Msg({ m }: { m: { type: "success" | "error"; text: string } | null }) {
  if (!m) return null;
  return (
    <div className={`p-3 rounded-xl text-xs font-medium ${m.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      {m.text}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  Menunggu: "bg-amber-50 text-amber-700",
  Dikonfirmasi: "bg-emerald-50 text-emerald-700",
  Ditolak: "bg-red-50 text-red-700",
  Selesai: "bg-slate-100 text-slate-500",
  Kedaluwarsa: "bg-slate-100 text-slate-400",
};

export default function RoomsClient({ rooms, bookings, canManage }: Props) {
  const router = useRouter();
  const bookingFormRef = useRef<HTMLFormElement>(null);
  const roomFormRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [roomLoading, setRoomLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [roomMsg, setRoomMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function handleBookingSubmit() {
    if (!bookingFormRef.current) return;
    setLoading(true);
    setMsg(null);
    const result = await requestBooking(new FormData(bookingFormRef.current));
    setLoading(false);
    if ("error" in result) { setMsg({ type: "error", text: result.error }); return; }
    setMsg({ type: "success", text: "Booking ruang berhasil diajukan." });
    bookingFormRef.current.reset();
    router.refresh();
  }

  async function handleRoomSubmit() {
    if (!roomFormRef.current) return;
    setRoomLoading(true);
    setRoomMsg(null);
    const result = await saveRoom(new FormData(roomFormRef.current));
    setRoomLoading(false);
    if ("error" in result) { setRoomMsg({ type: "error", text: result.error }); return; }
    setRoomMsg({ type: "success", text: "Ruang meeting tersimpan." });
    roomFormRef.current.reset();
    router.refresh();
  }

  async function handleBookingAction(id: string, action: "confirm" | "reject" | "complete") {
    setActionMsg(null);
    const fn = action === "confirm" ? confirmBooking : action === "reject" ? rejectBooking : completeBooking;
    const result = await fn(id);
    if ("error" in result) { setActionMsg(result.error); return; }
    router.refresh();
  }

  const pending = bookings.filter((b) => b.status === "Menunggu").length;
  const confirmed = bookings.filter((b) => b.status === "Dikonfirmasi").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengendalian Ruang Meeting</h1>
        <p className="text-sm text-gray-500">SOP-SDM-09 &mdash; Pemesanan dan konfirmasi penggunaan ruang meeting kantor.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: DoorOpen, label: "Total Ruang", value: rooms.length, color: "bg-blue-50 text-blue-600" },
          { icon: Clock, label: "Menunggu Konfirmasi", value: pending, color: "bg-amber-50 text-amber-600" },
          { icon: CheckCircle, label: "Terkonfirmasi", value: confirmed, color: "bg-emerald-50 text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${s.color}`}><s.icon size={18} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{s.label}</p>
                <p className="text-xl font-extrabold text-slate-800">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {actionMsg && <div className="p-3 rounded-xl text-xs font-medium bg-red-50 text-red-700">{actionMsg}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-1">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Ruang</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ruang meeting yang tersedia untuk dipesan</p>
          </div>
          {rooms.length === 0 ? (
            <EmptyState icon={DoorOpen} title="Belum ada ruang meeting." description="Tambahkan ruang meeting terlebih dahulu." className="border-0" />
          ) : (
            <div className="divide-y divide-slate-50">
              {rooms.map((r) => (
                <div key={r.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{r.nama}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Kapasitas {r.kapasitas ?? "-"} orang</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    r.status === "Tersedia" ? "bg-emerald-50 text-emerald-700" :
                    r.status === "Perlu Dibersihkan" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"
                  }`}>{r.status}</span>
                </div>
              ))}
            </div>
          )}
          {canManage && (
            <form ref={roomFormRef} className="p-6 border-t border-slate-100 space-y-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tambah Ruang</p>
              <input name="nama" placeholder="Nama ruang" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              <input name="kapasitas" type="number" placeholder="Kapasitas" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
              <select name="status" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
                <option value="Tersedia">Tersedia</option>
                <option value="Perlu Dibersihkan">Perlu Dibersihkan</option>
                <option value="Non-Aktif">Non-Aktif</option>
              </select>
              <Msg m={roomMsg} />
              <button type="button" onClick={handleRoomSubmit} disabled={roomLoading}
                className="w-full px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl hover:bg-slate-900 transition-colors disabled:opacity-60">
                {roomLoading ? "Menyimpan..." : "Simpan Ruang"}
              </button>
            </form>
          )}
        </div>

        {/* Booking list */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm">Daftar Booking</h3>
            <p className="text-xs text-slate-400 mt-0.5">Booking otomatis kedaluwarsa jika tidak dikonfirmasi dalam 3 hari kerja</p>
          </div>
          {bookings.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Belum ada booking ruang meeting." className="border-0" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["Acara", "Ruang", "Tanggal", "Waktu", "Pemohon", "Status", ""].map((h) => (
                      <th key={h} className={`px-4 py-3 text-xs font-bold text-slate-500 uppercase whitespace-nowrap ${h === "" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map((b) => {
                    const room = rooms.find((r) => r.id === b.ruang_id);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-800 text-xs">{b.nama_acara}</p>
                          {b.kebutuhan_snack && <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Sparkles size={10} /> Snack</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{room?.nama || "-"}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{b.tanggal}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{b.waktu_mulai}&ndash;{b.waktu_selesai}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{b.user_pemohon}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${STATUS_STYLE[b.status] || "bg-slate-100 text-slate-500"}`}>{b.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {canManage && b.status === "Menunggu" && (
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => handleBookingAction(b.id, "confirm")} className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600" title="Konfirmasi"><CheckCircle size={12} /></button>
                              <button onClick={() => handleBookingAction(b.id, "reject")} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600" title="Tolak"><Ban size={12} /></button>
                            </div>
                          )}
                          {b.status === "Dikonfirmasi" && (
                            <button onClick={() => handleBookingAction(b.id, "complete")} className="text-[10px] font-bold text-slate-500 hover:text-slate-800">Tandai Selesai</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Booking form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Ajukan Booking Ruang</h3>
          <p className="text-xs text-slate-400 mt-0.5">Isi form berikut untuk memesan ruang meeting (menggantikan permintaan informal via WA/telepon)</p>
        </div>
        <form ref={bookingFormRef} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ruang</label>
            <select name="ruang_id" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000] bg-white">
              <option value="">Pilih ruang</option>
              {rooms.filter((r) => r.status !== "Non-Aktif").map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nama Acara</label>
            <input name="nama_acara" placeholder="Rapat koordinasi..." className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tanggal</label>
            <input name="tanggal" type="date" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mulai</label>
              <input name="waktu_mulai" type="time" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selesai</label>
              <input name="waktu_selesai" type="time" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
            </div>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input name="kebutuhan_snack" type="checkbox" className="rounded border-slate-300" /> Butuh snack/konsumsi
            </label>
            <input name="catatan_snack" placeholder="Catatan snack (opsional)" className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#CC0000]" />
          </div>
          <div className="md:col-span-2">
            <Msg m={msg} />
          </div>
          <div className="md:col-span-2">
            <button type="button" onClick={handleBookingSubmit} disabled={loading}
              className="px-4 py-2.5 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              <Plus size={14} /> {loading ? "Mengajukan..." : "Ajukan Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
