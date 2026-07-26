import type { ReactNode } from "react";

// Hub pages (Employee Relations, Career Development, Reward & Recognition,
// Meetings, Workforce Time) compose many independent original pages into one
// route via HubTabs by calling `await OriginalPage()` for each tab. Without
// this wrapper, if ANY single composed page throws (missing DB table for an
// unrun migration, a requireRole mismatch, a bad query), the whole `await`
// chain rejects and Next.js's route-level error.tsx takes down every OTHER
// tab in the same hub too — from the user's side this reads as "the menu has
// no page" even though only one of a dozen+ composed tabs was actually
// broken. Wrapping each tab's loader here isolates the failure to just that
// tab's content slot.
export async function safeTab(loader: () => Promise<ReactNode>, label: string): Promise<ReactNode> {
  try {
    return await loader();
  } catch (err) {
    console.error(`[hub-tab:${label}]`, err);
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-semibold text-slate-500">Gagal memuat &quot;{label}&quot;.</p>
        <p className="text-xs text-slate-400 mt-1">Coba muat ulang halaman. Kalau masih gagal, tab lain di halaman ini tetap bisa dipakai.</p>
      </div>
    );
  }
}
