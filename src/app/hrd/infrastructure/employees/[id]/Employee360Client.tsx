"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, GraduationCap, Briefcase, TrendingUp, Wallet, Clock, HeartPulse,
  Package, FolderOpen, Sparkles, LogOut, Plus, Trash2, ExternalLink,
} from "lucide-react";
import {
  addEducation, deleteEducation, addFamilyMember, deleteFamilyMember,
  addProjectExperience, deleteProjectExperience, addCompanyAsset, updateAssetStatus,
  deleteCompanyAsset, addPersonalDocument, deletePersonalDocument, saveBpjsInfo,
  type getEmployee360,
} from "@/app/actions/employee360";

type Data = NonNullable<Awaited<ReturnType<typeof getEmployee360>>>;

const TABS = [
  { key: "personal", label: "Personal Information", icon: User },
  { key: "recruitment", label: "Education & Recruitment", icon: GraduationCap },
  { key: "employment", label: "Employment", icon: Briefcase },
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "compensation", label: "Compensation & Benefit", icon: Wallet },
  { key: "attendance", label: "Attendance", icon: Clock },
  { key: "health", label: "Health & Safety", icon: HeartPulse },
  { key: "asset", label: "Asset Management", icon: Package },
  { key: "document", label: "Document Center", icon: FolderOpen },
  { key: "experience", label: "Employee Experience", icon: Sparkles },
  { key: "offboarding", label: "Offboarding", icon: LogOut },
] as const;

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ModuleLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-[11px] font-bold text-[#CC0000] hover:underline">
      {label} <ExternalLink size={11} />
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-slate-400 py-4 text-center">{text}</p>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0 text-sm">{children}</div>;
}

export default function Employee360Client({ data }: { data: Data }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("personal");
  const k = data.karyawan as Record<string, unknown>;
  const karyawanId = k.id as string;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const runAction = async (fn: (fd: FormData) => Promise<{ error?: string; success?: boolean }>, fd: FormData, formEl?: HTMLFormElement) => {
    setBusy(true); setError("");
    const res = await fn(fd);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    formEl?.reset();
    router.refresh();
  };

  const runDelete = async (fn: (id: string, karyawanId: string) => Promise<{ error?: string; success?: boolean }>, id: string) => {
    setError("");
    const res = await fn(id, karyawanId);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-white font-black text-xl shrink-0">
          {((k.full_name as string) || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#1A2530]">{k.full_name as string}</h1>
          <p className="text-sm text-gray-500">{(k.position as string) || "—"} &bull; {(k.department as string) || "—"} &bull; {k.email as string}</p>
        </div>
        <span className={`ml-auto px-3 py-1.5 rounded-full text-xs font-extrabold border ${k.status === "Inactive" ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
          {(k.status as string) || "Aktif"}
        </span>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold">{error}</div>}

      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${tab === t.key ? "bg-[#CC0000] text-white" : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "personal" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Data Master & Kependudukan">
            <div className="grid grid-cols-2 gap-y-1 text-xs">
              <span className="text-slate-400">NIK</span><span className="font-semibold text-slate-700">{(k.nik as string) || "—"}</span>
              <span className="text-slate-400">Tempat/Tgl Lahir</span><span className="font-semibold text-slate-700">{(k.birth_place as string) || "—"}, {(k.birth_date as string) || "—"}</span>
              <span className="text-slate-400">Agama</span><span className="font-semibold text-slate-700">{(k.religion as string) || "—"}</span>
              <span className="text-slate-400">Gol. Darah</span><span className="font-semibold text-slate-700">{(k.blood_type as string) || "—"}</span>
              <span className="text-slate-400">Status Nikah</span><span className="font-semibold text-slate-700">{(k.marital_status as string) || "—"}</span>
              <span className="text-slate-400">Alamat KTP</span><span className="font-semibold text-slate-700">{(k.ktp_address as string) || "—"}</span>
            </div>
          </Card>
          <Card title="Kontak & Kontak Darurat">
            <div className="grid grid-cols-2 gap-y-1 text-xs">
              <span className="text-slate-400">Telepon</span><span className="font-semibold text-slate-700">{(k.phone as string) || "—"}</span>
              <span className="text-slate-400">Alamat</span><span className="font-semibold text-slate-700">{(k.address as string) || "—"}</span>
              <span className="text-slate-400">Kontak Darurat</span><span className="font-semibold text-slate-700">{(k.emergency_name as string) || "—"}</span>
              <span className="text-slate-400">No. Darurat</span><span className="font-semibold text-slate-700">{(k.emergency_phone as string) || "—"}</span>
            </div>
          </Card>

          <Card title="Data Keluarga" action={<span className="text-[10px] text-slate-400">{data.personal.keluarga.length} anggota</span>}>
            {data.personal.keluarga.length === 0 ? <Empty text="Belum ada data keluarga." /> : data.personal.keluarga.map(f => (
              <Row key={f.id as string}>
                <div><p className="font-semibold text-slate-800">{f.nama as string}</p><p className="text-[11px] text-slate-400">{f.hubungan as string} {f.pekerjaan ? `· ${f.pekerjaan}` : ""}</p></div>
                <button onClick={() => runDelete(deleteFamilyMember, f.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addFamilyMember, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="karyawan_id" value={karyawanId} />
              <input name="nama" placeholder="Nama" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="hubungan" placeholder="Hubungan (Istri/Anak/dst)" required className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="pekerjaan" placeholder="Pekerjaan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>

          <Card title="Data Pendidikan" action={<span className="text-[10px] text-slate-400">{data.personal.pendidikan.length} riwayat</span>}>
            {data.personal.pendidikan.length === 0 ? <Empty text="Belum ada riwayat pendidikan." /> : data.personal.pendidikan.map(e => (
              <Row key={e.id as string}>
                <div><p className="font-semibold text-slate-800">{e.jenjang as string} — {e.institusi as string}</p><p className="text-[11px] text-slate-400">{(e.jurusan as string) || ""} {e.tahun_lulus ? `· Lulus ${e.tahun_lulus}` : ""}</p></div>
                <button onClick={() => runDelete(deleteEducation, e.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addEducation, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="karyawan_id" value={karyawanId} />
              <input name="jenjang" placeholder="Jenjang (S1/SMA/dst)" required className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tahun_lulus" placeholder="Tahun Lulus" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="institusi" placeholder="Institusi" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="jurusan" placeholder="Jurusan" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
        </div>
      )}

      {tab === "recruitment" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Data Rekrutmen">
            {data.recruitment.pelamar ? (
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-slate-400">Posisi Dilamar</span><span className="font-semibold text-slate-700">{(data.recruitment.pelamar as Record<string, unknown>).position as string || "—"}</span>
                <span className="text-slate-400">Status</span><span className="font-semibold text-slate-700">{(data.recruitment.pelamar as Record<string, unknown>).status as string || "—"}</span>
              </div>
            ) : <Empty text="Tidak ditemukan riwayat lamaran (kemungkinan direkrut manual)." />}
            <div className="mt-3"><ModuleLink href="/hrd/recruitment/pipeline" label="Kelola di Rekrutmen" /></div>
          </Card>
          <Card title="Sertifikasi" action={<ModuleLink href="/hrd/learning/certificates" label="Kelola di Pelatihan" />}>
            {data.recruitment.sertifikat.length === 0 ? <Empty text="Belum ada sertifikat." /> : data.recruitment.sertifikat.map(s => (
              <Row key={s.id as string}><span className="font-semibold text-slate-700">{(s.certificate_number as string) || s.id as string}</span><span className="text-[11px] text-slate-400">{(s.status as string) || ""}</span></Row>
            ))}
          </Card>
          <Card title="Pelatihan Diikuti" action={<ModuleLink href="/hrd/learning/trainings" label="Kelola di Pelatihan" />}>
            {data.recruitment.peserta.length === 0 ? <Empty text="Belum mengikuti pelatihan." /> : data.recruitment.peserta.map(p => (
              <Row key={p.id as string}><span className="font-semibold text-slate-700">Training #{(p.training_id as string)?.slice(0, 8)}</span><span className="text-[11px] text-slate-400">{(p.status as string) || ""}</span></Row>
            ))}
          </Card>
        </div>
      )}

      {tab === "employment" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Data Kepegawaian (Kontrak)" action={<ModuleLink href="/hrd/infrastructure/contracts" label="Kelola di Kontrak Kerja" />}>
            {data.employment.kontrak.length === 0 ? <Empty text="Belum ada kontrak." /> : data.employment.kontrak.map(c => (
              <Row key={c.id as string}><span className="font-semibold text-slate-700">{(c.contract_type as string) || (c.type as string) || "Kontrak"}</span><span className="text-[11px] text-slate-400">{(c.status as string) || ""}</span></Row>
            ))}
          </Card>
          <Card title="Riwayat Jabatan & Organisasi" action={<ModuleLink href="/hrd/workplace/formasi" label="Kelola di Position Management" />}>
            {data.employment.riwayatPosisi.length === 0 ? <Empty text="Belum ada riwayat penempatan." /> : data.employment.riwayatPosisi.map(r => (
              <Row key={r.id as string}><span className="font-semibold text-slate-700">{r.jenis_perubahan as string}</span><span className="text-[11px] text-slate-400">{r.tanggal_mulai as string}{r.tanggal_selesai ? ` – ${r.tanggal_selesai}` : " (aktif)"}</span></Row>
            ))}
          </Card>
          <Card title="Mutasi & Promosi" action={<ModuleLink href="/hrd/career" label="Kelola di Pengembangan Karir" />}>
            {[...data.employment.mutasi.map(m => ({ ...m, _type: "Mutasi" })), ...data.employment.promosi.map(p => ({ ...p, _type: "Promosi" }))].length === 0
              ? <Empty text="Belum ada mutasi/promosi." />
              : [...data.employment.mutasi.map(m => ({ ...m, _type: "Mutasi" })), ...data.employment.promosi.map(p => ({ ...p, _type: "Promosi" }))].map((m, i) => (
                <Row key={i}><span className="font-semibold text-slate-700">{m._type} — {(m.to_position as string) || (m.to_department as string) || ""}</span><span className="text-[11px] text-slate-400">{(m.status as string) || ""}</span></Row>
              ))}
          </Card>
          <Card title="Project Experience">
            {data.employment.proyek.length === 0 ? <Empty text="Belum ada pengalaman proyek." /> : data.employment.proyek.map(p => (
              <Row key={p.id as string}>
                <div><p className="font-semibold text-slate-800">{p.nama_proyek as string}</p><p className="text-[11px] text-slate-400">{(p.peran as string) || ""} {p.klien ? `· ${p.klien}` : ""}</p></div>
                <button onClick={() => runDelete(deleteProjectExperience, p.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addProjectExperience, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="karyawan_id" value={karyawanId} />
              <input name="nama_proyek" placeholder="Nama Proyek" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="peran" placeholder="Peran" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="klien" placeholder="Klien" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
        </div>
      )}

      {tab === "performance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="KPI & Performance" action={<ModuleLink href="/hrd/performance/kpi" label="Kelola di Penilaian Kinerja" />}>
            {data.performance.kpi.length === 0 ? <Empty text="Belum ada evaluasi KPI." /> : data.performance.kpi.map(p => (
              <Row key={p.id as string}><span className="font-semibold text-slate-700">{(p.period as string) || ""}</span><span className="text-[11px] text-slate-400">Skor: {(p.score as number) ?? (p.actual_score as number) ?? "—"}</span></Row>
            ))}
          </Card>
          <Card title="Kompetensi" action={<ModuleLink href="/hrd/competency/assessment" label="Kelola di Kompetensi" />}>
            {data.performance.kompetensi.length === 0 ? <Empty text="Belum ada asesmen kompetensi." /> : data.performance.kompetensi.map(c => (
              <Row key={c.id as string}><span className="font-semibold text-slate-700">Skill #{(c.skill_id as string)?.slice(0, 10)}</span><span className="text-[11px] text-slate-400">Level {(c.current_level as number) ?? "—"}</span></Row>
            ))}
          </Card>
          <Card title="Reward & Recognition" action={<ModuleLink href="/hrd/rewards/awards" label="Kelola di Reward" />}>
            {data.performance.penghargaan.length === 0 ? <Empty text="Belum ada penghargaan." /> : data.performance.penghargaan.map(p => (
              <Row key={p.id as string}><span className="font-semibold text-slate-700">{p.category as string}</span><span className="text-[11px] text-slate-400">{p.award_date as string}</span></Row>
            ))}
          </Card>
          <Card title="Disiplin" action={<ModuleLink href="/hrd/relations/warnings" label="Kelola di Hubungan Karyawan" />}>
            {data.performance.peringatan.length === 0 ? <Empty text="Tidak ada surat peringatan." /> : data.performance.peringatan.map(p => (
              <Row key={p.id as string}><span className="font-semibold text-slate-700">{(p.type as string) || (p.level as string) || "SP"}</span><span className="text-[11px] text-slate-400">{p.created_at ? String(p.created_at).slice(0, 10) : ""}</span></Row>
            ))}
          </Card>
          <Card title="Talent Management" action={<ModuleLink href="/hrd/succession" label="Kelola di Suksesi" />}>
            <div className="text-xs space-y-1.5">
              <p><span className="text-slate-400">Pool Suksesi:</span> <span className="font-semibold text-slate-700">{data.performance.poolSuksesi ? (data.performance.poolSuksesi as Record<string, unknown>).potential_rating as string : "Belum masuk pool"}</span></p>
              <p><span className="text-slate-400">Kandidat Suksesor:</span> <span className="font-semibold text-slate-700">{data.performance.kandidatSuksesor ? "Ya" : "Belum"}</span></p>
            </div>
          </Card>
        </div>
      )}

      {tab === "compensation" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Payroll & Compensation" action={<ModuleLink href="/hrd/rewards/payroll" label="Kelola di Payroll" />}>
            {data.compensation.strukturGaji ? (
              <div className="grid grid-cols-2 gap-y-1 text-xs">
                <span className="text-slate-400">Gaji Pokok</span><span className="font-semibold text-slate-700">Rp {Number((data.compensation.strukturGaji as Record<string, unknown>).basic_salary || 0).toLocaleString("id-ID")}</span>
                <span className="text-slate-400">PTKP</span><span className="font-semibold text-slate-700">{(data.compensation.strukturGaji as Record<string, unknown>).ptkp_status as string || "—"}</span>
              </div>
            ) : <Empty text="Belum ada struktur gaji." />}
          </Card>
          <Card title="Riwayat Gaji">
            {data.compensation.penggajian.length === 0 ? <Empty text="Belum ada riwayat payroll." /> : data.compensation.penggajian.slice(0, 6).map(p => (
              <Row key={p.id as string}><span className="font-semibold text-slate-700">{p.month as string}/{p.year as string}</span><span className="text-[11px] text-slate-400">Rp {Number(p.net_salary || 0).toLocaleString("id-ID")}</span></Row>
            ))}
          </Card>
          <Card title="BPJS & Pajak">
            <form action={fd => runAction(saveBpjsInfo, fd)} className="grid grid-cols-1 gap-2">
              <input type="hidden" name="karyawan_id" value={karyawanId} />
              <label className="text-[10px] font-bold text-slate-400 uppercase">No. BPJS Kesehatan</label>
              <input name="bpjs_kesehatan_no" defaultValue={(k.bpjs_kesehatan_no as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <label className="text-[10px] font-bold text-slate-400 uppercase">No. BPJS Ketenagakerjaan</label>
              <input name="bpjs_tk_no" defaultValue={(k.bpjs_tk_no as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <button type="submit" disabled={busy} className="mt-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50">Simpan</button>
            </form>
          </Card>
        </div>
      )}

      {tab === "attendance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Absensi (30 terakhir)" action={<ModuleLink href="/hrd/attendance" label="Kelola di Absensi" />}>
            {data.attendance.absensi.length === 0 ? <Empty text="Belum ada data absensi." /> : data.attendance.absensi.slice(0, 10).map(a => (
              <Row key={a.id as string}><span className="font-semibold text-slate-700">{a.created_at ? String(a.created_at).slice(0, 10) : ""}</span><span className="text-[11px] text-slate-400">{(a.status as string) || (a.type as string) || ""}</span></Row>
            ))}
          </Card>
          <Card title="Cuti" action={<ModuleLink href="/hrd/leaves" label="Kelola di Cuti" />}>
            {data.attendance.cuti.length === 0 ? <Empty text="Belum ada pengajuan cuti." /> : data.attendance.cuti.map(c => (
              <Row key={c.id as string}><span className="font-semibold text-slate-700">{(c.leave_type as string) || (c.type as string) || "Cuti"}</span><span className="text-[11px] text-slate-400">{(c.status as string) || ""}</span></Row>
            ))}
          </Card>
        </div>
      )}

      {tab === "health" && (
        <Card title="Medical & HSE" action={<ModuleLink href="/hrd/incidents" label="Kelola di Laporan Insiden" />}>
          {data.health.insiden.length === 0 ? <Empty text="Tidak ada laporan insiden/kesehatan." /> : data.health.insiden.map(i => (
            <Row key={i.id as string}><span className="font-semibold text-slate-700">{(i.category as string) || (i.type as string) || "Insiden"}</span><span className="text-[11px] text-slate-400">{i.created_at ? String(i.created_at).slice(0, 10) : ""}</span></Row>
          ))}
        </Card>
      )}

      {tab === "asset" && (
        <Card title="Aset Perusahaan" action={<span className="text-[10px] text-slate-400">{data.asset.aset.length} item</span>}>
          {data.asset.aset.length === 0 ? <Empty text="Belum ada aset yang dipegang." /> : data.asset.aset.map(a => (
            <Row key={a.id as string}>
              <div><p className="font-semibold text-slate-800">{a.nama_aset as string}</p><p className="text-[11px] text-slate-400">{(a.kategori as string) || ""} {a.nomor_seri ? `· SN: ${a.nomor_seri}` : ""}</p></div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${a.status === "Dipegang" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{a.status as string}</span>
                {a.status === "Dipegang" && <button onClick={() => runAction(async () => updateAssetStatus(a.id as string, karyawanId, "Dikembalikan"), new FormData())} className="text-[10px] font-bold text-slate-500 hover:text-slate-800">Kembalikan</button>}
                <button onClick={() => runDelete(deleteCompanyAsset, a.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </div>
            </Row>
          ))}
          <form action={fd => runAction(addCompanyAsset, fd)} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="karyawan_id" value={karyawanId} />
            <input name="nama_aset" placeholder="Nama Aset" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
            <input name="kategori" placeholder="Kategori" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <input name="nomor_seri" placeholder="Nomor Seri" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah Aset</button>
          </form>
        </Card>
      )}

      {tab === "document" && (
        <Card title="Dokumen Digital" action={<span className="text-[10px] text-slate-400">{data.document.dokumen.length} dokumen</span>}>
          {data.document.dokumen.length === 0 ? <Empty text="Belum ada dokumen pribadi." /> : data.document.dokumen.map(d => (
            <Row key={d.id as string}>
              <div><p className="font-semibold text-slate-800">{d.judul as string}</p><p className="text-[11px] text-slate-400">{d.jenis as string} {d.catatan ? `· ${d.catatan}` : ""}</p></div>
              <button onClick={() => runDelete(deletePersonalDocument, d.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
            </Row>
          ))}
          <form action={fd => runAction(addPersonalDocument, fd)} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="karyawan_id" value={karyawanId} />
            <input name="jenis" placeholder="Jenis (KTP/Ijazah/dst)" required className="border border-gray-200 p-2 rounded-lg text-xs" />
            <input name="judul" placeholder="Judul Dokumen" required className="border border-gray-200 p-2 rounded-lg text-xs" />
            <input name="catatan" placeholder="Catatan (opsional)" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
            <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah Dokumen</button>
          </form>
        </Card>
      )}

      {tab === "experience" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Survei Keterlibatan" action={<ModuleLink href="/hrd/relations/surveys" label="Kelola di Survei Karyawan" />}>
            {data.experience.survei.length === 0 ? <Empty text="Belum mengisi survei." /> : data.experience.survei.map(s => (
              <Row key={s.id as string}><span className="font-semibold text-slate-700">Survei #{(s.survey_id as string)?.slice(0, 8)}</span><span className="text-[11px] text-slate-400">{s.submitted_at ? String(s.submitted_at).slice(0, 10) : ""}</span></Row>
            ))}
          </Card>
          <Card title="Keluhan" action={<ModuleLink href="/hrd/relations/complaints" label="Kelola di Hubungan Karyawan" />}>
            {data.experience.keluhan.length === 0 ? <Empty text="Tidak ada keluhan." /> : data.experience.keluhan.map(kl => (
              <Row key={kl.id as string}><span className="font-semibold text-slate-700">{(kl.category as string) || "Keluhan"}</span><span className="text-[11px] text-slate-400">{(kl.status as string) || ""}</span></Row>
            ))}
          </Card>
        </div>
      )}

      {tab === "offboarding" && (
        <Card title="Terminasi / Pengunduran Diri" action={<ModuleLink href="/hrd/relations/resignations" label="Kelola di Hubungan Karyawan" />}>
          {data.offboarding.resign.length === 0 ? <Empty text="Tidak ada proses offboarding." /> : data.offboarding.resign.map(r => (
            <Row key={r.id as string}><span className="font-semibold text-slate-700">{(r.reason as string) || "Pengunduran Diri"}</span><span className="text-[11px] text-slate-400">{(r.status as string) || ""}</span></Row>
          ))}
        </Card>
      )}
    </div>
  );
}
