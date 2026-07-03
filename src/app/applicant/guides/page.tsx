"use client";

import GuideViewer from "@/components/GuideViewer";

export default function ApplicantGuidesPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A2530]">Bantuan & Panduan</h1>
        <p className="text-sm text-gray-500 mt-1">Panduan seputar proses lamaran dan penggunaan portal pelamar.</p>
      </div>
      <GuideViewer />
    </div>
  );
}
