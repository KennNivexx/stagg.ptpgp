"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Lock, Eye, ArrowRight, ShieldCheck, Globe, HelpCircle, LayoutDashboard } from "lucide-react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch {
      setError("Gagal masuk. Terjadi kesalahan pada server atau koneksi.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-white font-sans">
      
      {/* Left Side: Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-12 overflow-hidden border-r border-zinc-100">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>

        <div className="relative z-10 bg-[#FCFBF9]/95 backdrop-blur-md p-8 md:p-10 rounded-[32px] border border-orange-100/50 shadow-2xl max-w-lg mx-auto flex flex-col justify-between h-[80%] w-full">
          <div>
            <div className="flex items-center gap-3 mb-10 w-fit">
              <Image
                src="/images/logo.png"
                alt="PT Pratama Galuh Perkasa Logo"
                width={56} height={56}
                className="h-14 w-auto"
                priority
              />
            </div>
            
            <h1 className="text-3xl xl:text-4xl font-extrabold mb-6 leading-tight tracking-tight text-pgp-navy">
              Precision Logistics at a Global Scale
            </h1>
            <p className="text-sm md:text-base text-zinc-600 font-light leading-relaxed">
              Streamlining international freight forwarding with unwavering reliability and industrial integrity since inception.
            </p>
          </div>

          <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-gray-200/40">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
              <ShieldCheck size={18} className="text-pgp-red" /> ISO Certified
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
              <Globe size={18} className="text-pgp-red" /> Global Network
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 bg-[#FCFBF9]">
        <div className="max-w-md w-full mx-auto">
          
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-pgp-navy mb-2 tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-gray-500 font-light">Enter your credentials to access the logistics portal.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {error && (
              <div role="alert" className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-2">Email or Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="text" 
                  name="email"
                  placeholder="superadmin@ptpgp.co.id / hrd@ptpgp.co.id" 
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-gray-600">Password</label>
                <Link href="/login/forgot" className="text-xs text-pgp-red hover:text-pgp-red-hover font-bold transition-colors">Lupa Password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••" 
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 bg-white transition-all"
                />
                <button type="button" aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <Eye size={16} />
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-full shadow-lg shadow-pgp-red/15 text-sm font-bold text-white bg-pgp-red hover:bg-pgp-red-hover focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Signing in..." : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-16 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <span className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                <HelpCircle size={14} /> hrd@ptpgp.co.id
              </span>
              <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium">
                <LayoutDashboard size={14} /> Public Website
              </Link>
            </div>
            <p className="text-[10px] text-gray-400 font-light">
              &copy; {new Date().getFullYear()} PT Pratama Galuh Perkasa. All rights reserved. Secure Gateway.
            </p>
          </div>

        </div>
      </div>

    </main>
  );
}
