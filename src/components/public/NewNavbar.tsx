"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface NavLink { name: string; href: string; }
interface NavbarProps {
  links?: { navbar?: NavLink[] };
  companyName?: string;
}

export default function NewNavbar({ links: linkSettings, companyName }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const defaultLinks = [
    { name: "Home", href: "/" },
    { name: "Tentang Kami", href: "/" },
    { name: "Layanan", href: "/" },
    { name: "Karir", href: "/career" },
    { name: "Kontak", href: "/" },
  ];

  const navLinks = linkSettings?.navbar?.length ? linkSettings.navbar : defaultLinks;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/60 h-[72px] flex items-center shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <img src="https://stag.ptpgp.co.id/web/image/website/1/logo/PRATAMA%20GALUH%20PERKASA?unique=af2b0b3" alt={companyName || "PT Pratama Galuh Perkasa"} className="h-14 w-auto" />
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 h-full">
            {navLinks.map((link) => (
              <Link
                key={link.href + link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href ? "text-pgp-red" : "text-gray-700 hover:text-pgp-red"
                }`}
              >
                {link.name}
              </Link>
            ))}
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
            {navLinks.map((link) => (
              <Link
                key={link.href + link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-pgp-red"
              >
                {link.name}
              </Link>
            ))}
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
