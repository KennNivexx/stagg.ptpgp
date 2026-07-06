export function toEmbedUrl(url: string): { type: "youtube" | "file"; src: string } {
  // Parse properly first — a plain regex anchored on "watch\?v=" misses valid
  // URLs where other query params come before v= (e.g. "?list=PL...&v=ID").
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1).split("/")[0];
      if (id) return { type: "youtube", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "youtube.com") {
      const vParam = parsed.searchParams.get("v");
      if (vParam) return { type: "youtube", src: `https://www.youtube.com/embed/${vParam}` };
      const pathMatch = parsed.pathname.match(/^\/(?:embed|shorts)\/([\w-]{6,})/);
      if (pathMatch) return { type: "youtube", src: `https://www.youtube.com/embed/${pathMatch[1]}` };
    }
  } catch {
    // Not a valid absolute URL — fall through to the regex fallback below.
  }
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return { type: "youtube", src: `https://www.youtube.com/embed/${yt[1]}` };
  return { type: "file", src: url };
}
