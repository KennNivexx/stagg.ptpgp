"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

export default function NewNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { name: "Home", href: "/" },
    { name: "Tentang Kami", href: "/" },
    { name: "Layanan", href: "/" },
    { name: "Karir", href: "/career" },
    { name: "Kontak", href: "/" }
  ];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/60 h-[72px] flex items-center shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <img src="https://stag.ptpgp.co.id/web/image/website/1/logo/PRATAMA%20GALUH%20PERKASA?unique=af2b0b3" alt="PT Pratama Galuh Perkasa" className="h-14 w-auto" />
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8 h-full">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className={`text-sm font-semibold transition-all flex items-center h-[72px] relative group ${isActive ? "text-pgp-red" : "text-gray-600 hover:text-pgp-red"}`}
                >
                  {link.name}
                  <span className={`absolute bottom-0 left-0 w-full h-[3px] bg-pgp-red transition-transform duration-300 origin-left ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}></span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-sm font-semibold text-gray-700 border border-gray-200 px-5 py-2.5 rounded-full hover:bg-gray-50 hover:border-pgp-red/50 hover:text-pgp-red transition-all duration-300">
              Masuk
            </Link>
            <Link href="/#contact" className="bg-pgp-red text-white text-sm font-bold px-6 py-2.5 rounded-full hover:bg-pgp-red-hover transition-all duration-300 shadow-md shadow-pgp-red/10 hover:shadow-pgp-red/20 hover:-translate-y-0.5">
              Hubungi Kami
            </Link>
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-pgp-red p-2 rounded-md hover:bg-gray-50 transition-colors">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg md:hidden animate-in fade-in slide-in-from-top-2 duration-250">
          <div className="px-4 py-4 space-y-2">
            {links.map((link) => (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-base font-semibold text-gray-700 hover:text-pgp-red hover:bg-orange-50/50 transition-all"
              >
                {link.name}
              </Link>
            ))}
            <div className="border-t border-gray-100 my-2 pt-4 space-y-2">
              <Link href="/login" onClick={() => setIsOpen(false)} className="block w-full text-center px-3 py-2.5 rounded-full border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
                Masuk
              </Link>
              <Link href="/#contact" onClick={() => setIsOpen(false)} className="block w-full text-center px-3 py-2.5 rounded-full bg-pgp-red text-white font-bold hover:bg-pgp-red-hover transition-colors">
                Hubungi Kami
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
