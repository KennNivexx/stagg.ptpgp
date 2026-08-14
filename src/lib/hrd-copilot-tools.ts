import type Groq from "groq-sdk";
import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-guard";
import { searchEmployees } from "@/app/actions/employee";
import { getLeaves } from "@/app/actions/leaves";
import { getLembur, getKoreksiAbsensi } from "@/app/actions/workforce-time";
import { getHiringApprovalStatus, generateOfferLetter } from "@/app/actions/recruitment-hiring";
import { getFinancialSummary } from "@/app/actions/pengiriman";
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
      name: "get_financial_summary",
      description: "Ringkasan keuangan perusahaan: total OMSET (pendapatan dari pengiriman/proyek), total BIAYA operasional (payroll, insentif supir, perjalanan dinas), dan LABA/RUGI bersih untuk satu periode bulan. Gunakan untuk pertanyaan seperti 'berapa omset/pendapatan bulan ini', 'untung atau rugi bulan ini', 'berapa laba perusahaan'. Ini BEDA dari get_payroll_overview (yang hanya soal gaji karyawan) — gunakan tool ini untuk pertanyaan soal omset/laba/rugi perusahaan secara keseluruhan.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "Bulan, angka 1-12. Kosongkan untuk bulan berjalan." },
          year: { type: "string", description: "Tahun, mis. '2026'. Kosongkan untuk tahun berjalan." },
        },
      },
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
      name: "get_pending_overtime",
      description: "Daftar pengajuan LEMBUR yang masih menunggu persetujuan (status Pending) — hanya MELAPORKAN, tidak mengubah apa pun. Gunakan untuk pertanyaan seperti 'ada lembur yang pending?', 'siapa yang lembur belum di-approve'. JANGAN gunakan decide_overtime_request untuk pertanyaan semacam ini — tool itu khusus untuk MEMUTUSKAN satu pengajuan spesifik yang sudah disebutkan namanya.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_pending_absence_corrections",
      description: "Daftar pengajuan KOREKSI ABSENSI yang masih menunggu persetujuan (status Pending) — hanya MELAPORKAN, tidak mengubah apa pun. Gunakan untuk pertanyaan seperti 'ada koreksi absensi yang pending?', 'siapa yang butuh koreksi absen'. JANGAN gunakan decide_absence_correction untuk pertanyaan semacam ini — tool itu khusus untuk MEMUTUSKAN satu pengajuan spesifik yang sudah disebutkan namanya.",
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

  // ── Write-capable tools ──────────────────────────────────────────────
  // Every tool below only ever PROPOSES an action (returns a JSON payload
  // describing exactly what would happen, never mutates anything itself).
  // The actual mutation happens in a separate, non-LLM-reachable code path
  // (src/lib/hrd-copilot-actions.ts) only after the user explicitly
  // confirms — see src/app/actions/hrd-copilot.ts for the confirm flow.
  {
    type: "function",
    function: {
      name: "decide_leave_request",
      description: "Menyetujui atau menolak pengajuan Cuti/Izin SATU karyawan yang NAMANYA sudah disebutkan pengguna, yang masih Pending. Ini akan MENGUSULKAN tindakan — pengguna harus mengonfirmasi dulu sebelum benar-benar dieksekusi. Gunakan HANYA saat pengguna eksplisit menyebut nama karyawan, mis. 'approve cuti budi', 'tolak izin si ani'. JANGAN gunakan untuk pertanyaan umum seperti 'ada cuti pending nggak' — pakai get_pending_leaves untuk itu, dan JANGAN mengarang/menebak nama karyawan.",
      parameters: {
        type: "object",
        properties: {
          employee_name: { type: "string", description: "Nama karyawan yang pengajuan cutinya ingin diputuskan." },
          decision: { type: "string", description: "Keputusan: 'Disetujui' atau 'Ditolak'." },
        },
        required: ["employee_name", "decision"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "decide_overtime_request",
      description: "Menyetujui atau menolak pengajuan Lembur SATU karyawan yang NAMANYA sudah disebutkan pengguna, yang masih Pending. MENGUSULKAN tindakan, butuh konfirmasi pengguna sebelum benar-benar dieksekusi. Gunakan HANYA saat pengguna eksplisit menyebut nama karyawan. JANGAN gunakan untuk pertanyaan umum seperti 'ada lembur pending nggak' — pakai get_pending_overtime untuk itu, dan JANGAN mengarang/menebak nama karyawan.",
      parameters: {
        type: "object",
        properties: {
          employee_name: { type: "string", description: "Nama karyawan yang pengajuan lemburnya ingin diputuskan." },
          decision: { type: "string", description: "Keputusan: 'Disetujui' atau 'Ditolak'." },
        },
        required: ["employee_name", "decision"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "decide_absence_correction",
      description: "Menyetujui atau menolak pengajuan Koreksi Absensi SATU karyawan yang NAMANYA sudah disebutkan pengguna, yang masih Pending. MENGUSULKAN tindakan, butuh konfirmasi pengguna sebelum benar-benar dieksekusi. Gunakan HANYA saat pengguna eksplisit menyebut nama karyawan. JANGAN gunakan untuk pertanyaan umum seperti 'ada koreksi absensi pending nggak' — pakai get_pending_absence_corrections untuk itu, dan JANGAN mengarang/menebak nama karyawan.",
      parameters: {
        type: "object",
        properties: {
          employee_name: { type: "string", description: "Nama karyawan yang pengajuan koreksi absensinya ingin diputuskan." },
          decision: { type: "string", description: "Keputusan: 'Disetujui' atau 'Ditolak'." },
        },
        required: ["employee_name", "decision"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_payslip",
      description: "Membuat slip gaji (payroll) untuk satu karyawan pada periode tertentu. MENGUSULKAN tindakan, butuh konfirmasi pengguna sebelum benar-benar dieksekusi.",
      parameters: {
        type: "object",
        properties: {
          employee_name: { type: "string", description: "Nama karyawan yang slip gajinya ingin dibuat." },
          month: { type: "string", description: "Bulan periode payroll, angka 1-12." },
          year: { type: "string", description: "Tahun periode payroll, mis. '2026'." },
        },
        required: ["employee_name", "month", "year"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_payroll_batch",
      description: "Membuat payroll untuk SELURUH karyawan aktif pada periode tertentu sekaligus (batch). MENGUSULKAN tindakan, butuh konfirmasi pengguna sebelum benar-benar dieksekusi.",
      parameters: {
        type: "object",
        properties: {
          month: { type: "string", description: "Bulan periode payroll, angka 1-12." },
          year: { type: "string", description: "Tahun periode payroll, mis. '2026'." },
        },
        required: ["month", "year"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "decide_payroll_status",
      description: "Mengubah status verifikasi/persetujuan payroll (Draft→Verified_SDM→Verified_Keuangan→Approved→Paid), untuk satu karyawan atau batch satu periode. MENGUSULKAN tindakan, butuh konfirmasi pengguna sebelum benar-benar dieksekusi. Status hanya bisa naik satu langkah berurutan — jika target salah, akan diberi tahu status yang benar.",
      parameters: {
        type: "object",
        properties: {
          scope: { type: "string", description: "'single' untuk satu karyawan, atau 'batch' untuk satu periode penuh." },
          employee_name: { type: "string", description: "Nama karyawan (wajib jika scope='single')." },
          month: { type: "string", description: "Bulan periode, angka 1-12 (opsional untuk single, wajib untuk batch)." },
          year: { type: "string", description: "Tahun periode (opsional untuk single, wajib untuk batch)." },
          target_status: { type: "string", description: "Status tujuan: 'Verified_SDM', 'Verified_Keuangan', 'Approved', atau 'Paid'." },
          payment_method: { type: "string", description: "Metode pembayaran, wajib diisi jika target_status='Paid' (mis. 'Transfer Bank')." },
        },
        required: ["scope", "target_status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "decide_hiring_step",
      description: "Menyetujui atau menolak satu tahap approval hiring (rekrutmen) untuk seorang kandidat/pelamar. MENGUSULKAN tindakan, butuh konfirmasi pengguna sebelum benar-benar dieksekusi. Jika menolak, alasan (notes) wajib diisi.",
      parameters: {
        type: "object",
        properties: {
          candidate_name: { type: "string", description: "Nama kandidat/pelamar." },
          decision: { type: "string", description: "Keputusan: 'Approved' atau 'Rejected'." },
          notes: { type: "string", description: "Catatan/alasan, wajib diisi jika decision='Rejected'." },
        },
        required: ["candidate_name", "decision"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_offer_letter",
      description: "Mengirim offer letter (surat penawaran kerja) ke seorang kandidat/pelamar yang sudah memiliki gaji ditawarkan. MENGUSULKAN tindakan, butuh konfirmasi pengguna sebelum benar-benar dieksekusi.",
      parameters: {
        type: "object",
        properties: {
          candidate_name: { type: "string", description: "Nama kandidat/pelamar yang akan dikirim offer letter." },
        },
        required: ["candidate_name"],
      },
    },
  },
];

/** Tool names whose result the model NEVER paraphrases — see the
 * short-circuit logic in src/app/actions/hrd-copilot.ts, which returns the
 * proposal/error `message`/`summary` field directly as the reply the
 * instant one of these is called, skipping any further LLM round. */
export const WRITE_TOOL_NAMES = new Set([
  "decide_leave_request",
  "decide_overtime_request",
  "decide_absence_correction",
  "generate_payslip",
  "generate_payroll_batch",
  "decide_payroll_status",
  "decide_hiring_step",
  "send_offer_letter",
]);

export type ToolProposalResult =
  | { status: "AWAITING_USER_CONFIRMATION"; summary: string; toolName: string; args: Record<string, string> }
  | { status: "NEEDS_DISAMBIGUATION"; message: string; options: string[] }
  | { status: "NEEDS_INFO"; message: string }
  | { status: "NOT_ALLOWED"; message: string }
  | { status: "ERROR"; message: string };

// Some roles askHrdCopilot() lets into the chat at all (hrd/superadmin/
// director/department_manager) are NOT allowed by the underlying write
// action for certain tools (e.g. updateLeaveStatus explicitly excludes hrd
// and director). Filtering those tools out of the list offered to the model
// avoids ever proposing something guaranteed to fail — the real action's own
// role check stays authoritative regardless, this is purely a UX/round-trip
// optimization, not a substitute for it.
const ROLE_EXCLUDED_WRITE_TOOLS: Record<string, string[]> = {
  hrd: ["decide_leave_request"],
  director: ["decide_leave_request", "decide_overtime_request", "decide_absence_correction"],
};

export function toolsForRole(role: string): Groq.Chat.Completions.ChatCompletionTool[] {
  const excluded = new Set(ROLE_EXCLUDED_WRITE_TOOLS[role] || []);
  return HRD_COPILOT_TOOLS.filter((t) => !excluded.has(t.function!.name));
}

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

export function toolsForRoleGemini(role: string): FunctionDeclaration[] {
  const excluded = new Set(ROLE_EXCLUDED_WRITE_TOOLS[role] || []);
  return HRD_COPILOT_TOOLS_GEMINI.filter((t) => !excluded.has(t.name));
}

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

async function proposeLeaveDecision(args: Record<string, unknown>): Promise<ToolProposalResult> {
  const name = typeof args.employee_name === "string" ? args.employee_name.trim() : "";
  const decisionRaw = typeof args.decision === "string" ? args.decision.trim() : "";
  const decision = decisionRaw === "Disetujui" || decisionRaw === "Ditolak" ? decisionRaw : null;
  if (!name) return { status: "NEEDS_INFO", message: "Sebutkan nama karyawan yang pengajuan Cuti/Izinnya ingin diputuskan." };
  if (!decision) return { status: "NEEDS_INFO", message: "Sebutkan keputusannya: disetujui atau ditolak." };

  const rows = (await getLeaves({})) as Record<string, unknown>[];
  const q = name.toLowerCase();
  const matches = rows.filter((r) => r.status === "Pending" && String(r.employee_name || "").toLowerCase().includes(q));
  if (matches.length === 0) return { status: "ERROR", message: `Tidak ditemukan pengajuan Cuti/Izin berstatus Pending atas nama "${name}".` };
  if (matches.length > 1) {
    return {
      status: "NEEDS_DISAMBIGUATION",
      message: `Ada ${matches.length} pengajuan Cuti/Izin Pending atas nama "${name}". Sebutkan lebih spesifik (jenis atau tanggal):`,
      options: matches.slice(0, 5).map((r) => `${r.type} — ${r.start_date} s/d ${r.end_date}`),
    };
  }
  const m = matches[0];
  return {
    status: "AWAITING_USER_CONFIRMATION",
    summary: `🔔 Konfirmasi: ${decision === "Disetujui" ? "Menyetujui" : "Menolak"} ${m.type} atas nama ${m.employee_name}, ${m.start_date} s/d ${m.end_date}. Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
    toolName: "decide_leave_request",
    args: { id: String(m.id), status: decision, description: `${decision === "Disetujui" ? "Menyetujui" : "Menolak"} ${m.type} atas nama ${m.employee_name}, ${m.start_date} s/d ${m.end_date}` },
  };
}

async function proposeOvertimeDecision(args: Record<string, unknown>): Promise<ToolProposalResult> {
  const name = typeof args.employee_name === "string" ? args.employee_name.trim() : "";
  const decisionRaw = typeof args.decision === "string" ? args.decision.trim() : "";
  const decision = decisionRaw === "Disetujui" || decisionRaw === "Ditolak" ? decisionRaw : null;
  if (!name) return { status: "NEEDS_INFO", message: "Sebutkan nama karyawan yang pengajuan lemburnya ingin diputuskan." };
  if (!decision) return { status: "NEEDS_INFO", message: "Sebutkan keputusannya: disetujui atau ditolak." };

  const rows = (await getLembur()) as Record<string, unknown>[];
  const q = name.toLowerCase();
  const matches = rows.filter((r) => r.status === "Pending" && String(r.karyawan_nama || "").toLowerCase().includes(q));
  if (matches.length === 0) return { status: "ERROR", message: `Tidak ditemukan pengajuan Lembur berstatus Pending atas nama "${name}".` };
  if (matches.length > 1) {
    return {
      status: "NEEDS_DISAMBIGUATION",
      message: `Ada ${matches.length} pengajuan Lembur Pending atas nama "${name}". Sebutkan tanggalnya:`,
      options: matches.slice(0, 5).map((r) => `${r.tanggal} (${r.jam_mulai || "—"}–${r.jam_selesai || "—"})`),
    };
  }
  const m = matches[0];
  return {
    status: "AWAITING_USER_CONFIRMATION",
    summary: `🔔 Konfirmasi: ${decision === "Disetujui" ? "Menyetujui" : "Menolak"} lembur ${m.karyawan_nama} tanggal ${m.tanggal}. Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
    toolName: "decide_overtime_request",
    args: { id: String(m.id), approve: decision === "Disetujui" ? "true" : "false", description: `${decision === "Disetujui" ? "Menyetujui" : "Menolak"} lembur ${m.karyawan_nama} tanggal ${m.tanggal}` },
  };
}

async function proposeAbsenceCorrectionDecision(args: Record<string, unknown>): Promise<ToolProposalResult> {
  const name = typeof args.employee_name === "string" ? args.employee_name.trim() : "";
  const decisionRaw = typeof args.decision === "string" ? args.decision.trim() : "";
  const decision = decisionRaw === "Disetujui" || decisionRaw === "Ditolak" ? decisionRaw : null;
  if (!name) return { status: "NEEDS_INFO", message: "Sebutkan nama karyawan yang pengajuan koreksi absensinya ingin diputuskan." };
  if (!decision) return { status: "NEEDS_INFO", message: "Sebutkan keputusannya: disetujui atau ditolak." };

  const rows = (await getKoreksiAbsensi()) as Record<string, unknown>[];
  const q = name.toLowerCase();
  const matches = rows.filter((r) => r.status === "Pending" && String(r.karyawan_nama || "").toLowerCase().includes(q));
  if (matches.length === 0) return { status: "ERROR", message: `Tidak ditemukan pengajuan Koreksi Absensi berstatus Pending atas nama "${name}".` };
  if (matches.length > 1) {
    return {
      status: "NEEDS_DISAMBIGUATION",
      message: `Ada ${matches.length} pengajuan Koreksi Absensi Pending atas nama "${name}". Sebutkan jenis/tanggalnya:`,
      options: matches.slice(0, 5).map((r) => `${r.jenis_koreksi} — ${r.tanggal}`),
    };
  }
  const m = matches[0];
  return {
    status: "AWAITING_USER_CONFIRMATION",
    summary: `🔔 Konfirmasi: ${decision === "Disetujui" ? "Menyetujui" : "Menolak"} koreksi absensi (${m.jenis_koreksi}) ${m.karyawan_nama} tanggal ${m.tanggal}. Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
    toolName: "decide_absence_correction",
    args: { id: String(m.id), approve: decision === "Disetujui" ? "true" : "false", description: `${decision === "Disetujui" ? "Menyetujui" : "Menolak"} koreksi absensi (${m.jenis_koreksi}) ${m.karyawan_nama} tanggal ${m.tanggal}` },
  };
}

async function proposeGeneratePayslip(args: Record<string, unknown>): Promise<ToolProposalResult> {
  const name = typeof args.employee_name === "string" ? args.employee_name.trim() : "";
  const month = typeof args.month === "string" ? args.month.trim() : "";
  const year = typeof args.year === "string" ? args.year.trim() : "";
  if (!name) return { status: "NEEDS_INFO", message: "Sebutkan nama karyawan yang slip gajinya ingin dibuat." };
  if (!month || !year) return { status: "NEEDS_INFO", message: "Sebutkan bulan dan tahun periode payroll." };

  const matches = await searchEmployees(name);
  if (matches.length === 0) return { status: "ERROR", message: `Karyawan "${name}" tidak ditemukan.` };
  if (matches.length > 1) {
    return {
      status: "NEEDS_DISAMBIGUATION",
      message: `Ada ${matches.length} karyawan dengan nama "${name}". Sebutkan lebih spesifik:`,
      options: matches.slice(0, 5).map((m) => `${m.full_name} — ${m.department}`),
    };
  }
  const emp = matches[0];
  return {
    status: "AWAITING_USER_CONFIRMATION",
    summary: `🔔 Konfirmasi: Generate slip gaji untuk ${emp.full_name}, periode ${month}/${year}. Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
    toolName: "generate_payslip",
    args: { employee_id: emp.id, month, year, description: `Generate slip gaji untuk ${emp.full_name}, periode ${month}/${year}` },
  };
}

async function proposeGeneratePayrollBatch(args: Record<string, unknown>): Promise<ToolProposalResult> {
  const month = typeof args.month === "string" ? args.month.trim() : "";
  const year = typeof args.year === "string" ? args.year.trim() : "";
  if (!month || !year) return { status: "NEEDS_INFO", message: "Sebutkan bulan dan tahun periode payroll untuk proses batch." };
  return {
    status: "AWAITING_USER_CONFIRMATION",
    summary: `🔔 Konfirmasi: Generate payroll untuk SELURUH karyawan aktif (Tetap/Kontrak/Magang) periode ${month}/${year}. Karyawan yang sudah punya slip akan dilewati otomatis. Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
    toolName: "generate_payroll_batch",
    args: { month, year, description: `Generate payroll seluruh karyawan aktif periode ${month}/${year}` },
  };
}

// Mirrors admin.ts's PAYROLL_TRANSITIONS map. Duplicated rather than
// imported because admin.ts is a "use server" file — every export from one
// must be an async function, so a plain constant can't be shared directly.
// This copy is only used to shape a nicer proposal/error message; the real,
// authoritative gate is still enforced inside updatePayrollStatus /
// assertPayrollTransitionAllowed when the confirmed action actually runs.
const PAYROLL_STATUS_VALUES = ["Draft", "Verified_SDM", "Verified_Keuangan", "Approved", "Paid"] as const;
type PayrollStatusLocal = (typeof PAYROLL_STATUS_VALUES)[number];
const PAYROLL_TRANSITIONS_LOCAL: Record<PayrollStatusLocal, PayrollStatusLocal | null> = {
  Draft: "Verified_SDM", Verified_SDM: "Verified_Keuangan", Verified_Keuangan: "Approved", Approved: "Paid", Paid: null,
};

async function proposePayrollStatusDecision(args: Record<string, unknown>): Promise<ToolProposalResult> {
  const scope = args.scope === "batch" ? "batch" : "single";
  const targetRaw = typeof args.target_status === "string" ? args.target_status.trim() : "";
  const target = (PAYROLL_STATUS_VALUES as readonly string[]).includes(targetRaw) && targetRaw !== "Draft" ? (targetRaw as PayrollStatusLocal) : null;
  if (!target) {
    return { status: "NEEDS_INFO", message: "Sebutkan status tujuan yang valid: Verified_SDM, Verified_Keuangan, Approved, atau Paid." };
  }
  const payment_method = typeof args.payment_method === "string" ? args.payment_method.trim() : "";
  if (target === "Paid" && !payment_method) {
    return { status: "NEEDS_INFO", message: "Untuk menandai payroll sebagai Paid, sebutkan dulu metode pembayarannya (mis. Transfer Bank)." };
  }
  const transfer_date = typeof args.transfer_date === "string" ? args.transfer_date.trim() : "";
  const payment_reference = typeof args.payment_reference === "string" ? args.payment_reference.trim() : "";
  const payment_notes = typeof args.payment_notes === "string" ? args.payment_notes.trim() : "";

  if (scope === "batch") {
    const month = typeof args.month === "string" ? args.month.trim() : "";
    const year = typeof args.year === "string" ? args.year.trim() : "";
    if (!month || !year) return { status: "NEEDS_INFO", message: "Sebutkan bulan dan tahun periode payroll untuk proses batch." };
    return {
      status: "AWAITING_USER_CONFIRMATION",
      summary: `🔔 Konfirmasi: Ubah status seluruh payroll periode ${month}/${year} yang eligible menjadi "${target}". Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
      toolName: "decide_payroll_status",
      args: { scope: "batch", month, year, target_status: target, payment_method, transfer_date, payment_reference, payment_notes, description: `Ubah status payroll periode ${month}/${year} menjadi "${target}"` },
    };
  }

  const name = typeof args.employee_name === "string" ? args.employee_name.trim() : "";
  if (!name) return { status: "NEEDS_INFO", message: "Sebutkan nama karyawan yang payroll-nya ingin diproses." };
  const matches = await searchEmployees(name);
  if (matches.length === 0) return { status: "ERROR", message: `Karyawan "${name}" tidak ditemukan.` };
  if (matches.length > 1) {
    return {
      status: "NEEDS_DISAMBIGUATION",
      message: `Ada ${matches.length} karyawan dengan nama "${name}". Sebutkan lebih spesifik:`,
      options: matches.slice(0, 5).map((m) => `${m.full_name} — ${m.department}`),
    };
  }
  const emp = matches[0];
  const month = typeof args.month === "string" ? args.month.trim() : "";
  const year = typeof args.year === "string" ? args.year.trim() : "";
  let q = supabaseAdmin.from("penggajian").select("id, month, year, status").eq("employee_id", emp.id)
    .order("year", { ascending: false }).order("month", { ascending: false });
  if (month) q = q.eq("month", Number(month));
  if (year) q = q.eq("year", Number(year));
  const { data: payrollRows } = await q.limit(5);
  const rows = (payrollRows || []) as { id: string; month: number; year: number; status: string }[];
  if (rows.length === 0) return { status: "ERROR", message: `Belum ada data payroll untuk ${emp.full_name}${month && year ? ` periode ${month}/${year}` : ""}.` };
  const row = rows[0];
  if (row.status === target) return { status: "ERROR", message: `Payroll ${emp.full_name} periode ${row.month}/${row.year} sudah berstatus "${target}".` };
  const expectedTarget = PAYROLL_TRANSITIONS_LOCAL[row.status as PayrollStatusLocal];
  if (expectedTarget !== target) {
    return { status: "ERROR", message: `Status payroll ${emp.full_name} periode ${row.month}/${row.year} saat ini "${row.status}". Langkah berikutnya yang valid adalah "${expectedTarget || "(tidak ada, sudah final)"}", bukan "${target}".` };
  }
  return {
    status: "AWAITING_USER_CONFIRMATION",
    summary: `🔔 Konfirmasi: Ubah status payroll ${emp.full_name} periode ${row.month}/${row.year} dari "${row.status}" menjadi "${target}". Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
    toolName: "decide_payroll_status",
    args: { scope: "single", id: row.id, target_status: target, payment_method, transfer_date, payment_reference, payment_notes, description: `Ubah status payroll ${emp.full_name} periode ${row.month}/${row.year} menjadi "${target}"` },
  };
}

async function findPelamarByName(name: string): Promise<{ id: string; full_name: string; email: string }[]> {
  const { data } = await supabaseAdmin.from("pelamar").select("id, full_name, email").ilike("full_name", `%${name}%`).limit(10);
  return (data || []) as { id: string; full_name: string; email: string }[];
}

// Mirrors recruitment-hiring.ts's ROLE_FOR_APPROVER map — same "can't export
// a plain constant from a 'use server' file" constraint as the payroll map
// above. Only used to shape a helpful NOT_ALLOWED message before proposing;
// decideHiringApprovalStep's own check is still the real gate at execution.
const HIRING_APPROVER_ROLE_ALLOWED: Record<string, string[]> = {
  HR: ["hrd", "superadmin"],
  "Department Head": ["department_manager", "hrd", "superadmin"],
  Finance: ["hrd", "director", "superadmin"],
  Director: ["director", "superadmin"],
};

async function proposeHiringDecision(args: Record<string, unknown>): Promise<ToolProposalResult> {
  const user = await requireRole("hrd", "superadmin", "director", "department_manager");
  const name = typeof args.candidate_name === "string" ? args.candidate_name.trim() : "";
  const decisionRaw = typeof args.decision === "string" ? args.decision.trim() : "";
  const decision = decisionRaw === "Approved" || decisionRaw === "Rejected" ? decisionRaw : null;
  const notes = typeof args.notes === "string" ? args.notes.trim() : "";
  if (!name) return { status: "NEEDS_INFO", message: "Sebutkan nama kandidat/pelamar." };
  if (!decision) return { status: "NEEDS_INFO", message: "Sebutkan keputusannya: Approved (setuju) atau Rejected (tolak)." };
  if (decision === "Rejected" && !notes) return { status: "NEEDS_INFO", message: "Alasan penolakan wajib diisi untuk menolak tahap ini." };

  const candidates = await findPelamarByName(name);
  if (candidates.length === 0) return { status: "ERROR", message: `Pelamar "${name}" tidak ditemukan.` };
  if (candidates.length > 1) {
    return {
      status: "NEEDS_DISAMBIGUATION",
      message: `Ada ${candidates.length} pelamar dengan nama "${name}". Sebutkan lebih spesifik (email):`,
      options: candidates.slice(0, 5).map((c) => `${c.full_name} — ${c.email}`),
    };
  }
  const candidate = candidates[0];

  const steps = (await getHiringApprovalStatus(candidate.id)) as { step_number: number; approver_role: string; status: string }[];
  const pending = steps.filter((s) => s.status === "Pending").sort((a, b) => a.step_number - b.step_number)[0];
  if (!pending) return { status: "ERROR", message: `Tidak ada tahap approval hiring yang Pending untuk ${candidate.full_name}.` };

  const allowed = HIRING_APPROVER_ROLE_ALLOWED[pending.approver_role] || ["hrd", "superadmin"];
  if (!allowed.includes(user.role)) {
    return { status: "NOT_ALLOWED", message: `Tahap ini (langkah ${pending.step_number}, approver: ${pending.approver_role}) bukan wewenang Anda.` };
  }

  const isLastStep = pending.step_number === Math.max(...steps.map((s) => s.step_number));
  const lastStepWarning = isLastStep && decision === "Approved"
    ? " CATATAN: ini adalah tahap approval TERAKHIR — menyetujui akan otomatis membuat data karyawan baru dari kandidat ini."
    : "";
  return {
    status: "AWAITING_USER_CONFIRMATION",
    summary: `🔔 Konfirmasi: ${decision === "Approved" ? "Menyetujui" : "Menolak"} tahap ${pending.step_number} (${pending.approver_role}) untuk kandidat ${candidate.full_name}.${lastStepWarning} Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
    toolName: "decide_hiring_step",
    args: { application_id: candidate.id, step_number: String(pending.step_number), decision, notes, description: `${decision === "Approved" ? "Menyetujui" : "Menolak"} tahap ${pending.step_number} (${pending.approver_role}) untuk kandidat ${candidate.full_name}` },
  };
}

async function proposeSendOfferLetter(args: Record<string, unknown>): Promise<ToolProposalResult> {
  const name = typeof args.candidate_name === "string" ? args.candidate_name.trim() : "";
  if (!name) return { status: "NEEDS_INFO", message: "Sebutkan nama kandidat yang akan dikirim offer letter." };

  const candidates = await findPelamarByName(name);
  if (candidates.length === 0) return { status: "ERROR", message: `Pelamar "${name}" tidak ditemukan.` };
  if (candidates.length > 1) {
    return {
      status: "NEEDS_DISAMBIGUATION",
      message: `Ada ${candidates.length} pelamar dengan nama "${name}". Sebutkan lebih spesifik (email):`,
      options: candidates.slice(0, 5).map((c) => `${c.full_name} — ${c.email}`),
    };
  }
  const candidate = candidates[0];

  const { data: row } = await supabaseAdmin.from("pelamar").select("offered_salary, offer_letter_content, offer_letter_status").eq("id", candidate.id).maybeSingle();
  const r = row as { offered_salary?: number | null; offer_letter_content?: string | null; offer_letter_status?: string | null } | null;
  if (!r?.offered_salary) {
    return { status: "NEEDS_INFO", message: `Gaji yang ditawarkan untuk ${candidate.full_name} belum diisi. Set dulu di menu Recruitment > Decisions sebelum mengirim offer letter.` };
  }
  if (r.offer_letter_status === "Terkirim") {
    return { status: "ERROR", message: `Offer letter untuk ${candidate.full_name} sudah pernah terkirim.` };
  }
  // Generating letter content is reversible / has no external effect (unlike
  // sending it), so it's safe to do eagerly while building the proposal
  // rather than gating it behind a second confirmation.
  if (!r.offer_letter_content) {
    const genRes = await generateOfferLetter(candidate.id);
    if (genRes && "error" in genRes) return { status: "ERROR", message: genRes.error };
  }
  return {
    status: "AWAITING_USER_CONFIRMATION",
    summary: `🔔 Konfirmasi: Kirim offer letter ke ${candidate.full_name} (${candidate.email}) dengan gaji ditawarkan Rp${Number(r.offered_salary).toLocaleString("id-ID")}. Ketik "ya" untuk melanjutkan atau "batal" untuk membatalkan.`,
    toolName: "send_offer_letter",
    args: { application_id: candidate.id, description: `Kirim offer letter ke ${candidate.full_name} (${candidate.email})` },
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

      case "get_pending_overtime": {
        const rows = (await getLembur()) as Record<string, unknown>[];
        const pending = rows.filter((r) => r.status === "Pending");
        return JSON.stringify({
          total_pending: pending.length,
          daftar: pending.slice(0, LIST_CAP).map((r) => ({
            nama: r.karyawan_nama, tanggal: r.tanggal, jam_mulai: r.jam_mulai, jam_selesai: r.jam_selesai,
          })),
        });
      }

      case "get_pending_absence_corrections": {
        const rows = (await getKoreksiAbsensi()) as Record<string, unknown>[];
        const pending = rows.filter((r) => r.status === "Pending");
        return JSON.stringify({
          total_pending: pending.length,
          daftar: pending.slice(0, LIST_CAP).map((r) => ({
            nama: r.karyawan_nama, jenis: r.jenis_koreksi, tanggal: r.tanggal,
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

      case "get_financial_summary": {
        const month = typeof args.month === "string" && args.month.trim() ? parseInt(args.month.trim(), 10) : undefined;
        const year = typeof args.year === "string" && args.year.trim() ? parseInt(args.year.trim(), 10) : undefined;
        const summary = await getFinancialSummary(month, year);
        return JSON.stringify({
          periode: summary.periode,
          total_omset: summary.omset,
          total_biaya: summary.biaya.total,
          rincian_biaya: { gaji: summary.biaya.gaji, insentif_supir: summary.biaya.insentif_supir, perjalanan_dinas: summary.biaya.perjalanan_dinas },
          laba_rugi: summary.laba_rugi,
          status: summary.laba_rugi >= 0 ? "Laba" : "Rugi",
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

      case "decide_leave_request":
        return JSON.stringify(await proposeLeaveDecision(args));

      case "decide_overtime_request":
        return JSON.stringify(await proposeOvertimeDecision(args));

      case "decide_absence_correction":
        return JSON.stringify(await proposeAbsenceCorrectionDecision(args));

      case "generate_payslip":
        return JSON.stringify(await proposeGeneratePayslip(args));

      case "generate_payroll_batch":
        return JSON.stringify(await proposeGeneratePayrollBatch(args));

      case "decide_payroll_status":
        return JSON.stringify(await proposePayrollStatusDecision(args));

      case "decide_hiring_step":
        return JSON.stringify(await proposeHiringDecision(args));

      case "send_offer_letter":
        return JSON.stringify(await proposeSendOfferLetter(args));

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
