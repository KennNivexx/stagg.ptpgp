import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: "10mb",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  // Baileys (WhatsApp demo provider) does its own optional dynamic import of
  // jimp/sharp for media processing — Turbopack tries to statically resolve
  // those anyway and fails since neither is installed. Externalizing lets
  // Node's own require handle it at runtime, where Baileys' try/catch works.
  serverExternalPackages: ["@whiskeysockets/baileys"],
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG || "your-org",
  project: "pt-pgp",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
});
