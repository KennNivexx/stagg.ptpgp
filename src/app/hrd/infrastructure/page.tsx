import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { Users, UserCheck, FileText, ShieldCheck, Plus, Download } from "lucide-react";
import SectionQuickLinks from "@/components/hrd/SectionQuickLinks";
import EmptyState from "@/components/EmptyState";
import { HrdPageHeader, HrdStatsCard, HrdCard, HrdActionButton } from "@/components/hrd/HrdUi";

export const dynamic = "force-dynamic";

export default async function Employee360Hub() {
  const [{ data: employees }, { data: contracts }, { data: licenses }] = await Promise.all([
    supabaseAdmin.from("karyawan").select("id, full_name, position, department, status, nik, kode_jabatan, emergency_phone, marital_status, ktp_address").neq("status", "Inactive"),
    supabaseAdmin.from("kontrak_kerja").select("id"),
    supabaseAdmin.from("sim_sertifikasi_karyawan").select("id"),
  ]);

  const empList = (employees || []) as Record<string, unknown>[];
  const complete = empList.filter(e => e.nik && e.emergency_phone && e.marital_status && e.ktp_address).length;
  const completePct = empList.length > 0 ? Math.round((complete / empList.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <HrdPageHeader
        title="Employee 360°"
        subtitle="Profil terpadu karyawan — data personal, kepegawaian, performa, kompensasi, hingga aset perusahaan dalam satu tempat."
      >
        <HrdActionButton href="/hrd/infrastructure/employees/new" icon={<Plus size={14} />} variant="primary">Tambah Karyawan</HrdActionButton>
        <HrdActionButton href="/api/employees/export" icon={<Download size={14} />} variant="outline">Ekspor</HrdActionButton>
      </HrdPageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <HrdStatsCard label="Total Karyawan Aktif" value={empList.length} icon={<Users size={18} />} color="blue" />
        <HrdStatsCard label="Data Personal Lengkap" value={`${completePct}%`} icon={<UserCheck size={18} />} color="emerald" />
        <HrdStatsCard label="Kontrak Terdaftar" value={(contracts || []).length} icon={<FileText size={18} />} color="amber" />
        <HrdStatsCard label="SIM & Sertifikasi" value={(licenses || []).length} icon={<ShieldCheck size={18} />} color="purple" />
      </div>

      <HrdCard title="Daftar Karyawan" subtitle="Klik karyawan untuk melihat profil terpadu lengkap" icon={<Users size={16} />} iconColor="blue" action={{ label: "Lihat semua", href: "/hrd/infrastructure/employees" }}>
        {empList.length === 0 ? (
          <EmptyState icon={Users} title="Belum ada data karyawan." className="border-none" />
        ) : (
          <div className="divide-y divide-slate-50">
            {empList.slice(0, 8).map(e => (
              <Link key={e.id as string} href={`/hrd/infrastructure/employees/${e.id}`}
                className="px-4 py-3 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 shrink-0">
                    {((e.full_name as string) || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{e.full_name as string}</p>
                    <p className="text-[11px] text-slate-400 truncate">{(e.position as string) || "—"} · {(e.department as string) || "—"}</p>
                    {(e.kode_jabatan as string) && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{e.kode_jabatan as string}</p>}
                  </div>
                </div>
                <span className="text-xs font-bold text-pgp-red shrink-0">Lihat Profil &rarr;</span>
              </Link>
            ))}
          </div>
        )}
      </HrdCard>

      <HrdCard title="Menu Lengkap Employee 360°" subtitle="Akses cepat ke semua fitur modul ini" icon={<FileText size={16} />} iconColor="slate">
        <SectionQuickLinks groupLabel="Employee 360°" excludeHref="/hrd/infrastructure" />
      </HrdCard>
    </div>
  );
}
