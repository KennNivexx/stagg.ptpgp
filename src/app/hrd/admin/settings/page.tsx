import { getSettings } from "@/app/actions/admin";
import SettingsClient from "./SettingsClient";

export default async function PengaturanPerusahaan() {
  const settings = await getSettings().catch(() => ({} as Record<string, string>));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Pengaturan Perusahaan</h1>
        <p className="text-sm text-gray-500">Konfigurasi informasi perusahaan, jam kerja, dan kebijakan cuti.</p>
      </div>
      <SettingsClient initialSettings={settings} />
    </div>
  );
}
