"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 30_000;

export default function AutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    function fire() {
      if (document.hidden) return;
      router.refresh();
      window.dispatchEvent(new Event("auto-refresh"));
    }

    const id = setInterval(fire, INTERVAL_MS);

    // Also fire when user returns to the tab after being away
    function onVisible() {
      if (!document.hidden) fire();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  return null;
}
