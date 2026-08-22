"use client";

import { useState, useEffect, useCallback } from "react";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  link: string;
  priority: "high" | "medium" | "low";
}

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
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

// Shared by NotificationBell (dropdown) and sidebar dot indicators, so every
// consumer polls the same feed instead of duplicating fetch/retry logic.
export function useNotifications(role: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  const fetchOnce = useCallback((): Promise<boolean> => {
    return fetch("/api/notifications?role=" + role)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setNotifications(data.notifications || []);
        setReadIds(getReadIds(role));
        return true;
      })
      .catch((e) => {
        console.error("[useNotifications] Fetch failed:", e);
        return false;
      });
  }, [role]);

  useEffect(() => {
    let cancelled = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      fetchOnce().then((ok) => {
        if (cancelled) return;
        // A transient blip (e.g. dev server restart) would otherwise leave
        // the badge stale for a full 60s — retry once shortly after instead
        // of waiting for the next scheduled poll. Tracked so it can be
        // cancelled on unmount — it used to be a bare setTimeout with no
        // cleanup, so a component that unmounted within that 5s window still
        // got its setNotifications/setReadIds called on a stale closure.
        if (!ok) retryTimeout = setTimeout(run, 5_000);
      });
    };

    run();
    const interval = setInterval(run, 60_000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (retryTimeout) clearTimeout(retryTimeout);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchOnce]);

  const unread = notifications.filter((n) => !readIds.includes(n.id));

  const markAllRead = useCallback(() => {
    const allIds = notifications.map((n) => n.id);
    saveReadIds(role, allIds);
    setReadIds(allIds);
  }, [notifications, role]);

  // Mirrors each layout's own isItemActive prefix-match convention: a link
  // matches an item's href exactly, or by prefix as long as the item isn't
  // the dashboard root (otherwise every notification would light up "Dashboard").
  const hasUnreadForHref = useCallback((href: string, rootHref: string) => {
    return unread.some((n) => n.link === href || (href !== rootHref && n.link.startsWith(href)));
  }, [unread]);

  return { notifications, unread, unreadCount: unread.length, markAllRead, hasUnreadForHref };
}
