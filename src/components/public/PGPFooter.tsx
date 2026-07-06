"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Mail, Phone, MapPin, Globe } from "lucide-react";

interface FooterLink { label: string; url: string; }
interface FooterProps {
  info?: { company_name?: string; company_phone?: string; company_email?: string; company_address?: string; company_short_desc?: string };
  footer?: { footer_copyright?: string; footer_description?: string };
  links?: { footer_quick?: FooterLink[]; footer_support?: FooterLink[]; social?: FooterLink[] };
}

// This project's lucide-react version doesn't ship brand/logo icons (Linkedin,
// Instagram, Facebook, Twitter/X, Youtube) — inline the standard simple-icons
// paths instead, sized/styled to match the lucide icons used elsewhere here.
type IconProps = { size?: number; className?: string };
const LinkedinIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);
const InstagramIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);
const FacebookIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
  </svg>
);
const TwitterIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const YoutubeIcon = ({ size = 16, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

function socialIconFor(label: string) {
  const l = label.toLowerCase();
  if (l.includes("linkedin")) return LinkedinIcon;
  if (l.includes("instagram")) return InstagramIcon;
  if (l.includes("facebook")) return FacebookIcon;
  if (l.includes("twitter") || l.includes("x.com") || l === "x") return TwitterIcon;
  if (l.includes("youtube")) return YoutubeIcon;
  return Globe;
}

export default function PGPFooter({ info, footer, links }: FooterProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleHashClick = (e: React.MouseEvent, href: string) => {
    const hash = href.split("#")[1];
    if (!hash) return;
    if (pathname === "/" || pathname === "") {
      e.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      e.preventDefault();
      router.push("/#" + hash);
    }
  };

  const companyName = info?.company_name || "PT Pratama Galuh Perkasa";
  const companyPhone = info?.company_phone || "(0254) 570700";
  const companyDesc = info?.company_short_desc || footer?.footer_description || "Industrial Excellence in Logistics. Delivering precision and reliability across the archipelago.";
  const copyright = footer?.footer_copyright || `\u00a9 ${new Date().getFullYear()} ${companyName}. All rights reserved.`;

  const quickLinks = links?.footer_quick?.length ? links.footer_quick : [
    { label: "Tentang Kami", url: "/#about" },
    { label: "Karir", url: "/career" },
    { label: "Kontak", url: "/#contact" },
  ];

  const supportLinks = links?.footer_support?.length ? links.footer_support : [
    { label: "Layanan", url: "/#services" },
    { label: "Sertifikasi", url: "/#faq" },
    { label: "Kontak", url: "/#contact" },
  ];

  const socialLinks = links?.social?.length ? links.social : [];

  return (
    <footer className="bg-zinc-50 pt-16 pb-8 border-t border-zinc-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-16">
          
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/images/logo.png"
                alt={companyName}
                width={64} height={64}
                className="h-16 w-auto"
              />
            </Link>
            <p className="text-zinc-600 text-xs leading-relaxed mb-6 font-light">
              {companyDesc}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map((s) => {
                  const Icon = socialIconFor(s.label);
                  return (
                    <a
                      key={s.url + s.label}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="text-zinc-500 hover:text-pgp-red transition-colors"
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold text-pgp-navy uppercase tracking-widest mb-6">Company</h3>
            <ul className="space-y-4">
              {quickLinks.map((l) => {
                const isHash = l.url.includes("#");
                return (
                <li key={l.url + l.label}>
                  <Link href={l.url} onClick={isHash ? (e) => handleHashClick(e, l.url) : undefined} className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">{l.label}</Link>
                </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-pgp-navy uppercase tracking-widest mb-6">Services</h3>
            <ul className="space-y-4">
              {supportLinks.map((l) => {
                const isHash = l.url.includes("#");
                return (
                <li key={l.url + l.label}>
                  <Link href={l.url} onClick={isHash ? (e) => handleHashClick(e, l.url) : undefined} className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">{l.label}</Link>
                </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-pgp-navy uppercase tracking-widest mb-6">Kontak</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-2">
                <Phone size={12} className="text-pgp-red" />
                <span className="text-zinc-600 text-xs">{companyPhone}</span>
              </li>
              {info?.company_email && (
                <li className="flex items-center gap-2">
                  <Mail size={12} className="text-pgp-red" />
                  <span className="text-zinc-600 text-xs">{info.company_email}</span>
                </li>
              )}
              {info?.company_address && (
                <li className="flex items-center gap-2">
                  <MapPin size={12} className="text-pgp-red" />
                  <span className="text-zinc-600 text-xs">{info.company_address}</span>
                </li>
              )}
            </ul>
          </div>

        </div>

        <div className="border-t border-zinc-200/80 pt-6 text-center">
          <p className="text-zinc-500 text-[10px] font-bold">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
