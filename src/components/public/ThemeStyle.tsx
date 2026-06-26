/**
 * Injects superadmin-configured theme colors by overriding the Tailwind v4
 * CSS variables (defined in globals.css @theme) at :root for the public site.
 * Server component — renders a plain <style> tag, no client JS.
 */
interface ThemeProps {
  primary?: string;       // --color-pgp-red
  primaryHover?: string;  // --color-pgp-red-hover
  navy?: string;          // --color-pgp-navy
  background?: string;    // page background
}

// Only allow safe CSS color tokens (hex, rgb/rgba, hsl, or a plain word).
function safeColor(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s;
  if (/^(rgb|rgba|hsl|hsla)\([0-9.,%\s/]+\)$/.test(s)) return s;
  if (/^[a-zA-Z]{3,20}$/.test(s)) return s; // named color
  return null;
}

export default function ThemeStyle({ primary, primaryHover, navy, background }: ThemeProps) {
  const rules: string[] = [];
  const p = safeColor(primary);
  const ph = safeColor(primaryHover);
  const n = safeColor(navy);
  const bg = safeColor(background);

  if (p) rules.push(`--color-pgp-red: ${p};`);
  // Default the hover shade to the primary if not separately set.
  if (ph || p) rules.push(`--color-pgp-red-hover: ${ph || p};`);
  if (n) {
    rules.push(`--color-pgp-navy: ${n};`);
    rules.push(`--color-pgp-navy-light: ${n};`);
  }

  if (rules.length === 0 && !bg) return null;

  const css =
    `:root{${rules.join("")}}` +
    (bg ? `main{background-color:${bg} !important;}` : "");

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
