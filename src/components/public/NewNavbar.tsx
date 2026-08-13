"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

interface NavLink { label: string; url: string; }
interface NavbarProps {
  links?: { navbar?: NavLink[] };
  companyName?: string;
}

export default function NewNavbar({ links: linkSettings, companyName }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleHashClick = (e: React.MouseEvent, href: string) => {
    const [, hash] = href.split("#");
    if (!hash) return;

    if (pathname === "/" || pathname === "") {
      e.preventDefault();
      document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
    } else {
      e.preventDefault();
      router.push("/" + (hash ? "#" + hash : ""));
    }
  };

  const defaultLinks: NavLink[] = [
    { label: "Home", url: "/" },
    { label: "Tentang Kami", url: "/#about" },
    { label: "Layanan", url: "/#services" },
    { label: "Karir", url: "/career" },
    { label: "Kontak", url: "/#contact" },
  ];

  const navLinks = linkSettings?.navbar?.length ? linkSettings.navbar : defaultLinks;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#FBF8F4]/90 backdrop-blur-md border-b border-[#1A1612]/[0.06] h-[76px] flex items-center">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/images/logo.png" alt={companyName || "PT Pratama Galuh Perkasa"} width={56} height={56} className="h-9 sm:h-11 w-auto" priority />
              <span className="hidden sm:block h-6 w-px bg-[#1A1612]/10" />
              <span className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A1612]/60">
                {companyName || "Pratama Galuh Perkasa"}
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-9 h-full">
            {navLinks.map((link, idx) => {
              const isHash = link.url.includes("#");
              const linkPath = link.url.split("#")[0];
              const isActive = linkPath === "/" ? idx === 0 && pathname === "/" : pathname.startsWith(linkPath);
              return (
              <Link
                key={link.url + link.label}
                href={link.url}
                onClick={isHash ? (e) => handleHashClick(e, link.url) : undefined}
                className={`relative text-[13px] font-bold uppercase tracking-wider transition-colors py-1 ${
                  isActive ? "text-[#1A1612]" : "text-[#1A1612]/55 hover:text-[#1A1612]"
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-0.5 left-0 h-[2px] bg-pgp-red transition-all ${isActive ? "w-full" : "w-0"}`} />
              </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-[#1A1612]/70 hover:text-[#1A1612] text-xs font-bold px-3 py-2.5 transition-colors">
              Login
            </Link>
            <Link
              href="/#contact"
              onClick={(e) => handleHashClick(e, "/#contact")}
              className="group flex items-center gap-1.5 bg-pgp-red hover:bg-pgp-red-hover text-white text-xs font-extrabold pl-5 pr-4 py-3 rounded-lg transition-all shadow-[0_4px_14px_-2px_rgba(221,44,0,0.35)] hover:shadow-[0_6px_20px_-2px_rgba(221,44,0,0.45)] hover:-translate-y-0.5"
            >
              Request Quotation
              <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-[#1A1612] hover:bg-[#1A1612]/5"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden absolute top-[76px] left-0 w-full bg-[#FBF8F4] border-b border-[#1A1612]/10 shadow-lg px-5 py-4 space-y-1">
            {navLinks.map((link) => {
              const isHash = link.url.includes("#");
              return (
              <Link
                key={link.url + link.label}
                href={link.url}
                onClick={(e) => { setIsOpen(false); if (isHash) handleHashClick(e, link.url); }}
                className="block px-4 py-3 rounded-lg text-sm font-bold text-[#1A1612]/75 hover:bg-[#1A1612]/5 hover:text-pgp-red"
              >
                {link.label}
              </Link>
              );
            })}
            <div className="flex gap-2 pt-3 border-t border-[#1A1612]/10">
              <Link href="/login" onClick={() => setIsOpen(false)} className="flex-1 text-center py-3 text-[#1A1612] border border-[#1A1612]/15 text-xs font-bold rounded-lg">
                Login
              </Link>
              <Link
                href="/#contact"
                onClick={(e) => { setIsOpen(false); handleHashClick(e, "/#contact"); }}
                className="flex-1 text-center py-3 bg-pgp-red text-white text-xs font-bold rounded-lg"
              >
                Request Quotation
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
