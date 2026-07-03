"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Mail, Phone, MapPin } from "lucide-react";

interface FooterLink { name: string; href: string; }
interface FooterProps {
  info?: { company_name?: string; company_phone?: string; company_email?: string; company_address?: string; company_description?: string };
  footer?: { footer_copyright?: string; footer_description?: string };
  links?: { footer_quick?: FooterLink[]; footer_support?: FooterLink[]; social?: FooterLink[] };
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
  const companyDesc = info?.company_description || footer?.footer_description || "Industrial Excellence in Logistics. Delivering precision and reliability across the archipelago.";
  const copyright = footer?.footer_copyright || `\u00a9 ${new Date().getFullYear()} ${companyName}. All rights reserved.`;

  const quickLinks = links?.footer_quick?.length ? links.footer_quick : [
    { name: "Tentang Kami", href: "/#about" },
    { name: "Karir", href: "/career" },
    { name: "Kontak", href: "/#contact" },
  ];

  const supportLinks = links?.footer_support?.length ? links.footer_support : [
    { name: "Layanan", href: "/#services" },
    { name: "Sertifikasi", href: "/#faq" },
    { name: "Kontak", href: "/#contact" },
  ];

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
          </div>

          <div>
            <h3 className="text-xs font-bold text-pgp-navy uppercase tracking-widest mb-6">Company</h3>
            <ul className="space-y-4">
              {quickLinks.map((l) => {
                const isHash = l.href.includes("#");
                return (
                <li key={l.name}>
                  <Link href={l.href} onClick={isHash ? (e) => handleHashClick(e, l.href) : undefined} className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">{l.name}</Link>
                </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-pgp-navy uppercase tracking-widest mb-6">Services</h3>
            <ul className="space-y-4">
              {supportLinks.map((l) => {
                const isHash = l.href.includes("#");
                return (
                <li key={l.name}>
                  <Link href={l.href} onClick={isHash ? (e) => handleHashClick(e, l.href) : undefined} className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">{l.name}</Link>
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
