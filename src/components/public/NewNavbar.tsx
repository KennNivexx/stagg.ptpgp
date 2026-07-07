"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/60 h-[72px] flex items-center shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/images/logo.png" alt={companyName || "PT Pratama Galuh Perkasa"} width={56} height={56} className="h-10 sm:h-14 w-auto" priority />
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 h-full">
            {navLinks.map((link, idx) => {
              const isHash = link.url.includes("#");
              const linkPath = link.url.split("#")[0];
              const isActive = linkPath === "/" ? idx === 0 && pathname === "/" : pathname.startsWith(linkPath);
              return (
              <Link
                key={link.url + link.label}
                href={link.url}
                onClick={isHash ? (e) => handleHashClick(e, link.url) : undefined}
                className={`text-sm font-medium transition-colors ${
                  isActive ? "text-pgp-red" : "text-gray-700 hover:text-pgp-red"
                }`}
              >
                {link.label}
              </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-gray-700 hover:text-pgp-red text-xs font-bold px-5 py-2.5 rounded-full border border-gray-300 hover:border-pgp-red transition-all">
              Login
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden absolute top-[72px] left-0 w-full bg-white border-b border-gray-100 shadow-lg px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const isHash = link.url.includes("#");
              return (
              <Link
                key={link.url + link.label}
                href={link.url}
                onClick={(e) => { setIsOpen(false); if (isHash) handleHashClick(e, link.url); }}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-pgp-red"
              >
                {link.label}
              </Link>
              );
            })}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Link href="/login" onClick={() => setIsOpen(false)} className="flex-1 text-center py-2.5 text-gray-700 border border-gray-300 text-xs font-bold rounded-full">
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
