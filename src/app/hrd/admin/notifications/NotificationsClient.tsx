"use client";
import { useState } from "react";
import { Bell, Mail, Smartphone, Monitor } from "lucide-react";
import { saveNotificationTemplate } from "@/app/actions/admin";

type NotifType = {
  id: string;
  label: string;
  desc: string;
  email: boolean;
  sms: boolean;
  inapp: boolean;
};

interface Props {
  initialTypes: NotifType[];
}

export default function NotificationsClient({ initialTypes }: Props) {
  const [types, setTypes] = useState<NotifType[]>(initialTypes);
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  function toggle(id: string, channel: "email" | "sms" | "inapp") {
    setTypes((prev) => prev.map((t) => t.id === id ? { ...t, [channel]: !t[channel] } : t));
  }

  async function save(notif: NotifType) {
    setSaving(notif.id);
    setMsg(null);
    const fd = new FormData();
    fd.set("event_type", notif.id);
    fd.set("email_enabled", String(notif.email));
    fd.set("sms_enabled", String(notif.sms));
    fd.set("inapp_enabled", String(notif.inapp));
    fd.set("label", notif.label);
    const result = await saveNotificationTemplate(fd);
    setSaving(null);
    if ("error" in result) {
      setMsg({ id: notif.id, type: "error", text: result.error ?? "Terjadi kesalahan" });
    } else {
      setMsg({ id: notif.id, type: "success", text: "Disimpan!" });
    }
  }

  const emailActive = types.filter((t) => t.email).length;
  const smsActive = types.filter((t) => t.sms).length;
  const inappActive = types.filter((t) => t.inapp).length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: Mail, label: "Email Aktif", value: `${emailActive}/${types.length}`, color: "bg-blue-50 text-blue-600" },
          { icon: Smartphone, label: "SMS Aktif", value: `${smsActive}/${types.length}`, color: "bg-emerald-50 text-emerald-600" },
          { icon: Monitor, label: "In-App Aktif", value: `${inappActive}/${types.length}`, color: "bg-purple-50 text-purple-600" },
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm">Konfigurasi Notifikasi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Aktifkan/nonaktifkan saluran notifikasi per event</p>
        </div>
        <div className="divide-y divide-slate-50">
          {types.map((notif) => (
            <div key={notif.id} className="p-6 hover:bg-slate-50/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-0.5"><Bell size={14} /></div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{notif.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{notif.desc}</p>
                    {msg?.id === notif.id && (
                      <p className={`text-[10px] mt-1 font-medium ${msg.type === "success" ? "text-emerald-600" : "text-red-600"}`}>{msg.text}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-6 shrink-0">
                  {(["email", "sms", "inapp"] as const).map((channel) => {
                    const icons = { email: Mail, sms: Smartphone, inapp: Monitor };
                    const labels = { email: "Email", sms: "SMS", inapp: "In-App" };
                    const Icon = icons[channel];
                    return (
                      <button key={channel} onClick={() => toggle(notif.id, channel)}
                        className="flex flex-col items-center gap-1 group">
                        <div className={`p-2 rounded-lg transition-colors ${notif[channel] ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-300"}`}>
                          <Icon size={14} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{labels[channel]}</span>
                      </button>
                    );
                  })}
                  <button onClick={() => save(notif)} disabled={saving === notif.id}
                    className="px-3 py-1.5 text-[10px] font-bold bg-[#CC0000] text-white rounded-lg hover:bg-[#aa0000] disabled:opacity-60 transition-colors">
                    {saving === notif.id ? "..." : "Simpan"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
