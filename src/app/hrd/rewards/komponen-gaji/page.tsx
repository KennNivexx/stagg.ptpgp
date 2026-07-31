import { getJenisKomponenGaji } from "@/app/actions/payroll-components";
import { requireRole } from "@/lib/auth-guard";
import KomponenGajiClient from "./KomponenGajiClient";

export default async function KomponenGajiPage() {
  await requireRole("hrd", "superadmin", "director");
  const komponen = await getJenisKomponenGaji(true);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1A2530] mb-2">Jenis Tunjangan & Potongan</h1>
        <p className="text-sm text-gray-500">Kelola daftar jenis tunjangan dan potongan yang tersedia saat mengisi Komponen Gaji karyawan. Tambah jenis baru di sini — tidak perlu ubah kode aplikasi.</p>
      </div>
      <KomponenGajiClient initialKomponen={komponen} />
    </div>
  );
}
