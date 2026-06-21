"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Briefcase, Calendar, FileText, UserPlus, AlertTriangle, Clock, Wallet, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "applicant" | "leave" | "contract" | "payroll" | "new_employee" | "warning" | "training" | "resignation";
  title: string;
  message: string;
  time: string;
  link: string;
  priority: "high" | "medium" | "low";
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  applicant: <Briefcase size={14} className="text-blue-500" />,
  leave: <Calendar size={14} className="text-amber-500" />,
  contract: <AlertTriangle size={14} className="text-red-500" />,
  payroll: <Wallet size={14} className="text-purple-500" />,
  new_employee: <UserPlus size={14} className="text-emerald-500" />,
  warning: <AlertTriangle size={14} className="text-red-500" />,
  training: <Clock size={14} className="text-blue-500" />,
  resignation: <FileText size={14} className="text-orange-500" />,
};

const READ_KEY = (role: string) => `notif_read_${role}`;

function getReadIds(role: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY(role)) || "[]");
  } catch {
    return [];
  }
}

function saveReadIds(role: string, ids: string[]) {
  try {
    localStorage.setItem(READ_KEY(role), JSON.stringify(ids));
  } catch {}
}

export default function NotificationBell({ role }: { role: "hrd" | "employee" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(() => {
    fetch("/api/notifications?role=" + role)
      .then((r) => r.json())
      .then((data) => {
        const fetched: Notification[] = data.notifications || [];
        setNotifications(fetched);
        const readIds = getReadIds(role);
        const unreadCount = fetched.filter((n) => !readIds.includes(n.id)).length;
        setUnread(unreadCount);
      })
      .catch(() => {});
  }, [role]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    const allIds = notifications.map((n) => n.id);
    saveReadIds(role, allIds);
    setUnread(0);
    setOpen(false);
  };

  const priorityColor = (p: string) =>
    p === "high" ? "bg-red-500" : p === "medium" ? "bg-amber-500" : "bg-blue-400";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-slate-100 rounded-xl relative transition-colors text-slate-500"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Notifikasi</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {unread > 0 ? `${unread} pemberitahuan baru` : "Tidak ada notifikasi baru"}
              </p>
            </div>
            {unread > 0 && (
              <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">{unread} baru</span>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs text-slate-400">Semua sudah terbaca</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 p-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                >
                  <div className="mt-0.5 shrink-0">
                    <div className={`p-2 rounded-xl ${n.priority === "high" ? "bg-red-50" : n.priority === "medium" ? "bg-amber-50" : "bg-blue-50"}`}>
                      {NOTIFICATION_ICONS[n.type]}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${priorityColor(n.priority)}`} />
                      <p className="text-xs font-bold text-slate-800 truncate">{n.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                  </div>
                </Link>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
              <button onClick={markAllRead} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                Tandai semua sudah dibaca
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
