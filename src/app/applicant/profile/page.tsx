import { getMyApplicationData } from "@/app/actions/applicant";
import { User, Mail, Phone, Briefcase, GraduationCap, Award, Globe, FileText } from "lucide-react";

export default async function ApplicantProfilePage() {
  const data = await getMyApplicationData();

  if (!data) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <FileText size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-sm text-slate-500">Data profil tidak ditemukan.</p>
        </div>
      </div>
    );
  }

  const p = data.profileData as Record<string, unknown>;

  const initials = (data.application.full_name || "")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-pgp-navy mb-2">Profil Lamaran</h1>
        <p className="text-sm text-gray-500">Data yang Anda kirimkan saat mendaftar.</p>
      </div>

      {/* Avatar & posisi */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-pgp-navy text-white flex items-center justify-center text-2xl font-extrabold shrink-0">
          {initials}
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-slate-800">{data.application.full_name}</h2>
          <p className="text-sm text-slate-500 mt-1">Melamar sebagai: <span className="font-bold text-pgp-red">{data.job?.position || "—"}</span></p>
          <p className="text-xs text-slate-400 mt-0.5">{data.job?.department || "—"}</p>
          <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            data.application.status === "Diterima" ? "bg-emerald-50 text-emerald-700" :
            data.application.status === "Ditolak" ? "bg-red-50 text-red-700" :
            "bg-amber-50 text-amber-700"
          }`}>
            {data.application.status}
          </span>
        </div>
      </div>

      {/* Kontak */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <User size={15} className="text-pgp-red" /> Data Kontak
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <ProfileItem icon={User} label="Nama Lengkap" value={data.application.full_name} />
          <ProfileItem icon={Mail} label="Email" value={data.application.email} />
          <ProfileItem icon={Phone} label="Telepon" value={data.application.phone || "—"} />
          <ProfileItem icon={Briefcase} label="Posisi Dilamar" value={data.job?.position || "—"} />
        </div>
      </div>

      {/* Pendidikan & Pengalaman dari profile_data */}
      {(!!(p.education || p.experience || p.last_position || p.last_company)) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <GraduationCap size={15} className="text-pgp-red" /> Pendidikan & Pengalaman
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {!!p.education && <ProfileItem icon={GraduationCap} label="Pendidikan Terakhir" value={String(p.education)} />}
            {!!p.major && <ProfileItem icon={GraduationCap} label="Jurusan" value={String(p.major)} />}
            {!!p.university && <ProfileItem icon={GraduationCap} label="Universitas" value={String(p.university)} />}
            {!!p.gpa && <ProfileItem icon={Award} label="IPK" value={String(p.gpa)} />}
            {!!p.experience && <ProfileItem icon={Briefcase} label="Pengalaman Kerja" value={String(p.experience)} />}
            {!!p.last_position && <ProfileItem icon={Briefcase} label="Jabatan Terakhir" value={String(p.last_position)} />}
            {!!p.last_company && <ProfileItem icon={Briefcase} label="Perusahaan Terakhir" value={String(p.last_company)} />}
          </div>
        </div>
      )}

      {/* Skill & Bahasa */}
      {(!!(p.skills || p.languages)) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Award size={15} className="text-pgp-red" /> Keahlian & Bahasa
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {!!p.skills && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Keahlian</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(p.skills) ? (p.skills as unknown[]) : String(p.skills).split(","))
                    .map((s: unknown, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg">
                        {String(s).trim()}
                      </span>
                    ))
                  }
                </div>
              </div>
            )}
            {!!p.languages && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Bahasa</p>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(p.languages) ? (p.languages as unknown[]) : String(p.languages).split(","))
                    .map((l: unknown, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg flex items-center gap-1">
                        <Globe size={10} /> {String(l).trim()}
                      </span>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Motivasi / Cover letter */}
      {(!!(p.motivation || p.cover_letter)) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <FileText size={15} className="text-pgp-red" /> Motivasi
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {String(p.motivation || p.cover_letter || "")}
            </p>
          </div>
        </div>
      )}

      {/* Info posisi yang dilamar */}
      {data.job && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-extrabold text-slate-700 text-sm">Detail Posisi yang Dilamar</h3>
          </div>
          <div className="p-6 space-y-3 text-sm text-slate-600">
            {data.job.education && (
              <div><span className="font-bold text-slate-700">Pendidikan: </span>{data.job.education}</div>
            )}
            {data.job.experience && (
              <div><span className="font-bold text-slate-700">Pengalaman: </span>{data.job.experience}</div>
            )}
            {data.job.requirements && (
              <div>
                <p className="font-bold text-slate-700 mb-1">Persyaratan:</p>
                <p className="text-slate-500 leading-relaxed whitespace-pre-line">{data.job.requirements}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-slate-50 rounded-lg shrink-0">
        <Icon size={14} className="text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
