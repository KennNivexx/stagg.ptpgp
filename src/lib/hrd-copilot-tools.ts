import type Groq from "groq-sdk";
import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { searchEmployees } from "@/app/actions/employee";
import { getLeaves } from "@/app/actions/leaves";
import { getRelationsExecutiveMetrics } from "@/app/actions/employee-relations";
import { getAssetRepairRequests, getAssets } from "@/app/actions/ga-assets";
import { getMaintenanceRequests } from "@/app/actions/ga-infrastruktur";
import { getMutations, getPromotions, getCareerRequests } from "@/app/actions/career-hrd";
import { getCompetencyRequests, getSkills } from "@/app/actions/skills";
import { getAllAttendance } from "@/app/actions/attendance";
import { getJobPostings } from "@/app/actions/recruitment";
import { getRecruitmentSLAStatus, getChannelEffectiveness } from "@/app/actions/recruitment-intelligence";
import { getTNA, getTrainings, getTrainingCertificates } from "@/app/actions/trainings";
import { getKpiEvaluationsWithJabatan } from "@/app/actions/performance-hrd";
import { getAwards, getBonuses } from "@/app/actions/rewards";
import { getDepartments } from "@/app/actions/org";
import { getFormasiList } from "@/app/actions/formasi";
import { getMasterJabatan } from "@/app/actions/positions";
import { getJobDescsForPosition, getJobDescs } from "@/app/actions/jobdesc";
import { MENU_GROUPS } from "@/lib/hrd-menu";

// Every tool here wraps an EXISTING server action (or, where none exists, a
// small direct query following the same requireRole pattern) — none of them
// bypass the role checks those actions already enforce. If the logged-in
// user's role isn't allowed by the underlying action, it throws
// ForbiddenError/UnauthorizedError, which the dispatcher below turns into a
// plain-language refusal the model can relay instead of a stack trace.
//
// Responses are deliberately summarized/capped (counts + short lists, not
// raw table dumps) — this keeps each tool call's token cost small and the
// model's answer focused, per the research this was built from: several
// existing "get*" actions return up to 200-500 raw rows, which would blow
// up context and produce rambling answers if piped straight into the chat.

export const HRD_COPILOT_TOOLS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_employees",
      description: "Cari karyawan aktif berdasarkan nama, NIK, kode karyawan, atau kode jabatan. Gunakan untuk pertanyaan seperti 'siapa itu X' atau 'cari karyawan bernama Y'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Nama, NIK, atau kata kunci pencarian. Kosongkan atau jangan diisi untuk daftar karyawan teratas." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_hrd_modules",
      description: "Daftar seluruh menu/modul yang tersedia di aplikasi HRIS ini beserta sub-menunya. Gunakan untuk pertanyaan umum seperti 'menu apa saja yang ada', 'fitur apa saja di sistem ini', 'di mana saya bisa lihat X', atau saat pertanyaan pengguna terlalu umum/tidak jelas datanya — tawarkan navigasi ke modul yang relevan.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recruitment_overview",
      description: "Ringkasan rekrutmen: jumlah lowongan aktif, efektivitas per kanal lamaran, dan jumlah lamaran yang melewati batas waktu (SLA) tiap tahap. Gunakan untuk pertanyaan tentang rekrutmen, lowongan, atau pipeline kandidat secara umum.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_competency_overview",
      description: "Ringkasan kompetensi: jumlah kompetensi dalam pustaka, dan daftar kesenjangan (gap) kompetensi terbesar antar karyawan. Gunakan untuk pertanyaan tentang kompetensi, skill matrix, atau analisis gap.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_learning_overview",
      description: "Ringkasan pelatihan: jumlah program training, daftar training terbaru, dan jumlah sertifikat yang sudah diterbitkan. Gunakan untuk pertanyaan tentang pelatihan, training, atau sertifikasi karyawan.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_performance_overview",
      description: "Ringkasan kinerja: jumlah evaluasi KPI, rata-rata skor, dan daftar evaluasi terbaru. Gunakan untuk pertanyaan tentang KPI, performa, atau penilaian kinerja karyawan.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_reward_overview",
      description: "Ringkasan reward & recognition: jumlah penghargaan (awards) dan bonus/insentif yang tercatat, beserta beberapa contoh terbaru. Gunakan untuk pertanyaan tentang penghargaan, bonus, atau insentif karyawan.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_asset_fleet_overview",
      description: "Ringkasan aset & armada: jumlah kendaraan per status (aktif/servis/nonaktif), dokumen kendaraan yang akan/telah kedaluwarsa, dan jumlah aset perusahaan per kondisi. Gunakan untuk pertanyaan tentang kendaraan, armada, atau aset perusahaan.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_jabatan",
      description: "Cari daftar jabatan/posisi berdasarkan nama jabatan, departemen, atau kode jabatan — menampilkan kode, nama, departemen, level, grade, dan apakah jabatan itu kepala unit. Gunakan untuk pertanyaan seperti 'jabatan apa saja yang ada', 'sebutkan jabatan di divisi X', 'apa kode jabatan Y', atau 'jabatan apa yang ada di atas/bawah Z'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Nama jabatan, departemen, atau kode jabatan. Kosongkan atau jangan diisi untuk daftar jabatan teratas." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_jobdesc",
      description: "Ambil deskripsi kerja (tanggung jawab & persyaratan) untuk satu nama jabatan/posisi tertentu. Gunakan untuk pertanyaan seperti 'apa tugas jabatan X' atau 'deskripsi kerja posisi Y'.",
      parameters: {
        type: "object",
        properties: {
          position: { type: "string", description: "Nama jabatan/posisi persis, mis. 'Manager HRD'." },
        },
        required: ["position"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_org_overview",
      description: "Ringkasan struktur organisasi: jumlah departemen/unit, dan jumlah formasi jabatan yang kosong (vacant) vs terisi (filled). Gunakan untuk pertanyaan tentang struktur organisasi, unit kerja, atau formasi jabatan.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_payroll_overview",
      description: "Ringkasan penggajian bulan berjalan: total payroll, rata-rata gaji bersih per departemen, dan gaji tertinggi/terendah. Gunakan untuk pertanyaan umum soal penggajian seperti 'berapa total gaji bulan ini' atau 'rata-rata gaji per departemen'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_payroll",
      description: "Cari data penggajian (gaji pokok, tunjangan, potongan, gaji bersih) untuk satu karyawan tertentu berdasarkan nama. Gunakan untuk 'berapa gaji si X' atau 'rincian slip gaji Y'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Nama karyawan yang dicari data gajinya." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_top_performers",
      description: "Daftar karyawan dengan skor KPI/evaluasi kinerja tertinggi (karyawan terbaik), bisa difilter per departemen. Gunakan untuk pertanyaan seperti 'siapa karyawan terbaik', 'siapa yang berkinerja paling bagus', atau 'top performer di divisi X'.",
      parameters: {
        type: "object",
        properties: {
          department: { type: "string", description: "Nama departemen untuk membatasi hasil. Kosongkan untuk seluruh perusahaan." },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_department_headcount",
      description: "Jumlah karyawan aktif per departemen/divisi, dan total keseluruhan. Gunakan untuk pertanyaan seperti 'berapa jumlah karyawan' atau 'headcount tiap divisi'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_leaves",
      description: "Daftar pengajuan cuti/izin yang masih menunggu persetujuan (status Pending). Gunakan untuk 'siapa yang mengajukan cuti', 'ada berapa cuti pending'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_hr_metrics",
      description: "Metrik eksekutif Employee Relations: jumlah kasus terbuka/tertutup/lewat tenggat, turnover rate, engagement index, eNPS. Gunakan untuk pertanyaan tentang turnover, engagement, atau ringkasan kasus karyawan.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_approvals",
      description: "Ringkasan semua item yang menunggu persetujuan di seluruh modul: mutasi karir, promosi, permintaan karir lain, perbaikan aset GA, pemeliharaan infrastruktur GA, dan permintaan kompetensi. Gunakan untuk 'berapa approval yang pending' atau 'apa saja yang perlu saya setujui'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_today_attendance",
      description: "Ringkasan kehadiran hari ini: jumlah yang tercatat hadir dibanding total karyawan aktif. Gunakan untuk 'berapa yang masuk hari ini' atau 'siapa yang belum absen'.",
      parameters: { type: "object", properties: {} },
    },
  },
];

// Gemini fallback (see src/app/actions/hrd-copilot.ts) uses the same tools
// but Google's SDK wants its own SchemaType enum instead of plain JSON-schema
// type strings — derived here from HRD_COPILOT_TOOLS instead of hand-writing
// a second copy, so the two providers can never drift out of sync on what
// tools exist or what each one does.
export const HRD_COPILOT_TOOLS_GEMINI: FunctionDeclaration[] = HRD_COPILOT_TOOLS.map((t) => {
  const fn = t.function!; // every entry here is always {type:"function", function:{...}} — see literal array above
  return {
    name: fn.name,
    description: fn.description,
    parameters: {
      type: SchemaType.OBJECT,
      properties: Object.fromEntries(
        Object.entries((fn.parameters?.properties as Record<string, { type: string; description?: string }>) || {}).map(
          ([key, val]) => [key, { type: SchemaType.STRING, description: val.description }]
        )
      ),
    },
  };
});

// Caps how many raw rows get relayed back into the model's context for any
// list-shaped tool result — keeps token usage predictable regardless of how
// much data actually matched.
const LIST_CAP = 15;

function isPermissionError(err: unknown): boolean {
  const name = (err as { name?: string } | null)?.name;
  return name === "ForbiddenError" || name === "UnauthorizedError";
}

async function getDepartmentHeadcount() {
  const { data } = await supabaseAdmin
    .from("karyawan")
    .select("department")
    .neq("status", "Inactive");
  const rows = (data || []) as { department: string | null }[];
  const counts = new Map<string, number>();
  for (const r of rows) {
    const dept = r.department || "(Tanpa Departemen)";
    counts.set(dept, (counts.get(dept) || 0) + 1);
  }
  return {
    total_karyawan_aktif: rows.length,
    per_departemen: Array.from(counts.entries())
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export async function executeHrdCopilotTool(name: string, rawArgs: string): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? JSON.parse(rawArgs) : {};
  } catch {
    // Model sent malformed JSON args — treat as empty rather than crashing the turn.
  }

  try {
    switch (name) {
      case "list_hrd_modules": {
        // Static — no DB call, no role check needed. Lets the model answer
        // navigation/"what can this app do" questions without forcing a
        // data-tool call it has no good arguments for.
        return JSON.stringify({
          modules: MENU_GROUPS.map((g) => ({
            menu: g.label,
            sub_menu: g.items.map((i) => i.label),
          })),
        });
      }

      case "search_employees": {
        const query = typeof args.query === "string" ? args.query : "";
        const rows = await searchEmployees(query);
        return JSON.stringify(
          rows.slice(0, LIST_CAP).map((e) => ({
            nama: e.full_name, nik: e.nik, kode_jabatan: e.kode_jabatan,
            posisi: e.position, departemen: e.department, status: e.status,
          }))
        );
      }

      case "get_department_headcount": {
        return JSON.stringify(await getDepartmentHeadcount());
      }

      case "get_pending_leaves": {
        const rows = (await getLeaves({ status: "Pending" })) as Record<string, unknown>[];
        return JSON.stringify({
          total_pending: rows.length,
          daftar: rows.slice(0, LIST_CAP).map((r) => ({
            nama: r.employee_name, departemen: r.department, jenis: r.type,
            mulai: r.start_date, selesai: r.end_date,
          })),
        });
      }

      case "get_hr_metrics": {
        return JSON.stringify(await getRelationsExecutiveMetrics());
      }

      case "get_pending_approvals": {
        const erCategories = ["Complaint", "Investigation", "Corrective Action", "Industrial", "Separation", "Case Closure"] as const;
        const [assetReq, maintReq, mutations, promotions, careerReq, competencyReq] = await Promise.all([
          getAssetRepairRequests().catch(() => []),
          getMaintenanceRequests().catch(() => []),
          getMutations().catch(() => []),
          getPromotions().catch(() => []),
          getCareerRequests().catch(() => []),
          getCompetencyRequests("Pending").catch(() => []),
        ]);
        const countPending = (rows: unknown[], statusKey = "status", pendingValues = ["Diajukan", "Menunggu", "Pending"]) =>
          (rows as Record<string, unknown>[]).filter((r) => pendingValues.includes(String(r[statusKey]))).length;

        return JSON.stringify({
          perbaikan_aset_ga: countPending(assetReq),
          pemeliharaan_infrastruktur_ga: countPending(maintReq),
          mutasi_karir: countPending(mutations),
          promosi_karir: countPending(promotions),
          permintaan_karir_lain: countPending(careerReq),
          permintaan_kompetensi: (competencyReq as unknown[]).length,
          catatan: "Approval Employee Relations (komplain/investigasi/dll) perlu dicek terpisah per kategori jika diperlukan.",
          kategori_er_tersedia: erCategories,
        });
      }

      case "get_today_attendance": {
        const today = new Date().toISOString().slice(0, 10);
        const [attendanceRows, headcount] = await Promise.all([
          getAllAttendance({ date: today }),
          getDepartmentHeadcount(),
        ]);
        const present = (attendanceRows as unknown[]).length;
        return JSON.stringify({
          tanggal: today,
          hadir_tercatat: present,
          total_karyawan_aktif: headcount.total_karyawan_aktif,
          belum_tercatat: Math.max(0, headcount.total_karyawan_aktif - present),
        });
      }

      case "get_recruitment_overview": {
        const [postings, channels, slaFlags] = await Promise.all([
          getJobPostings(),
          getChannelEffectiveness(),
          getRecruitmentSLAStatus(),
        ]);
        const openPostings = (postings as Record<string, unknown>[]).filter((p: Record<string, unknown>) => p.status === "Open" || p.status === "Aktif");
        return JSON.stringify({
          total_lowongan: postings.length,
          lowongan_aktif: openPostings.length,
          per_kanal: channels.slice(0, LIST_CAP),
          lamaran_lewat_sla: slaFlags.length,
          contoh_lewat_sla: slaFlags.slice(0, 5).map((f) => ({ nama: f.fullName, tahap: f.stage, hari: f.daysInStage })),
        });
      }

      case "get_competency_overview": {
        const [skills, tna] = await Promise.all([getSkills(), getTNA()]);
        const categories = new Set((skills as Record<string, unknown>[]).map((s) => s.category));
        return JSON.stringify({
          total_kompetensi: skills.length,
          kategori: Array.from(categories),
          total_gap_terbuka: tna.filter((t) => t.status === "Open").length,
          gap_terbesar: tna.slice(0, 10).map((t) => ({
            karyawan: t.karyawan_nama, kompetensi: t.skill_nama, level_saat_ini: t.current_level, level_dibutuhkan: t.required_level, gap: t.gap,
          })),
        });
      }

      case "get_learning_overview": {
        const [trainings, certs] = await Promise.all([getTrainings(), getTrainingCertificates()]);
        return JSON.stringify({
          total_program_pelatihan: trainings.length,
          total_sertifikat_terbit: certs.length,
          pelatihan_terbaru: (trainings as Record<string, unknown>[]).slice(0, LIST_CAP).map((t) => ({
            judul: t.title || t.nama, tanggal_mulai: t.date_start, status: t.status, jumlah_peserta: t.enrollment_count,
          })),
        });
      }

      case "get_performance_overview": {
        const evals = (await getKpiEvaluationsWithJabatan()) as Record<string, unknown>[];
        const scored = evals.filter((e) => e.score != null);
        const avgScore = scored.length > 0 ? scored.reduce((sum, e) => sum + (Number(e.score) || 0), 0) / scored.length : null;
        return JSON.stringify({
          total_evaluasi: evals.length,
          rata_rata_skor: avgScore != null ? Math.round(avgScore * 10) / 10 : null,
          evaluasi_terbaru: evals.slice(0, LIST_CAP).map((e) => {
            const k = e.karyawan as { full_name?: string; department?: string } | undefined;
            return { nama: k?.full_name, departemen: k?.department, skor: e.score, skor_akhir: e.final_score };
          }),
        });
      }

      case "get_reward_overview": {
        const [awards, bonuses] = await Promise.all([getAwards(), getBonuses()]);
        return JSON.stringify({
          total_penghargaan: awards.length,
          total_bonus_insentif: bonuses.length,
          penghargaan_terbaru: awards.slice(0, 5).map((a) => ({ nama: a.employee_name, kategori: a.category, tanggal: a.award_date })),
        });
      }

      case "get_asset_fleet_overview": {
        const [{ data: vehicles }, assets] = await Promise.all([
          supabaseAdmin.from("kendaraan").select("status, stnk_expiry, kir_expiry, insurance_expiry"),
          getAssets() as unknown as Promise<Record<string, unknown>[]>,
        ]);
        const vRows = (vehicles || []) as { status: string; stnk_expiry: string | null; kir_expiry: string | null; insurance_expiry: string | null }[];
        const now = Date.now();
        let expiringDocs = 0;
        for (const v of vRows) {
          for (const d of [v.stnk_expiry, v.kir_expiry, v.insurance_expiry]) {
            if (!d) continue;
            const days = Math.floor((new Date(d).getTime() - now) / 86_400_000);
            if (days <= 30) expiringDocs++;
          }
        }
        const vehicleStatusCounts = new Map<string, number>();
        for (const v of vRows) vehicleStatusCounts.set(v.status, (vehicleStatusCounts.get(v.status) || 0) + 1);
        const assetConditionCounts = new Map<string, number>();
        for (const a of assets) {
          const kondisi = String(a.kondisi || "Tidak diketahui");
          assetConditionCounts.set(kondisi, (assetConditionCounts.get(kondisi) || 0) + 1);
        }
        return JSON.stringify({
          total_kendaraan: vRows.length,
          kendaraan_per_status: Object.fromEntries(vehicleStatusCounts),
          dokumen_kendaraan_akan_kedaluwarsa_30hari: expiringDocs,
          total_aset_perusahaan: assets.length,
          aset_per_kondisi: Object.fromEntries(assetConditionCounts),
        });
      }

      case "search_jabatan": {
        const query = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
        const rows = await getMasterJabatan();
        const filtered = query
          ? rows.filter((j) =>
              j.name.toLowerCase().includes(query) ||
              j.department.toLowerCase().includes(query) ||
              j.code.toLowerCase().includes(query)
            )
          : rows;
        return JSON.stringify(
          filtered.slice(0, LIST_CAP).map((j) => ({
            kode: j.code, nama: j.name, departemen: j.department, level: j.level,
            grade: j.grade_name, kepala_unit: j.is_kepala_unit, status: j.status,
          }))
        );
      }

      case "get_jobdesc": {
        const position = typeof args.position === "string" ? args.position.trim() : "";
        if (!position) return JSON.stringify({ error: "Nama jabatan tidak diberikan." });
        const rows = await getJobDescsForPosition(position);
        if (rows.length === 0) {
          // Position name might not match exactly — fall back to a
          // substring search across all job descriptions so a slightly
          // different phrasing (e.g. missing "Divisi") still finds it.
          const all = await getJobDescs();
          const loose = all.filter((d) => d.position.toLowerCase().includes(position.toLowerCase()));
          if (loose.length === 0) return JSON.stringify({ error: `Deskripsi kerja untuk jabatan "${position}" tidak ditemukan.` });
          return JSON.stringify(loose.slice(0, 5).map((d) => ({
            jabatan: d.position, departemen: d.department, tanggung_jawab: d.responsibilities, persyaratan: d.requirements,
          })));
        }
        return JSON.stringify(rows.map((d) => ({
          jabatan: d.position, departemen: d.department, tanggung_jawab: d.responsibilities, persyaratan: d.requirements,
        })));
      }

      case "get_org_overview": {
        const [departments, formasi] = await Promise.all([getDepartments(), getFormasiList()]);
        const vacant = formasi.filter((f) => f.status === "Vacant").length;
        return JSON.stringify({
          total_departemen_unit: departments.length,
          total_formasi_jabatan: formasi.length,
          formasi_kosong: vacant,
          formasi_terisi: formasi.length - vacant,
        });
      }

      case "get_payroll_overview": {
        await requireRole("hrd", "superadmin", "director", "department_manager");
        const now = new Date();
        const { data } = await supabaseAdmin
          .from("penggajian")
          .select("net_salary, karyawan!inner(department)")
          .eq("month", now.getMonth() + 1)
          .eq("year", now.getFullYear())
          .limit(500);
        const rows = (data || []) as unknown as { net_salary: number; karyawan: { department: string | null } | { department: string | null }[] | null }[];
        if (rows.length === 0) return JSON.stringify({ error: "Belum ada data penggajian bulan ini." });
        const byDept = new Map<string, number[]>();
        for (const r of rows) {
          const karyawan = Array.isArray(r.karyawan) ? r.karyawan[0] : r.karyawan;
          const dept = karyawan?.department || "(Tanpa Departemen)";
          if (!byDept.has(dept)) byDept.set(dept, []);
          byDept.get(dept)!.push(Number(r.net_salary) || 0);
        }
        const perDepartemen = Array.from(byDept.entries()).map(([department, salaries]) => ({
          department,
          jumlah_karyawan: salaries.length,
          rata_rata_gaji_bersih: Math.round(salaries.reduce((s, v) => s + v, 0) / salaries.length),
        })).sort((a, b) => b.rata_rata_gaji_bersih - a.rata_rata_gaji_bersih);
        const allSalaries = rows.map((r) => Number(r.net_salary) || 0);
        return JSON.stringify({
          total_karyawan_tercakup: rows.length,
          total_payroll_bulan_ini: allSalaries.reduce((s, v) => s + v, 0),
          gaji_bersih_tertinggi: Math.max(...allSalaries),
          gaji_bersih_terendah: Math.min(...allSalaries),
          per_departemen: perDepartemen,
        });
      }

      case "search_payroll": {
        await requireRole("hrd", "superadmin", "director", "department_manager");
        const query = typeof args.query === "string" ? args.query.trim() : "";
        if (!query) return JSON.stringify({ error: "Nama karyawan tidak diberikan." });
        const matches = await searchEmployees(query);
        if (matches.length === 0) return JSON.stringify({ error: `Karyawan "${query}" tidak ditemukan.` });
        const ids = matches.slice(0, 5).map((m) => m.id);
        const { data } = await supabaseAdmin
          .from("penggajian")
          .select("employee_id, month, year, basic_salary, allowances, deductions, net_salary, status")
          .in("employee_id", ids)
          .order("year", { ascending: false })
          .order("month", { ascending: false });
        const rows = (data || []) as { employee_id: string; month: number; year: number; basic_salary: number; allowances: number; deductions: number; net_salary: number; status: string }[];
        const nameById = new Map(matches.map((m) => [m.id, m.full_name]));
        if (rows.length === 0) return JSON.stringify({ error: `Belum ada data penggajian untuk "${query}".` });
        return JSON.stringify(
          rows.slice(0, LIST_CAP).map((r) => ({
            nama: nameById.get(r.employee_id), periode: `${r.month}/${r.year}`,
            gaji_pokok: r.basic_salary, tunjangan: r.allowances, potongan: r.deductions,
            gaji_bersih: r.net_salary, status: r.status,
          }))
        );
      }

      case "get_top_performers": {
        const department = typeof args.department === "string" ? args.department.trim() : "";
        const { data: kpiRows } = await supabaseAdmin
          .from("evaluasi_kpi")
          .select("employee_id, final_score, period")
          .not("final_score", "is", null)
          .order("final_score", { ascending: false })
          .limit(200);
        const rows = (kpiRows || []) as { employee_id: string; final_score: number; period: string }[];
        if (rows.length === 0) return JSON.stringify({ error: "Belum ada data evaluasi KPI." });
        const empIds = rows.map((r) => r.employee_id);
        const { data: empRows } = await supabaseAdmin.from("karyawan").select("id, full_name, department, position").in("id", empIds);
        const empById = new Map(((empRows || []) as { id: string; full_name: string; department: string; position: string }[]).map((e) => [e.id, e]));
        let ranked = rows
          .map((r) => ({ ...r, emp: empById.get(r.employee_id) }))
          .filter((r) => r.emp);
        if (department) {
          const q = department.toLowerCase();
          ranked = ranked.filter((r) => r.emp!.department.toLowerCase().includes(q));
        }
        return JSON.stringify(
          ranked.slice(0, LIST_CAP).map((r) => ({
            nama: r.emp!.full_name, posisi: r.emp!.position, departemen: r.emp!.department,
            skor_kpi: r.final_score, periode: r.period,
          }))
        );
      }

      default:
        return JSON.stringify({ error: `Tool tidak dikenal: ${name}` });
    }
  } catch (err) {
    if (isPermissionError(err)) {
      return JSON.stringify({ error: "Anda tidak memiliki akses ke data ini sesuai role Anda saat ini." });
    }
    console.error(`[hrd-copilot] tool "${name}" error:`, (err as Error)?.message || err);
    return JSON.stringify({ error: "Gagal mengambil data — coba lagi atau tanyakan hal lain." });
  }
}
