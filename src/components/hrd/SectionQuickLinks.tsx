import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MENU_GROUPS } from "@/lib/hrd-menu";

const COLOR_CLASSES: Record<string, { bg: string; text: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  violet: { bg: "bg-violet-50", text: "text-violet-600" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-600" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600" },
  teal: { bg: "bg-teal-50", text: "text-teal-600" },
  sky: { bg: "bg-sky-50", text: "text-sky-600" },
  orange: { bg: "bg-orange-50", text: "text-orange-600" },
  green: { bg: "bg-green-50", text: "text-green-600" },
  fuchsia: { bg: "bg-fuchsia-50", text: "text-fuchsia-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600" },
  pink: { bg: "bg-pink-50", text: "text-pink-600" },
  lime: { bg: "bg-lime-50", text: "text-lime-700" },
  slate: { bg: "bg-slate-100", text: "text-slate-600" },
};

/** Quick-link tile grid to every sub-page of a menu group, for that group's
 * own hub/overview page ("Ringkasan ...") to link out from — pulled straight
 * from MENU_GROUPS so it can never drift out of sync with the nav the way
 * this project's earlier hand-written tile sections had (some linked to
 * routes that no longer exist). `excludeHref` drops the hub's own entry
 * (always present as items[0] for a group with a hubHref) so a hub page
 * doesn't render a tile linking to itself.
 *
 * `onlySection` restricts the tiles to one `item.section` cluster — used to
 * "piggyback" a group that has no dedicated hub page (e.g. Aset & Fasilitas)
 * onto one of its own existing sub-pages instead of building a whole new
 * hub route just to hold quick-links. */
export default function SectionQuickLinks({ groupLabel, excludeHref, onlySection }: { groupLabel: string; excludeHref?: string; onlySection?: string }) {
  const group = MENU_GROUPS.find((g) => g.label === groupLabel);
  if (!group) return null;
  const items = group.items
    .filter((item) => item.href !== excludeHref)
    .filter((item) => onlySection === undefined || item.section === onlySection);
  if (items.length === 0) return null;
  const colors = COLOR_CLASSES[group.color] || COLOR_CLASSES.slate;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="font-extrabold text-slate-800 text-sm mb-4">Menu {onlySection ? `${group.label} — ${onlySection}` : group.label}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between gap-2 p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group"
          >
            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colors.bg} ${colors.text}`}>{item.label}</span>
            <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
