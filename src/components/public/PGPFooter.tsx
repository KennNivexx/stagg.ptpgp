import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export default function PGPFooter() {
  return (
    <footer className="bg-zinc-50 pt-16 pb-8 border-t border-zinc-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16 mb-16">
          
          {/* Brand & Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <img 
                src="https://stag.ptpgp.co.id/web/image/website/1/logo/PRATAMA%20GALUH%20PERKASA?unique=af2b0b3" 
                alt="PT Pratama Galuh Perkasa" 
                className="h-16 w-auto" 
              />
            </Link>
            <p className="text-zinc-600 text-xs leading-relaxed mb-6 font-light">
              Industrial Excellence in Logistics. Delivering precision and reliability across the archipelago.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-bold text-pgp-navy uppercase tracking-widest mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link href="/" className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">About Us</Link></li>
              <li><Link href="/" className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">Safety & Compliance</Link></li>
              <li><Link href="/" className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">Sustainability</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-bold text-pgp-navy uppercase tracking-widest mb-6">Services</h3>
            <ul className="space-y-4">
              <li><Link href="/#services" className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">Network</Link></li>
              <li><Link href="/" className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">Client Portal</Link></li>
              <li><Link href="/" className="text-zinc-600 text-xs hover:text-pgp-red transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold text-pgp-navy uppercase tracking-widest mb-6">Contact</h3>
            <ul className="space-y-6">
              <li className="flex items-center gap-3">
                <span className="text-zinc-600 text-xs">(0524) 570700</span>
              </li>
              <li className="flex gap-3">
                 <div className="w-6 h-6 bg-white border border-zinc-200 rounded flex items-center justify-center">
                    <div className="w-3 h-3 border border-zinc-300 rounded-sm"></div>
                 </div>
                 <div className="w-6 h-6 bg-orange-100 border border-orange-200/50 rounded flex items-center justify-center">
                    <Mail size={12} className="text-pgp-red" />
                 </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-zinc-200/80 pt-6 text-center">
          <p className="text-zinc-500 text-[10px] font-bold">
            &copy; {new Date().getFullYear()} PT Pratama Galuh Perkasa. All rights reserved. Industrial Excellence in Logistics.
          </p>
        </div>
      </div>
    </footer>
  );
}
