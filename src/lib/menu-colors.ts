// Shared per-group icon color palette for sidebar menus, so groups that
// previously all looked identical (monochrome) become easy to tell apart at
// a glance. Two variants: dark-sidebar (HRD mobile drawer, Department,
// Director, Superadmin) and light-sidebar (Employee, white background).

export const GROUP_COLOR_CLASSES: Record<string, string> = {
  blue: "text-blue-400",
  violet: "text-violet-400",
  emerald: "text-emerald-400",
  indigo: "text-indigo-400",
  cyan: "text-cyan-400",
  amber: "text-amber-400",
  purple: "text-purple-400",
  teal: "text-teal-400",
  sky: "text-sky-400",
  orange: "text-orange-400",
  green: "text-green-400",
  fuchsia: "text-fuchsia-400",
  rose: "text-rose-400",
  pink: "text-pink-400",
  lime: "text-lime-400",
  slate: "text-slate-400",
};

// Same palette, tuned for a white sidebar background instead of dark (the
// -400 shades above read fine on dark backgrounds but wash out on white).
export const GROUP_COLOR_CLASSES_LIGHT: Record<string, string> = {
  blue: "text-blue-500",
  violet: "text-violet-500",
  emerald: "text-emerald-500",
  indigo: "text-indigo-500",
  cyan: "text-cyan-500",
  amber: "text-amber-500",
  purple: "text-purple-500",
  teal: "text-teal-500",
  sky: "text-sky-500",
  orange: "text-orange-500",
  green: "text-green-500",
  fuchsia: "text-fuchsia-500",
  rose: "text-rose-500",
  pink: "text-pink-500",
  lime: "text-lime-600",
  slate: "text-slate-500",
};
