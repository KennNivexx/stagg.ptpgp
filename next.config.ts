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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
