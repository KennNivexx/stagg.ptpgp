import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 300,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  serverExternalPackages: ["@whiskeysockets/baileys"],
  async headers() {
    // Next.js 16 rejects a route entry whose `headers` array is empty
    // ("`headers` field cannot be empty for route") — it used to be a
    // harmless no-op, now it throws and takes the whole dev/prod server
    // down on the first request. So the HSTS block (production-only) must
    // be omitted entirely in dev, not included with an empty array.
    const isProd = process.env.NODE_ENV === "production";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

    // Scoped to what this app actually loads client-side — not a generic
    // template. Sources, one by one:
    // - script/style 'unsafe-inline': Next.js's own hydration bootstrap
    //   script and Framer Motion's per-frame inline `style="transform:..."`
    //   attributes both require it; this app has no nonce/middleware
    //   plumbing to do strict CSP without breaking every animated page.
    // - script 'unsafe-eval' (dev only): Turbopack/webpack HMR needs eval;
    //   omitted in production since the built bundle doesn't need it.
    // - img-src https:: next.config's images.remotePatterns intentionally
    //   allows ANY https host (CMS editors paste arbitrary image URLs), so
    //   CSP has to match that; img-src data: is for CameraCapture.tsx's
    //   canvas.toDataURL() face-capture preview.
    // - connect-src: 'self' for server actions/API routes, the Supabase
    //   project URL for client-side Storage uploads (website image CMS
    //   uploads go through the anon client directly), *.sentry.io —
    //   Sentry has no DSN configured in .env.local right now (dormant, zero
    //   network calls) but is a real installed integration; harmless to
    //   allow ahead of it being turned on rather than have it silently
    //   CSP-blocked later with no obvious symptom — and *.vercel-insights.com
    //   for @vercel/speed-insights (rendered in layout.tsx, confirmed live
    //   via a console error the first time this CSP was tested).
    // - script-src also allows va.vercel-scripts.com for that same
    //   Speed Insights script — this exact gap was caught by testing in a
    //   real browser, not assumed; don't remove either without re-testing.
    // - frame-src: YouTube (PGPHero.tsx / HeroSection.tsx background video,
    //   hrd/knowledge/videos player) and Google Maps embed (ContactSection.tsx).
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isProd ? "" : " 'unsafe-eval'"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      `connect-src 'self' ${supabaseUrl} https://*.supabase.co https://*.sentry.io https://*.vercel-insights.com`.trim(),
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com",
      "media-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];
    if (isProd) csp.push("upgrade-insecure-requests");

    const rules = [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // camera=(self) / geolocation=(self): this app genuinely uses both
          // (face recognition in CameraCapture.tsx for attendance/login/reset,
          // and "Gunakan Lokasi Saya" geofencing) — an empty allowlist "()"
          // means NO origin may use the API at all, which silently overrides
          // whatever the user allows at the OS/browser level and makes both
          // features permanently fail with a permission-denied-looking error
          // no matter what the visitor grants. microphone stays disabled;
          // nothing in this app calls getUserMedia with audio.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self)" },
          { key: "Content-Security-Policy", value: csp.join("; ") },
        ],
      },
    ];
    if (isProd) {
      rules.push({
        source: "/(.*)",
        headers: [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }],
      });
    }
    return rules;
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "your-org",
  project: "pt-pgp",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
});
