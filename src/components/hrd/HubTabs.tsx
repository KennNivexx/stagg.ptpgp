"use client";

import { useState, type ReactNode } from "react";

export interface HubTab {
  id: string;
  label: string;
  /** Already-rendered icon element (e.g. `icon: <Users size={14} />`), never
   * a bare component reference (`icon: Users`) — this is a "use client"
   * component, and its parent hub pages are Server Components, so a
   * lucide-react component reference (a forwardRef object) can't cross that
   * boundary as a prop; only plain data or rendered JSX can. */
  icon?: ReactNode;
  /** Server-rendered content for this tab — since the parent page is an
   * async Server Component, this can be the output of another page's
   * original component (e.g. `<OriginalCasePage {...} />`) composed in
   * directly, so merging N routes into one hub never means rewriting their
   * logic — only how they're switched between. */
  content: ReactNode;
}

// Shared shell for every "N menu items merged into 1" hub page (Employee
// Relations, Career Development, Reward & Recognition, Workforce Time
// Management). All tabs are rendered up front (each tab's own data fetch
// already ran server-side before this component receives them) and simply
// shown/hidden client-side — so switching tabs is instant with no reload,
// at the cost of every tab's query running on page load. Acceptable for an
// internal HR tool; revisit with per-tab lazy-fetch if a hub grows heavy.
export default function HubTabs({ tabs, defaultTab }: { tabs: HubTab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 mb-6 no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors ${
                isActive
                  ? "border-[#CC0000] text-[#CC0000]"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div key={tab.id} className={tab.id === active ? "" : "hidden"}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
