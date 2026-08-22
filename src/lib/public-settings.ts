import { supabaseAdmin } from "@/lib/supabase";

/** Superadmin-editable public website settings (theme, info, footer, links,
 * etc.), stored as a JSON blob on a sentinel karyawan row — same source
 * src/app/page.tsx's local getSettings() reads. Only the homepage read this
 * directly; /career, /e-procurement, and /e-procurement/register rendered
 * NewNavbar/PGPFooter with no props at all, so superadmin edits (company
 * info, footer links, brand theme colors) only ever showed up on the
 * homepage and silently never reached these other public pages. */
// Untyped (matches src/app/page.tsx's original local getSettings()) — the
// settings blob's per-section shape varies by section and is consumed via
// loose `{}`-fallback destructuring at each call site, same as the homepage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPublicSettings(): Promise<any> {
  try {
    const { data } = await supabaseAdmin
      .from("karyawan")
      .select("address")
      .eq("email", "__settings__@ptpgp.co.id")
      .single();
    if (data?.address) {
      return JSON.parse(data.address as string);
    }
  } catch {
    console.error("[getPublicSettings] Failed to parse website settings, returning empty config.");
  }
  return {};
}
