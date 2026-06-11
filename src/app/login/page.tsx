"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, ArrowRight, ShieldCheck, Globe, HelpCircle, LayoutDashboard } from "lucide-react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      console.log("Form submitted. Email:", formData.get("email"));
      const res = await loginAction(formData);
      console.log("loginAction response received:", res);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.redirect) {
        console.log("Redirecting to:", res.redirect);
        router.push(res.redirect);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Login submit error:", err);
      setError("Gagal masuk. Terjadi kesalahan pada server atau koneksi.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-white font-sans">
      
      {/* Left Side: Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-12 overflow-hidden border-r border-zinc-100">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" 
            alt="Port at sunset" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        <div className="relative z-10 bg-[#FCFBF9]/95 backdrop-blur-md p-8 md:p-10 rounded-[32px] border border-orange-100/50 shadow-2xl max-w-lg mx-auto flex flex-col justify-between h-[80%] w-full">
          <div>
            <div className="flex items-center gap-3 mb-10 w-fit">
              <img 
                src="https://stag.ptpgp.co.id/web/image/website/1/logo/PRATAMA%20GALUH%20PERKASA?unique=af2b0b3" 
                alt="PT Pratama Galuh Perkasa Logo" 
                className="h-14 w-auto" 
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
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2">Email or Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  name="email"
                  placeholder="superadmin@ptpgp.co.id / hrd@ptpgp.co.id" 
                  className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold text-gray-600">Password</label>
                <a href="#" className="text-xs text-pgp-red hover:text-pgp-red-hover font-bold transition-colors">Forgot Password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={16} className="text-gray-400" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••" 
                  className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 bg-white transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                  <Eye size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input 
                id="remember-me" 
                name="remember-me" 
                type="checkbox" 
                className="h-4 w-4 text-pgp-red focus:ring-pgp-red border-gray-300 rounded-lg cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-xs text-gray-600 cursor-pointer select-none">
                Remember me for 30 days
              </label>
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
              <a href="#" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium">
                <HelpCircle size={14} /> Support Center
              </a>
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
