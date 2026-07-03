import Link from "next/link";
import { Truck, Home, MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-pgp-navy via-slate-900 to-black">
      {/* Decorative background truck icon */}
      <Truck
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 text-white/5 rotate-[-6deg]"
        size={640}
        strokeWidth={0.75}
      />
      <Truck
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 text-white/5 rotate-[8deg] hidden md:block"
        size={420}
        strokeWidth={0.75}
      />

      {/* Ambient glow accents */}
      <div className="pointer-events-none absolute top-1/4 left-1/3 h-72 w-72 rounded-full bg-pgp-red/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-orange-500/10 blur-[120px]" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 sm:px-8 text-center">
        <span className="inline-block py-1.5 px-4 bg-pgp-red/20 text-orange-400 font-extrabold text-xs tracking-wider uppercase rounded-full mb-8 border border-orange-500/30 backdrop-blur-sm">
          Error 404
        </span>

        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-base md:text-lg text-zinc-300 mb-10 leading-relaxed max-w-lg mx-auto">
          Sepertinya rute pengiriman ini salah alamat. Halaman yang Anda cari
          mungkin telah dipindahkan atau tidak lagi tersedia.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto bg-pgp-red hover:bg-pgp-red-hover text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg hover:shadow-pgp-red/25 flex items-center justify-center gap-2 text-sm"
          >
            <Home size={18} />
            Kembali ke Beranda
          </Link>
          <Link
            href="/#contact"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <MessageSquare size={18} />
            Hubungi Kami
          </Link>
        </div>
      </div>
    </div>
  );
}
