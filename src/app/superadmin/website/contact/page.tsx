"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CompanyContactForm from "@/components/settings/CompanyContactForm";

export default function ContactCMS() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Link
          href="/superadmin"
          className="inline-flex items-center text-sm text-gray-500 hover:text-amber-600 transition-colors mb-4 font-semibold"
        >
          <ArrowLeft size={16} className="mr-1" /> Kembali ke Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-[#1A2530]">Edit Kontak Section</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit foto kantor, alamat, dan informasi kontak yang tampil di halaman publik.
        </p>
      </div>

      <CompanyContactForm />
    </div>
  );
}
