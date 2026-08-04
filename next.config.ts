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
        ],
      },
    ];
    if (process.env.NODE_ENV === "production") {
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
