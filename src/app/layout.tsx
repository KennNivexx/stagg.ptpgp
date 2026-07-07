import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PT Pratama Galuh Perkasa - Comprehensive Logistics Solutions",
  description: "PT Pratama Galuh Perkasa offers premier land transport, ocean freight, and custom logistics solutions.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "PT Pratama Galuh Perkasa",
    description: "Comprehensive logistics solutions — land transport, ocean freight, and custom logistics.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("h-full", "antialiased", "scroll-smooth", inter.variable, "font-sans", geist.variable)}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
