// Shared per-group icon color for sidebar menus. Brand system is
// restricted to red (pgp-red, reserved for active/emphasis state — applied
// by each layout, not here) plus neutral black/slate/white — so idle group
// icons all share one neutral tone instead of a per-group rainbow. The
// Record type is kept (rather than a single constant) so existing
// `GROUP_COLOR_CLASSES[group.color] || fallback` call sites in every
// layout keep working unchanged regardless of which color key a menu group
// declares.
const NEUTRAL_DARK = "text-slate-400";
const NEUTRAL_LIGHT = "text-slate-500";

export const GROUP_COLOR_CLASSES: Record<string, string> = new Proxy({}, {
  get: () => NEUTRAL_DARK,
});

// Same neutral tone, tuned for a white sidebar background instead of dark.
export const GROUP_COLOR_CLASSES_LIGHT: Record<string, string> = new Proxy({}, {
  get: () => NEUTRAL_LIGHT,
});
