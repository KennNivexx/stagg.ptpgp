"use client";

import { useEffect, useState } from "react";
import { Sun, Sunset, Moon, CloudSun } from "lucide-react";

function greetingFor(hour: number) {
  if (hour < 11) return { text: "Good Morning", Icon: Sun };
  if (hour < 15) return { text: "Good Afternoon", Icon: CloudSun };
  if (hour < 18) return { text: "Good Evening", Icon: Sunset };
  return { text: "Good Night", Icon: Moon };
}

/** Ticking wall clock + dynamic greeting — client-only since it needs
 * setInterval; the server render passes an initial timestamp so there's no
 * flash of "00:00:00" before hydration. */
export default function LiveClock({ initialIso }: { initialIso: string }) {
  const [now, setNow] = useState(() => new Date(initialIso));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { text, Icon } = greetingFor(now.getHours());
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Icon size={16} className="text-pgp-red shrink-0" />
      <span className="font-semibold text-slate-700">{text}</span>
      <span className="text-slate-300">&middot;</span>
      <span>{dateStr}</span>
      <span className="text-slate-300">&middot;</span>
      <span className="font-mono tabular-nums text-slate-700">{timeStr}</span>
    </div>
  );
}
