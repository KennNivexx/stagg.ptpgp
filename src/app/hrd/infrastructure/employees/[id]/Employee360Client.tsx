"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, GraduationCap, Briefcase, TrendingUp, Wallet, Clock, HeartPulse,
  Package, FolderOpen, Sparkles, LogOut, Plus, Trash2, ExternalLink,
  ShieldCheck, Leaf
} from "lucide-react";
import DocumentUploadField from "@/components/DocumentUploadField";
import {
  addProjectExperience, deleteProjectExperience, addCompanyAsset, updateAssetStatus,
  deleteCompanyAsset, addPersonalDocument, deletePersonalDocument, saveBpjsInfo,
  type getEmployee360,
} from "@/app/actions/employee360";
import {
  saveDataPribadi, addFamilyMemberByEmail, deleteFamilyMemberByEmail,
  addEducationByEmail, deleteEducationByEmail, addCatatan, deleteCatatan,
} from "@/app/actions/data-pribadi";

type Data = NonNullable<Awaited<ReturnType<typeof getEmployee360>>>;

const TABS = [
  { key: "personal", label: "Personal Information", icon: User },
  { key: "recruitment", label: "Education & Recruitment", icon: GraduationCap },
  { key: "employment", label: "Employment", icon: Briefcase },
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "compensation", label: "Compensation & Benefit", icon: Wallet },
  { key: "attendance", label: "Attendance", icon: Clock },
  { key: "health", label: "Health (Medical)", icon: HeartPulse },
  { key: "safety", label: "Safety", icon: ShieldCheck },
  { key: "environment", label: "Environment", icon: Leaf },
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
  const email = (k.email as string) || "";
  const dp = data.personal.dataPribadi as Record<string, unknown> | null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [newAssetFotoUrl, setNewAssetFotoUrl] = useState("");
  const [newDocumentUrl, setNewDocumentUrl] = useState("");

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

  const runDeleteByEmail = async (fn: (id: string, email: string) => Promise<{ error?: string; success?: boolean }>, id: string) => {
    setError("");
    const res = await fn(id, email);
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
          <Card title="Data Master, Kependudukan & Kontak" action={<span className="text-[10px] text-slate-400">Bisa diisi HRD maupun karyawan sendiri</span>}>
            <form action={fd => runAction(saveDataPribadi, fd)} className="grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input name="nik" placeholder="NIK" defaultValue={(dp?.nik as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="birth_place" placeholder="Tempat Lahir" defaultValue={(dp?.birth_place as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="birth_date" type="date" placeholder="Tgl Lahir" defaultValue={(dp?.birth_date as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="religion" placeholder="Agama" defaultValue={(dp?.religion as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="blood_type" placeholder="Gol. Darah" defaultValue={(dp?.blood_type as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="marital_status" placeholder="Status Nikah" defaultValue={(dp?.marital_status as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="ktp_address" placeholder="Alamat KTP" defaultValue={(dp?.ktp_address as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="phone" placeholder="Telepon" defaultValue={(dp?.phone as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="address" placeholder="Alamat" defaultValue={(dp?.address as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="emergency_name" placeholder="Kontak Darurat (Nama)" defaultValue={(dp?.emergency_name as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="emergency_phone" placeholder="No. Darurat" defaultValue={(dp?.emergency_phone as string) || ""} className="border border-gray-200 p-2 rounded-lg text-xs" />
              <button type="submit" disabled={busy} className="col-span-2 mt-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50">Simpan</button>
            </form>
          </Card>

          <Card title="Data Keluarga" action={<span className="text-[10px] text-slate-400">{data.personal.keluarga.length} anggota</span>}>
            {data.personal.keluarga.length === 0 ? <Empty text="Belum ada data keluarga." /> : data.personal.keluarga.map(f => (
              <Row key={f.id as string}>
                <div><p className="font-semibold text-slate-800">{f.nama as string}</p><p className="text-[11px] text-slate-400">{f.hubungan as string} {f.pekerjaan ? `· ${f.pekerjaan}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteFamilyMemberByEmail, f.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addFamilyMemberByEmail, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
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
                <button onClick={() => runDeleteByEmail(deleteEducationByEmail, e.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addEducationByEmail, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
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
          <Card title="Data Rekrutmen" action={<span className="text-[10px] text-slate-400">{data.recruitment.catRekrutmen.length} catatan</span>}>
            {data.recruitment.pelamar && (
              <div className="grid grid-cols-2 gap-y-1 text-xs mb-3 pb-3 border-b border-slate-50">
                <span className="text-slate-400">Posisi Dilamar</span><span className="font-semibold text-slate-700">{(data.recruitment.pelamar as Record<string, unknown>).position as string || "—"}</span>
                <span className="text-slate-400">Status</span><span className="font-semibold text-slate-700">{(data.recruitment.pelamar as Record<string, unknown>).status as string || "—"}</span>
              </div>
            )}
            {data.recruitment.catRekrutmen.length === 0 ? <Empty text="Belum ada catatan rekrutmen." /> : data.recruitment.catRekrutmen.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="rekrutmen" />
              <input name="judul" placeholder="Catatan Rekrutmen" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Sertifikasi" action={<span className="text-[10px] text-slate-400">{data.recruitment.catSertifikasi.length} catatan</span>}>
            {data.recruitment.catSertifikasi.length === 0 ? <Empty text="Belum ada sertifikasi." /> : data.recruitment.catSertifikasi.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="sertifikasi" />
              <input name="judul" placeholder="Nama Sertifikasi" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Penerbit" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal (cth: 2026-01-10)" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Pelatihan Diikuti" action={<span className="text-[10px] text-slate-400">{data.recruitment.catPelatihan.length} catatan</span>}>
            {data.recruitment.catPelatihan.length === 0 ? <Empty text="Belum ada pelatihan." /> : data.recruitment.catPelatihan.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="pelatihan" />
              <input name="judul" placeholder="Nama Pelatihan" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Penyelenggara" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Mandatory Knowledge" action={<span className="text-[10px] text-slate-400">{data.recruitment.mandatoryKnowledge.length} materi</span>}>
            {data.recruitment.mandatoryKnowledge.length === 0 ? (
              <Empty text="Belum ada materi wajib untuk jabatan ini." />
            ) : data.recruitment.mandatoryKnowledge.map(kn => (
              <Row key={`${kn.content_type}-${kn.content_id}`}>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={13} className={kn.mandatory ? "text-red-500" : "text-slate-300"} />
                  <div>
                    <p className="font-semibold text-slate-800">{kn.title}</p>
                    <p className="text-[11px] text-slate-400">{kn.content_type.toUpperCase()} · Kompetensi: {kn.skill_name} {kn.mandatory ? "· Wajib" : ""}</p>
                  </div>
                </div>
              </Row>
            ))}
          </Card>
        </div>
      )}

      {tab === "employment" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Data Kepegawaian (Kontrak)" action={<span className="text-[10px] text-slate-400">{data.employment.catKontrak.length} catatan</span>}>
            {data.employment.catKontrak.length === 0 ? <Empty text="Belum ada catatan kontrak." /> : data.employment.catKontrak.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="kontrak" />
              <input name="judul" placeholder="Jenis Kontrak" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Nomor / Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tgl Mulai (cth: 2026-01-01)" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status (Aktif/Berakhir)" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Riwayat Jabatan & Organisasi">
            {data.employment.riwayatPosisi.length === 0 ? <Empty text="Belum ada riwayat penempatan." /> : data.employment.riwayatPosisi.map(r => (
              <Row key={r.id as string}><span className="font-semibold text-slate-700">{r.jenis_perubahan as string}</span><span className="text-[11px] text-slate-400">{r.tanggal_mulai as string}{r.tanggal_selesai ? ` – ${r.tanggal_selesai}` : " (aktif)"}</span></Row>
            ))}
          </Card>
          <Card title="Mutasi & Promosi" action={<span className="text-[10px] text-slate-400">{data.employment.catMutasiPromosi.length} catatan</span>}>
            {data.employment.catMutasiPromosi.length === 0 ? <Empty text="Belum ada catatan mutasi/promosi." /> : data.employment.catMutasiPromosi.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="mutasi_promosi" />
              <input name="judul" placeholder="Jenis (Mutasi/Promosi)" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Jabatan/Departemen Tujuan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
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
          {data.performance.kpi.some(k => k.final_score != null) && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">Final Performance Score (Target Achievement × bobot + Culture Achievement × bobot)</p>
              <div className="flex flex-wrap gap-3">
                {data.performance.kpi.filter(k => k.final_score != null).map(k => (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-2.5 bg-slate-50 rounded-xl">
                    <div>
                      <p className="text-[10px] text-slate-400">{k.period}</p>
                      <p className="text-lg font-extrabold text-slate-800">{Number(k.final_score).toFixed(0)}</p>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <p>TA: {Number(k.score ?? 0).toFixed(0)} × {k.ta_weight_used ?? "-"}%</p>
                      <p>Culture: {k.culture_score != null ? Number(k.culture_score).toFixed(0) : "-"} × {k.culture_weight_used ?? "-"}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Card title="KPI & Performance" action={<span className="text-[10px] text-slate-400">{data.performance.catKpi.length} catatan</span>}>
            {data.performance.catKpi.length === 0 ? <Empty text="Belum ada catatan KPI." /> : data.performance.catKpi.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="kpi" />
              <input name="judul" placeholder="Periode / Nama KPI" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Skor / Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Kompetensi" action={<span className="text-[10px] text-slate-400">{data.performance.catKompetensi.length} catatan</span>}>
            {data.performance.catKompetensi.length === 0 ? <Empty text="Belum ada catatan kompetensi." /> : data.performance.catKompetensi.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="kompetensi" />
              <input name="judul" placeholder="Nama Kompetensi" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Level / Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal Asesmen" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Reward & Recognition" action={<span className="text-[10px] text-slate-400">{data.performance.catReward.length} catatan</span>}>
            {data.performance.catReward.length === 0 ? <Empty text="Belum ada catatan reward." /> : data.performance.catReward.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="reward" />
              <input name="judul" placeholder="Nama Penghargaan" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Kategori / Pemberi" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Disiplin" action={<span className="text-[10px] text-slate-400">{data.performance.catDisiplin.length} catatan</span>}>
            {data.performance.catDisiplin.length === 0 ? <Empty text="Tidak ada catatan disiplin." /> : data.performance.catDisiplin.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="disiplin" />
              <input name="judul" placeholder="Jenis Pelanggaran / SP" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Talent Management" action={<span className="text-[10px] text-slate-400">{data.performance.catTalent.length} catatan</span>}>
            {data.performance.catTalent.length === 0 ? <Empty text="Belum ada catatan talent." /> : data.performance.catTalent.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="talent" />
              <input name="judul" placeholder="Pool / Program Talent" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Potensi / Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
        </div>
      )}

      {tab === "compensation" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Payroll & Compensation" action={<span className="text-[10px] text-slate-400">{data.compensation.catPayroll.length} catatan</span>}>
            {data.compensation.catPayroll.length === 0 ? <Empty text="Belum ada catatan payroll." /> : data.compensation.catPayroll.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="payroll" />
              <input name="judul" placeholder="Periode / Komponen" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Nominal / Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
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
          <Card title="Absensi" action={<span className="text-[10px] text-slate-400">{data.attendance.catAbsensi.length} catatan</span>}>
            {data.attendance.catAbsensi.length === 0 ? <Empty text="Belum ada catatan absensi." /> : data.attendance.catAbsensi.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="absensi" />
              <input name="judul" placeholder="Keterangan Absensi" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Jenis (Hadir/Izin/Sakit/dst)" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
          <Card title="Cuti" action={<span className="text-[10px] text-slate-400">{data.attendance.catCuti.length} catatan</span>}>
            {data.attendance.catCuti.length === 0 ? <Empty text="Belum ada catatan cuti." /> : data.attendance.catCuti.map(c => (
              <Row key={c.id}>
                <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </Row>
            ))}
            <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="kategori" value="cuti" />
              <input name="judul" placeholder="Jenis Cuti" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <input name="subjudul" placeholder="Alasan" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="tanggal" placeholder="Tanggal Mulai" className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="status" placeholder="Status (Disetujui/Ditolak)" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
            </form>
          </Card>
        </div>
      )}

      {tab === "health" && (
        <Card title="Health (Medical)" action={<span className="text-[10px] text-slate-400">{data.health.catMedical.length} catatan</span>}>
          {data.health.catMedical.length === 0 ? <Empty text="Tidak ada catatan health." /> : data.health.catMedical.map(c => (
            <Row key={c.id}>
              <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
              <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
            </Row>
          ))}
          <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="kategori" value="medical" />
            <input name="judul" placeholder="Judul (MCU/Vaksin/dst)" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
            <input name="subjudul" placeholder="Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <select name="status" defaultValue="" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2 bg-white" required>
              <option value="" disabled>Pilih Status</option>
              <option value="Fit">Fit</option>
              <option value="Fit with Restriction">Fit with Restriction</option>
              <option value="Unfit">Unfit</option>
              <option value="Follow Up">Follow Up</option>
            </select>
            <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
          </form>
        </Card>
      )}

      {tab === "safety" && (
        <Card title="Safety" action={<span className="text-[10px] text-slate-400">{data.health.catSafety.length} catatan</span>}>
          {data.health.catSafety.length === 0 ? <Empty text="Tidak ada catatan safety." /> : data.health.catSafety.map(c => (
            <Row key={c.id}>
              <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
              <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
            </Row>
          ))}
          <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="kategori" value="safety" />
            <input name="judul" placeholder="Judul (Insiden/Inspeksi/dst)" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
            <input name="subjudul" placeholder="Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <select name="status" defaultValue="" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2 bg-white" required>
              <option value="" disabled>Pilih Status</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Action Required">Action Required</option>
              <option value="Closed">Closed</option>
            </select>
            <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
          </form>
        </Card>
      )}

      {tab === "environment" && (
        <Card title="Environment" action={<span className="text-[10px] text-slate-400">{data.health.catEnvironment.length} catatan</span>}>
          {data.health.catEnvironment.length === 0 ? <Empty text="Tidak ada catatan environment." /> : data.health.catEnvironment.map(c => (
            <Row key={c.id}>
              <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
              <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
            </Row>
          ))}
          <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="kategori" value="environment" />
            <input name="judul" placeholder="Judul (Audit/Limbah/dst)" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
            <input name="subjudul" placeholder="Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <select name="status" defaultValue="" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2 bg-white" required>
              <option value="" disabled>Pilih Status</option>
              <option value="Compliant">Compliant</option>
              <option value="Non-Compliant">Non-Compliant</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
            </select>
            <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
          </form>
        </Card>
      )}

      {tab === "asset" && (
        <Card title="Aset Perusahaan" action={<span className="text-[10px] text-slate-400">{data.asset.aset.length} item</span>}>
          {data.asset.aset.length === 0 ? <Empty text="Belum ada aset yang dipegang." /> : data.asset.aset.map(a => (
            <Row key={a.id as string}>
              <div className="flex gap-3">
                {a.foto_url ? <img src={a.foto_url as string} alt={a.nama_aset as string} className="w-10 h-10 rounded bg-slate-100 object-cover" /> : null}
                <div><p className="font-semibold text-slate-800">{a.nama_aset as string}</p><p className="text-[11px] text-slate-400">{(a.kategori as string) || ""} {a.nomor_seri ? `· SN: ${a.nomor_seri}` : ""}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${a.status === "Dipegang" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>{a.status as string}</span>
                {a.status === "Dipegang" && <button onClick={() => runAction(async () => updateAssetStatus(a.id as string, karyawanId, "Dikembalikan"), new FormData())} className="text-[10px] font-bold text-slate-500 hover:text-slate-800">Kembalikan</button>}
                <button onClick={() => runDelete(deleteCompanyAsset, a.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
              </div>
            </Row>
          ))}
          <form action={async fd => {
            await runAction(addCompanyAsset, fd);
            setNewAssetFotoUrl("");
          }} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="karyawan_id" value={karyawanId} />
            <input type="hidden" name="foto_url" value={newAssetFotoUrl} />
            <div className="col-span-2">
              <DocumentUploadField label="Foto Aset" folder="assets" bucket="hrd-files" value={newAssetFotoUrl} onChange={setNewAssetFotoUrl} hint="Unggah foto aset (opsional)" />
            </div>
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
              <div className="flex flex-col">
                <p className="font-semibold text-slate-800">{d.judul as string}</p>
                <p className="text-[11px] text-slate-400">{d.jenis as string} {d.catatan ? `· ${d.catatan}` : ""}</p>
                {d.file_url && <a href={d.file_url as string} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline mt-0.5">Lihat Dokumen</a>}
              </div>
              <button onClick={() => runDelete(deletePersonalDocument, d.id as string)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
            </Row>
          ))}
          <form action={async fd => {
            await runAction(addPersonalDocument, fd);
            setNewDocumentUrl("");
          }} className="mt-3 grid grid-cols-2 gap-2">
              <input type="hidden" name="karyawan_id" value={karyawanId} />
              <input type="hidden" name="file_url" value={newDocumentUrl} />
              <div className="col-span-2">
                <DocumentUploadField label="File Dokumen" folder="documents" bucket="hrd-files" value={newDocumentUrl} onChange={setNewDocumentUrl} hint="Unggah dokumen (PDF, Gambar)" />
              </div>
              <input name="jenis" placeholder="Jenis (KTP/Ijazah/dst)" required className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="judul" placeholder="Judul Dokumen" required className="border border-gray-200 p-2 rounded-lg text-xs" />
              <input name="catatan" placeholder="Catatan (opsional)" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
              <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah Dokumen</button>
            </form>
          </Card>
        )}

        {tab === "experience" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Survei Keterlibatan" action={<span className="text-[10px] text-slate-400">{data.experience.catSurvei.length} catatan</span>}>
              {data.experience.catSurvei.length === 0 ? <Empty text="Belum ada catatan survei." /> : data.experience.catSurvei.map(c => (
                <Row key={c.id}>
                  <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                  <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                </Row>
              ))}
              <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="kategori" value="survei" />
                <input name="judul" placeholder="Nama Survei" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
                <input name="subjudul" placeholder="Skor / Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
                <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
                <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
              </form>
            </Card>
            <Card title="Keluhan" action={<span className="text-[10px] text-slate-400">{data.experience.catKeluhan.length} catatan</span>}>
              {data.experience.catKeluhan.length === 0 ? <Empty text="Tidak ada catatan keluhan." /> : data.experience.catKeluhan.map(c => (
                <Row key={c.id}>
                  <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
                  <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
                </Row>
              ))}
              <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="kategori" value="keluhan" />
                <input name="judul" placeholder="Judul Keluhan" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
                <input name="subjudul" placeholder="Kategori / Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
                <input name="tanggal" placeholder="Tanggal" className="border border-gray-200 p-2 rounded-lg text-xs" />
                <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
                <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
              </form>
            </Card>
          </div>
        )}

      {tab === "offboarding" && (
        <Card title="Terminasi / Pengunduran Diri" action={<span className="text-[10px] text-slate-400">{data.offboarding.catResign.length} catatan</span>}>
          {data.offboarding.catResign.length === 0 ? <Empty text="Tidak ada catatan offboarding." /> : data.offboarding.catResign.map(c => (
            <Row key={c.id}>
              <div><p className="font-semibold text-slate-800">{c.judul}</p><p className="text-[11px] text-slate-400">{c.subjudul || ""} {c.tanggal ? `· ${c.tanggal}` : ""} {c.status ? `· ${c.status}` : ""}</p></div>
              <button onClick={() => runDeleteByEmail(deleteCatatan, c.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600"><Trash2 size={13} /></button>
            </Row>
          ))}
          <form action={fd => runAction(addCatatan, fd)} className="mt-3 grid grid-cols-2 gap-2">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="kategori" value="resign" />
            <input name="judul" placeholder="Jenis (Resign/Terminasi/Pensiun)" required className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
            <input name="subjudul" placeholder="Alasan / Keterangan" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <input name="tanggal" placeholder="Tanggal Efektif" className="border border-gray-200 p-2 rounded-lg text-xs" />
            <input name="status" placeholder="Status" className="border border-gray-200 p-2 rounded-lg text-xs col-span-2" />
            <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-1.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold disabled:opacity-50"><Plus size={13} /> Tambah</button>
          </form>
        </Card>
      )}
    </div>
  );
}
