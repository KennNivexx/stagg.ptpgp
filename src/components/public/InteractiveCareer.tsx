"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Briefcase, FileText, User, Mail, Phone,
  ChevronRight, X, CheckCircle2, Loader2, ArrowRight,
  Building2, GraduationCap, Award, Link2, Globe,
  Sparkles, Plus, Trash2, ChevronLeft, Languages,
} from "lucide-react";
import { submitApplication } from "@/app/actions/hrd";
import { Job } from "@/types";

type Experience = { _key: string; company: string; position: string; start: string; end: string; current: boolean; description: string };
type Education = { _key: string; school: string; degree: string; field: string; start: string; end: string };

function makeExperience(): Experience {
  return { _key: crypto.randomUUID(), company: "", position: "", start: "", end: "", current: false, description: "" };
}
function makeEducation(): Education {
  return { _key: crypto.randomUUID(), school: "", degree: "", field: "", start: "", end: "" };
}

export default function InteractiveCareer({ initialJobs }: { initialJobs: Job[] }) {
  const [jobs] = useState<Job[]>(initialJobs || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [isSpontaneousOpen, setIsSpontaneousOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [accountWarning, setAccountWarning] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [showingJobInfo, setShowingJobInfo] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    summary: "",
    linkedin: "",
    portfolio: "",
    cvFile: null as File | null,
    cvName: "",
    coverLetter: "",
    skills: [] as string[],
    skillInput: "",
    experiences: [] as Experience[],
    educations: [] as Education[],
    languages: [] as string[],
    languageInput: "",
    certifications: [] as string[],
    certInput: "",
  });

  const departments = ["All", ...Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)))];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDept === "All" || job.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const addSkill = () => {
    const s = formData.skillInput.trim();
    if (s && !formData.skills.includes(s)) {
      setFormData({ ...formData, skills: [...formData.skills, s], skillInput: "" });
    }
  };

  const removeSkill = (s: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((sk) => sk !== s) });
  };

  const addLanguage = () => {
    const l = formData.languageInput.trim();
    if (l && !formData.languages.includes(l)) {
      setFormData({ ...formData, languages: [...formData.languages, l], languageInput: "" });
    }
  };

  const addCert = () => {
    const c = formData.certInput.trim();
    if (c && !formData.certifications.includes(c)) {
      setFormData({ ...formData, certifications: [...formData.certifications, c], certInput: "" });
    }
  };

  const addExperience = () => {
    setFormData({ ...formData, experiences: [...formData.experiences, makeExperience()] });
  };

  const updateExperience = (idx: number, field: keyof Experience, value: string | boolean) => {
    const updated = [...formData.experiences];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, experiences: updated });
  };

  const removeExperience = (idx: number) => {
    setFormData({ ...formData, experiences: formData.experiences.filter((_, i) => i !== idx) });
  };

  const addEducation = () => {
    setFormData({ ...formData, educations: [...formData.educations, makeEducation()] });
  };

  const updateEducation = (idx: number, field: keyof Education, value: string) => {
    const updated = [...formData.educations];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, educations: updated });
  };

  const removeEducation = (idx: number) => {
    setFormData({ ...formData, educations: formData.educations.filter((_, i) => i !== idx) });
  };

  const resetForm = () => {
    setFormData({
      name: "", email: "", phone: "", location: "", headline: "", summary: "",
      linkedin: "", portfolio: "", cvFile: null, cvName: "", coverLetter: "",
      skills: [], skillInput: "", experiences: [], educations: [],
      languages: [], languageInput: "", certifications: [], certInput: "",
    });
  };

  const openModal = (job: Job | null, spontaneous: boolean) => {
    setStep(1);
    setSubmitError(null);
    setStepError(null);
    setSubmitSuccess(false);
    resetForm();
    if (spontaneous) {
      setIsSpontaneousOpen(true);
      setActiveJob(null);
      setShowingJobInfo(false);
    } else {
      setActiveJob(job);
      setIsSpontaneousOpen(false);
      setShowingJobInfo(true);
    }
  };

  const closeModal = () => {
    if (!submitting) {
      setActiveJob(null);
      setIsSpontaneousOpen(false);
      setSubmitSuccess(false);
      setEmailSent(false);
      setAccountWarning(null);
      setShowingJobInfo(false);
      resetForm();
    }
  };

  const [stepError, setStepError] = useState<string | null>(null);

  const validateAndNextStep = () => {
    setStepError(null);
    if (step === 1) {
      if (!formData.name.trim()) { setStepError("Nama lengkap wajib diisi."); return; }
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setStepError("Alamat email tidak valid."); return;
      }
      if (!formData.phone.trim()) { setStepError("Nomor telepon wajib diisi."); return; }
      if (!formData.headline.trim()) { setStepError("Professional headline wajib diisi."); return; }
      if (!formData.location.trim()) { setStepError("Lokasi wajib diisi."); return; }
      if (!formData.summary.trim()) { setStepError("Ringkasan profesional wajib diisi."); return; }
    }
    if (step === 2) {
      if (formData.experiences.length === 0) {
        setStepError("Tambahkan minimal 1 riwayat pengalaman kerja. Klik '+ Tambah' di atas."); return;
      }
      const incomplete = formData.experiences.some(e => !e.company.trim() || !e.position.trim());
      if (incomplete) { setStepError("Lengkapi nama perusahaan dan posisi jabatan untuk setiap pengalaman."); return; }
    }
    if (step === 3) {
      if (formData.educations.length === 0) {
        setStepError("Tambahkan minimal 1 riwayat pendidikan. Klik '+ Tambah' di atas."); return;
      }
      const incomplete = formData.educations.some(e => !e.school.trim() || !e.degree.trim());
      if (incomplete) { setStepError("Lengkapi nama sekolah/universitas dan gelar untuk setiap pendidikan."); return; }
    }
    if (step === 4) {
      if (formData.skills.length === 0) {
        setStepError("Tambahkan minimal 1 keahlian (skill) sebelum melanjutkan."); return;
      }
    }
    setStep(step + 1);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const profileData = {
      headline: formData.headline,
      summary: formData.summary,
      location: formData.location,
      linkedin: formData.linkedin,
      portfolio: formData.portfolio,
      skills: formData.skills,
      experiences: formData.experiences,
      educations: formData.educations,
      languages: formData.languages,
      certifications: formData.certifications,
      coverLetter: formData.coverLetter,
    };

    const data = new FormData();
    data.append("full_name", formData.name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("job_id", isSpontaneousOpen ? "00000000-0000-0000-0000-000000000000" : activeJob?.id || "");
    if (formData.cvFile) {
      data.append("cv_file", formData.cvFile);
    }
    data.append("profile_data", JSON.stringify(profileData));

    try {
      const result = await submitApplication(data);
      if (result.error) {
        setSubmitError(result.error);
        setSubmitting(false);
      } else {
        setSubmitSuccess(true);
        setSubmitting(false);
        setEmailSent(!!result.emailSent);
        if (result.accountWarning) {
          setAccountWarning(result.accountWarning as string);
        }
      }
    } catch {
      setSubmitError("Gagal mengirim lamaran. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "Personal" },
    { num: 2, label: "Pengalaman" },
    { num: 3, label: "Pendidikan" },
    { num: 4, label: "Keahlian" },
    { num: 5, label: "Lampiran" },
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-6 px-4">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center gap-1">
          <button
            onClick={() => !submitting && step > s.num && setStep(s.num)}
            disabled={submitting || step <= s.num}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step === s.num
                ? "bg-pgp-red text-white shadow-md shadow-pgp-red/20"
                : step > s.num
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {step > s.num ? <CheckCircle2 size={14} /> : s.num}
          </button>
          <span className={`hidden sm:block text-[10px] font-bold ${step === s.num ? "text-pgp-red" : step > s.num ? "text-emerald-600" : "text-gray-400"}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && <div className={`w-6 h-0.5 rounded-full ${step > s.num ? "bg-emerald-500" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      {/* Search Section */}
      <div className="mb-12 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari posisi pekerjaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-full border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none text-sm transition-all bg-gray-50/50"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept || "All")}
                className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                  selectedDept === dept
                    ? "bg-pgp-red text-white shadow-md shadow-pgp-red/15"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jobs Grid */}
      <motion.div layout className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-white py-16 px-6 text-center rounded-3xl border border-gray-100 shadow-sm"
            >
              <Briefcase className="text-gray-300 mx-auto mb-4 w-12 h-12" />
              <p className="text-gray-500 font-medium text-lg">Pekerjaan tidak ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba cari dengan kata kunci lain.</p>
            </motion.div>
          ) : (
            filteredJobs.map((job) => (
              <motion.div
                key={job.id} layoutId={job.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md hover:border-pgp-red/25 transition-all duration-300 group"
              >
                <div className="flex gap-6 items-start md:items-center flex-1">
                  <div className="w-14 h-14 bg-orange-50/60 text-pgp-red border border-orange-100/60 flex items-center justify-center rounded-2xl shrink-0 group-hover:bg-pgp-red group-hover:text-white transition-all duration-300">
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-pgp-navy mb-2 tracking-tight group-hover:text-pgp-red transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 font-medium">
                      {job.location && <span className="flex items-center gap-1.5"><MapPin size={14} className="text-pgp-red/80" /> {job.location}</span>}
                      <span className="flex items-center gap-1.5">Penuh Waktu</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto">
                  {job.department && (
                    <span className="px-3.5 py-1.5 bg-orange-50 text-pgp-red text-[11px] font-bold rounded-full uppercase tracking-wider border border-orange-100">
                      {job.department}
                    </span>
                  )}
                  <button
                    onClick={() => openModal(job, false)}
                    className="bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold px-6 py-3 rounded-full transition-all duration-300 shadow-md shadow-pgp-red/10 cursor-pointer flex items-center gap-1.5"
                  >
                    Lamar <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spontaneous */}
      <div className="mt-16 text-center bg-orange-50/20 p-8 rounded-3xl border border-orange-500/5 max-w-2xl mx-auto">
        <p className="text-gray-600 text-sm mb-4 font-light">Tidak menemukan posisi yang cocok? Kami selalu mencari talenta terbaik.</p>
        <button
          onClick={() => openModal(null, true)}
          className="text-pgp-red font-bold text-sm hover:text-pgp-red-hover flex items-center justify-center gap-1.5 transition-all group mx-auto cursor-pointer"
        >
          Kirim Lamaran Spontan <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {(activeJob || isSpontaneousOpen) && (
          <div className="fixed inset-0 z-50 flex items-start justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white shadow-2xl w-full h-screen overflow-hidden relative z-10 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-pgp-red">
                    {isSpontaneousOpen ? "Lamaran Spontan" : activeJob?.department || "Karir"}
                  </span>
                  <h3 className="text-lg font-bold text-pgp-navy mt-0.5">
                    {isSpontaneousOpen ? "Formulir Lamaran" : activeJob?.title}
                  </h3>
                </div>
                <button disabled={submitting} onClick={closeModal} className="p-1.5 rounded-full hover:bg-gray-200/80 text-gray-500 transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {submitSuccess ? (
                  <div className="p-8 max-w-3xl mx-auto w-full">
                  <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                    <h4 className="text-lg font-bold text-pgp-navy mb-2">Lamaran Berhasil Dikirim!</h4>
                    <p className="text-sm text-gray-500 max-w-sm mb-6">Tim HRD kami akan meninjau lamaran Anda segera. Pantau perkembangannya melalui Portal Pelamar.</p>

                    {emailSent && !accountWarning ? (
                      <div className="w-full max-w-sm bg-slate-900 rounded-2xl p-6 text-left mt-2">
                        <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">✅ Cek Email Anda</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Kami telah mengirim link untuk mengakses <strong className="text-white">Portal Pelamar</strong> ke alamat email yang Anda daftarkan. Klik link tersebut untuk login dan memantau status lamaran Anda secara real-time.
                        </p>
                        <p className="text-[10px] text-amber-400 mt-4 leading-relaxed">
                          ⚠️ Tidak menerima email? Periksa folder spam, atau hubungi HRD. Akun akan otomatis dihapus jika lamaran tidak lolos seleksi.
                        </p>
                      </div>
                    ) : (
                      <div className="w-full max-w-sm mt-2">
                        {accountWarning && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-left">
                            <p className="text-xs text-amber-700 font-semibold">{accountWarning}</p>
                          </div>
                        )}
                        <a
                          href="/login"
                          className="mt-2 px-6 py-2.5 bg-[#CC0000] text-white text-sm font-bold rounded-xl hover:bg-[#aa0000] transition-colors inline-block"
                        >
                          Login ke Portal Pelamar →
                        </a>
                      </div>
                    )}
                  </motion.div>
                  </div>
                ) : showingJobInfo && activeJob ? (
                  /* ── STEP 0: Job info / persyaratan ── */
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-6 md:p-10 max-w-3xl mx-auto w-full">
                    {/* Badge + Title */}
                    <div className="mb-6">
                      {activeJob.department && (
                        <span className="inline-block px-3 py-1 bg-orange-50 text-pgp-red text-[11px] font-bold rounded-full border border-orange-100 uppercase tracking-wider mb-3">
                          {activeJob.department}
                        </span>
                      )}
                      <h3 className="text-2xl font-extrabold text-pgp-navy">{activeJob.title}</h3>
                      {activeJob.location && (
                        <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-2">
                          <MapPin size={14} className="text-pgp-red/70" /> {activeJob.location}
                        </p>
                      )}
                    </div>

                    {/* Quick info pills */}
                    {(activeJob.education || activeJob.experience || activeJob.age_min || activeJob.age_max) && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {activeJob.education && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                            <GraduationCap size={12} className="text-pgp-red" /> {activeJob.education}
                          </span>
                        )}
                        {activeJob.experience && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                            <Briefcase size={12} className="text-pgp-red" /> {activeJob.experience}
                          </span>
                        )}
                        {(activeJob.age_min || activeJob.age_max) && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full">
                            Usia {activeJob.age_min || "-"}–{activeJob.age_max || "-"} tahun
                          </span>
                        )}
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-pgp-red text-xs font-semibold rounded-full border border-orange-100">
                          Penuh Waktu
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {activeJob.description && (
                      <div className="mb-5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tentang Posisi Ini</h4>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{activeJob.description}</p>
                      </div>
                    )}

                    {/* Job Desk */}
                    {activeJob.job_desk && (
                      <div className="mb-5">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggung Jawab</h4>
                        <ul className="space-y-1.5">
                          {/* static list - index key is safe */}
                          {activeJob.job_desk.split("\n").filter(Boolean).map((line, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pgp-red shrink-0" />
                              {line}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Requirements */}
                    {activeJob.requirements && (
                      <div className="mb-6 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Persyaratan</h4>
                        <ul className="space-y-2">
                          {/* static list - index key is safe */}
                          {activeJob.requirements.split("\n").filter(Boolean).map((req, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-900">
                              <CheckCircle2 size={14} className="mt-0.5 text-amber-500 shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="pt-2 border-t border-gray-100 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-gray-400">Pastikan Anda memenuhi persyaratan di atas sebelum melamar.</p>
                      <button
                        onClick={() => setShowingJobInfo(false)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold rounded-full transition-all shadow-md shadow-pgp-red/15 cursor-pointer"
                      >
                        Saya Mengerti, Lanjut Melamar <ChevronRight size={16} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-8 max-w-3xl mx-auto w-full">
                    {renderStepIndicator()}
                    {submitError && (
                      <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{submitError}</div>
                    )}

                    <form onSubmit={handleApplySubmit}>
                      {/* STEP 1: Personal Info */}
                      {step === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <User size={16} className="text-pgp-red" />
                            <h4 className="font-bold text-sm text-pgp-navy">Informasi Personal</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nama Lengkap *</label>
                              <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Contoh: Budi Santoso"
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Professional Headline *</label>
                              <input type="text" required value={formData.headline} onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                placeholder="Cth: Senior Logistics Manager"
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Email *</label>
                              <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  placeholder="budi@example.com"
                                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Nomor Telepon *</label>
                              <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                  placeholder="081234567890"
                                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Lokasi *</label>
                                <div className="relative">
                                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                  <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="Jakarta, Indonesia"
                                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all" />
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">LinkedIn URL</label>
                              <div className="relative">
                                <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input type="url" value={formData.linkedin} onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                  placeholder="linkedin.com/in/budi"
                                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Ringkasan Profesional *</label>
                              <textarea rows={3} required value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                placeholder="Tulis ringkasan singkat tentang pengalaman dan keahlian profesional Anda..."
                              className="w-full p-4 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all resize-none" />
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 2: Work Experience */}
                      {step === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Building2 size={16} className="text-pgp-red" />
                              <h4 className="font-bold text-sm text-pgp-navy">Pengalaman Kerja</h4>
                            </div>
                            <button type="button" onClick={addExperience}
                              className="text-xs font-bold text-pgp-red hover:text-pgp-red-hover flex items-center gap-1">
                              <Plus size={14} /> Tambah
                            </button>
                          </div>
                          {formData.experiences.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-6">Belum ada pengalaman kerja. Klik &quot;Tambah&quot; untuk menambahkan.</p>
                          )}
                          {formData.experiences.map((exp, idx) => (
                            <div key={exp._key} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3 relative">
                              <button type="button" onClick={() => removeExperience(idx)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Perusahaan</label>
                                  <input type="text" value={exp.company} onChange={(e) => updateExperience(idx, "company", e.target.value)}
                                    placeholder="PT. Maju Jaya" className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Posisi</label>
                                  <input type="text" value={exp.position} onChange={(e) => updateExperience(idx, "position", e.target.value)}
                                    placeholder="Logistics Manager" className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Mulai</label>
                                  <input type="month" value={exp.start} onChange={(e) => updateExperience(idx, "start", e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Selesai</label>
                                  <input type="month" value={exp.end}
                                    onChange={(e) => updateExperience(idx, "end", e.target.value)}
                                    className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Deskripsi</label>
                                <textarea rows={2} value={exp.description} onChange={(e) => updateExperience(idx, "description", e.target.value)}
                                  placeholder="Deskripsikan tanggung jawab dan pencapaian..."
                                  className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none resize-none" />
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* STEP 3: Education */}
                      {step === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GraduationCap size={16} className="text-pgp-red" />
                              <h4 className="font-bold text-sm text-pgp-navy">Pendidikan</h4>
                            </div>
                            <button type="button" onClick={addEducation}
                              className="text-xs font-bold text-pgp-red hover:text-pgp-red-hover flex items-center gap-1">
                              <Plus size={14} /> Tambah
                            </button>
                          </div>
                          {formData.educations.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-6">Belum ada riwayat pendidikan.</p>
                          )}
                          {formData.educations.map((edu, idx) => (
                            <div key={edu._key} className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-3 relative">
                              <button type="button" onClick={() => removeEducation(idx)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Sekolah/Universitas</label>
                                  <input type="text" value={edu.school} onChange={(e) => updateEducation(idx, "school", e.target.value)}
                                    placeholder="Universitas Indonesia" className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Gelar</label>
                                  <input type="text" value={edu.degree} onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                                    placeholder="S1 / S2 / Diploma" className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase">Jurusan</label>
                                  <input type="text" value={edu.field} onChange={(e) => updateEducation(idx, "field", e.target.value)}
                                    placeholder="Manajemen Logistik" className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                </div>
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Mulai</label>
                                    <input type="month" value={edu.start} onChange={(e) => updateEducation(idx, "start", e.target.value)}
                                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                  </div>
                                  <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Selesai</label>
                                    <input type="month" value={edu.end} onChange={(e) => updateEducation(idx, "end", e.target.value)}
                                      className="w-full mt-1 px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}

                      {/* STEP 4: Skills, Languages, Certifications */}
                      {step === 4 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                          {/* Skills */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Sparkles size={16} className="text-pgp-red" />
                              <h4 className="font-bold text-sm text-pgp-navy">Keahlian (Skills)</h4>
                            </div>
                            <div className="flex gap-2 mb-3">
                              <input type="text" value={formData.skillInput}
                                onChange={(e) => setFormData({ ...formData, skillInput: e.target.value })}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                                placeholder="Tambah keahlian..."
                                className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                              <button type="button" onClick={addSkill}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors">+ Tambah</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.skills.map((s) => (
                                <span key={s} className="px-3 py-1.5 bg-orange-50 text-pgp-red text-xs font-semibold rounded-full flex items-center gap-1.5 border border-orange-100">
                                  {s}
                                  <button type="button" onClick={() => removeSkill(s)} className="hover:text-red-700"><X size={12} /></button>
                                </span>
                              ))}
                              {formData.skills.length === 0 && <p className="text-xs text-gray-400">Belum ada keahlian ditambahkan.</p>}
                            </div>
                          </div>

                          {/* Languages */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Languages size={16} className="text-pgp-red" />
                              <h4 className="font-bold text-sm text-pgp-navy">Bahasa</h4>
                            </div>
                            <div className="flex gap-2 mb-3">
                              <input type="text" value={formData.languageInput}
                                onChange={(e) => setFormData({ ...formData, languageInput: e.target.value })}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLanguage(); } }}
                                placeholder="Cth: Bahasa Inggris (Professional)"
                                className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                              <button type="button" onClick={addLanguage}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors">+ Tambah</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.languages.map((l) => (
                                <span key={l} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-blue-100">
                                  {l}
                                  <button type="button" onClick={() => setFormData({ ...formData, languages: formData.languages.filter((x) => x !== l) })} className="hover:text-blue-900"><X size={12} /></button>
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Certifications */}
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Award size={16} className="text-pgp-red" />
                              <h4 className="font-bold text-sm text-pgp-navy">Sertifikasi</h4>
                            </div>
                            <div className="flex gap-2 mb-3">
                              <input type="text" value={formData.certInput}
                                onChange={(e) => setFormData({ ...formData, certInput: e.target.value })}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCert(); } }}
                                placeholder="Cth: ISO 9001 Lead Auditor"
                                className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none" />
                              <button type="button" onClick={addCert}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold transition-colors">+ Tambah</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.certifications.map((c) => (
                                <span key={c} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1.5 border border-emerald-100">
                                  {c}
                                  <button type="button" onClick={() => setFormData({ ...formData, certifications: formData.certifications.filter((x) => x !== c) })} className="hover:text-emerald-900"><X size={12} /></button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 5: Attachments & Cover Letter */}
                      {step === 5 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={16} className="text-pgp-red" />
                              <h4 className="font-bold text-sm text-pgp-navy">Lampiran & Cover Letter</h4>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Unggah CV / Resume (PDF) *</label>
                              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center hover:border-pgp-red/50 transition-all relative">
                                <input type="file" accept=".pdf" required
                                  onChange={(e) => setFormData({ ...formData, cvName: e.target.value, cvFile: e.target.files?.[0] || null })}
                                  className="absolute inset-0 opacity-0 cursor-pointer" />
                                <FileText className="mx-auto text-gray-400 w-8 h-8 mb-2" />
                                <p className="text-xs font-medium text-gray-700">Pilih file CV Anda</p>
                                <p className="text-[10px] text-gray-400 mt-1">Hanya file PDF (Maks. 5MB)</p>
                                {formData.cvName && <p className="text-[11px] text-pgp-red font-bold mt-2">File: {formData.cvName.split('\\').pop()}</p>}
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Cover Letter</label>
                            <textarea rows={4} value={formData.coverLetter} onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                              placeholder="Ceritakan mengapa Anda tertarik bergabung dengan PT Pratama Galuh Perkasa..."
                              className="w-full p-4 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all resize-none" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Portfolio / Website</label>
                            <div className="relative">
                              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input type="url" value={formData.portfolio} onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                                placeholder="https://portfolio-anda.com"
                                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-pgp-red focus:ring-1 focus:ring-pgp-red/20 outline-none transition-all" />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Navigation Buttons */}
                      {stepError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold">
                          {stepError}
                        </div>
                      )}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                        {step > 1 && (
                          <button type="button" onClick={() => setStep(step - 1)}
                            className="px-5 py-2.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors flex items-center gap-1.5">
                            <ChevronLeft size={16} /> Sebelumnya
                          </button>
                        )}
                        <div className="flex-1" />
                        {step < 5 && (
                          <button type="button" onClick={validateAndNextStep}
                            className="px-5 py-2.5 text-sm font-bold bg-pgp-red hover:bg-pgp-red-hover text-white rounded-full transition-colors flex items-center gap-1.5 shadow-md shadow-pgp-red/10">
                            Selanjutnya <ChevronRight size={16} />
                          </button>
                        )}
                        {step === 5 && (
                          <button type="submit" disabled={submitting}
                            className="w-full md:w-auto px-8 py-3 bg-pgp-red hover:bg-pgp-red-hover text-white text-sm font-bold rounded-full transition-all duration-300 shadow-md shadow-pgp-red/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</> : "Kirim Lamaran"}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
