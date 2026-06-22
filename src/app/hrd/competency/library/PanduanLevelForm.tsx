"use client";

import { useState, useRef, useTransition } from "react";
import { BookOpen, Save, Wand2, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { saveAllSkillLevelGuides, getSkillGuidesMap, type LevelGuide } from "@/app/actions/competency-guides";

type Skill = { id: string; name: string; category: string; department?: string | null };
type LevelData = { title: string; description: string; indicators: string; example: string };
type GuideState = Record<number, LevelData>;

const EMPTY_LEVEL = (): LevelData => ({ title: "", description: "", indicators: "", example: "" });
const EMPTY_GUIDES = (): GuideState => ({ 1: EMPTY_LEVEL(), 2: EMPTY_LEVEL(), 3: EMPTY_LEVEL(), 4: EMPTY_LEVEL(), 5: EMPTY_LEVEL() });

const LEVEL_COLORS: Record<number, string> = {
  1: "border-red-200 bg-red-50 text-red-700",
  2: "border-orange-200 bg-orange-50 text-orange-700",
  3: "border-yellow-200 bg-yellow-50 text-yellow-700",
  4: "border-blue-200 bg-blue-50 text-blue-700",
  5: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Mengetahui Dasar",
  2: "Dapat dengan Bimbingan",
  3: "Mandiri",
  4: "Mahir & Membimbing",
  5: "Ahli & Inovator",
};

function generateTemplate(skillName: string, level: number, category: string): LevelData {
  const sk = skillName || "kompetensi ini";
  const cat = category || "Teknis";
  const ctx = "lingkungan kerja perusahaan";
  const exCtx = "dalam menjalankan tugas sehari-hari";

  // ── TEKNIS / OPERASIONAL ──────────────────────────────────────────────────
  if (cat === "Teknis" || cat === "Operasional") {
    const t: Record<number, LevelData> = {
      1: {
        title: `Memahami dasar-dasar ${sk}`,
        description: `Mengenal konsep, terminologi, dan cara kerja ${sk} secara teoritis. Tahu mengapa ${sk} penting dalam ${ctx}, tetapi belum mampu menjalankan atau mengoperasikannya secara mandiri.`,
        indicators: `Dapat menjelaskan apa itu ${sk} dan tujuan penggunaannya\nMengenal nama-nama alat, sistem, atau prosedur dalam ${sk}\nMampu mengikuti demonstrasi atau simulasi dengan arahan penuh\nBelum bisa menjalankan tanpa pendampingan langsung`,
        example: `Mengikuti pelatihan atau orientasi ${sk}, mampu menyebutkan langkah-langkah utama dan alat yang digunakan ${exCtx}.`,
      },
      2: {
        title: `Menjalankan ${sk} dengan bimbingan`,
        description: `Mampu mengoperasikan ${sk} untuk tugas rutin menggunakan SOP yang ada. Masih memerlukan arahan saat menghadapi variasi dan hasil kerjanya perlu diverifikasi atasan sebelum digunakan.`,
        indicators: `Mengikuti SOP ${sk} langkah demi langkah dengan benar\nMenggunakan alat atau sistem terkait ${sk} secara aktif\nMengenali dan melaporkan hambatan teknis kepada supervisor\nHasil kerja masih perlu dicek sebelum difinalisasi`,
        example: `Menyelesaikan tugas ${sk} harian mengikuti panduan yang ada, sesekali bertanya kepada senior ${exCtx}.`,
      },
      3: {
        title: `Menguasai ${sk} secara mandiri`,
        description: `Menjalankan ${sk} secara penuh tanpa supervisi rutin. Mampu mengidentifikasi dan mengatasi kendala umum yang muncul ${exCtx}, serta menghasilkan output yang konsisten dan memenuhi standar.`,
        indicators: `Menyelesaikan seluruh siklus kerja ${sk} tanpa pendampingan\nMemecahkan masalah teknis yang lazim terjadi secara mandiri\nMenjaga akurasi dan kecepatan kerja sesuai standar yang ditetapkan\nDapat menjelaskan alasan di balik setiap langkah yang dikerjakan`,
        example: `Dipercaya menjalankan ${sk} secara rutin dan independen, termasuk menangani situasi tidak terduga yang umum ditemui ${exCtx}.`,
      },
      4: {
        title: `Mahir ${sk} dan membimbing tim`,
        description: `Menguasai aspek teknis lanjut dari ${sk}, termasuk skenario kompleks dan kasus yang jarang terjadi. Menjadi sumber rujukan bagi tim dan aktif melatih rekan junior dalam ${ctx}.`,
        indicators: `Menangani kasus ${sk} yang kompleks, tidak standar, atau lintas fungsi\nMenjadi orang pertama yang dikonsultasi terkait ${sk} di tim\nAktif melatih dan mendampingi karyawan baru dalam ${sk}\nMengidentifikasi inefisiensi proses dan mengusulkan solusi konkret`,
        example: `Dipercaya memimpin pemecahan masalah ${sk} yang sulit dan menjadi mentor bagi anggota baru ${exCtx}.`,
      },
      5: {
        title: `Pakar ${sk} dan arsitek standar`,
        description: `Diakui sebagai otoritas tertinggi dalam ${sk} di tingkat organisasi. Merancang sistem, standar, dan metodologi baru yang meningkatkan kualitas dan efisiensi ${ctx} secara menyeluruh.`,
        indicators: `Menetapkan standar dan best practice ${sk} yang berlaku di seluruh organisasi\nMemimpin pengembangan kapabilitas ${sk} secara strategis dan berkelanjutan\nMenciptakan solusi inovatif yang melampaui pendekatan yang ada\nDiakui (internal/eksternal) sebagai referensi utama dalam bidang ${sk}`,
        example: `Merancang sistem atau metodologi baru dalam ${sk} yang diadopsi sebagai standar perusahaan, berdampak nyata pada efisiensi ${ctx}.`,
      },
    };
    return t[level] ?? EMPTY_LEVEL();
  }

  // ── SOFT SKILLS ───────────────────────────────────────────────────────────
  if (cat === "Soft Skills") {
    const t: Record<number, LevelData> = {
      1: {
        title: `Sadar pentingnya ${sk}`,
        description: `Mulai menyadari peran ${sk} dalam keberhasilan kerja di ${ctx}. Sudah mempelajari konsep dasarnya, namun penerapan dalam situasi kerja nyata masih terbatas dan belum konsisten.`,
        indicators: `Memahami definisi dan manfaat ${sk} bagi diri sendiri dan tim\nMengenali situasi kerja yang membutuhkan ${sk}\nMulai mencoba menerapkan dalam interaksi sehari-hari meski belum konsisten\nMenerima feedback tentang area pengembangan ${sk} dengan terbuka`,
        example: `Memahami mengapa ${sk} penting ${exCtx} dan mulai berlatih menerapkannya dalam percakapan atau kerjasama tim.`,
      },
      2: {
        title: `Menerapkan ${sk} dalam situasi terpandu`,
        description: `Mampu menunjukkan ${sk} dalam situasi yang terstruktur dan relatif aman. Penerapannya belum selalu konsisten saat menghadapi tekanan atau situasi yang tidak familiar ${exCtx}.`,
        indicators: `Menerapkan ${sk} dengan baik dalam situasi kerja rutin dan familiar\nMenerima dan menindaklanjuti feedback dari atasan untuk perbaikan\nMulai menunjukkan inisiatif dalam menerapkan ${sk} tanpa diminta\nMasih perlu pengingat atau dukungan saat situasi menjadi menantang`,
        example: `Menunjukkan ${sk} secara aktif dalam rapat tim atau saat berkolaborasi ${exCtx}, meski kadang masih perlu dorongan dari atasan.`,
      },
      3: {
        title: `Konsisten dalam ${sk}`,
        description: `Menunjukkan ${sk} secara konsisten dalam berbagai situasi kerja—termasuk saat menghadapi tekanan, konflik, atau kondisi tidak nyaman di ${ctx}. Orang lain mulai mengamati dan menghargai pola perilaku ini.`,
        indicators: `Menerapkan ${sk} secara konsisten bahkan dalam situasi sulit atau penuh tekanan\nAdaptasi gaya komunikasi/interaksi sesuai konteks dan lawan bicara\nMenjadi contoh perilaku positif yang diakui rekan setim\nMembantu rekan yang kesulitan tanpa diminta secara proaktif`,
        example: `Dikenal di tim sebagai seseorang yang secara konsisten menunjukkan ${sk} ${exCtx}, baik dalam kondisi normal maupun krisis.`,
      },
      4: {
        title: `Role model ${sk} dan pengembang tim`,
        description: `Menjadi teladan utama ${sk} yang diakui dalam tim atau departemen. Secara aktif melatih dan membimbing rekan agar turut mengembangkan ${sk} mereka, serta berkontribusi pada budaya tim yang positif di ${ctx}.`,
        indicators: `Diakui sebagai role model ${sk} oleh rekan, bawahan, dan atasan\nSecara aktif melatih dan memberikan feedback konstruktif kepada tim\nMemimpin inisiatif untuk memperkuat budaya ${sk} dalam tim\nMenangani situasi interpersonal yang kompleks atau penuh konflik dengan efektif`,
        example: `Memimpin program pengembangan ${sk} dalam tim, menjadi coach bagi karyawan baru, dan diajak bicara saat ada konflik ${exCtx}.`,
      },
      5: {
        title: `Pemimpin budaya ${sk}`,
        description: `Membentuk budaya dan norma ${sk} di tingkat organisasi. Mengembangkan metodologi, program, atau kerangka kerja yang menjadi rujukan seluruh departemen untuk menumbuhkan ${sk} secara sistematis.`,
        indicators: `Merancang program atau framework pengembangan ${sk} yang diterapkan lintas departemen\nMenjadi wajah organisasi dalam hal ${sk} di hadapan pihak eksternal\nMemengaruhi kebijakan dan nilai organisasi melalui ${sk}\nMendampingi pemimpin senior dalam membangun budaya positif`,
        example: `Merancang program pengembangan ${sk} perusahaan yang berdampak pada seluruh karyawan, dan diakui sebagai tokoh kunci budaya organisasi.`,
      },
    };
    return t[level] ?? EMPTY_LEVEL();
  }

  // ── MANAJEMEN ─────────────────────────────────────────────────────────────
  if (cat === "Manajemen") {
    const t: Record<number, LevelData> = {
      1: {
        title: `Memahami prinsip ${sk}`,
        description: `Memiliki pemahaman konseptual tentang ${sk} dan relevansinya dalam ${ctx}. Mengenal kerangka, model, dan terminologi manajemen yang umum digunakan, tetapi belum punya pengalaman menerapkannya secara langsung.`,
        indicators: `Memahami definisi, tujuan, dan ruang lingkup ${sk}\nMengenal model atau framework yang lazim digunakan dalam ${sk}\nDapat menjelaskan bagaimana ${sk} berhubungan dengan kinerja organisasi\nBelum pernah memimpin atau mengelola menggunakan ${sk} secara mandiri`,
        example: `Mempelajari konsep ${sk} melalui pelatihan atau studi kasus, dan dapat mendiskusikannya dalam konteks ${ctx}.`,
      },
      2: {
        title: `Membantu proses ${sk} di bawah supervisi`,
        description: `Berpartisipasi aktif dalam kegiatan ${sk} di bawah arahan manajer atau senior. Menjalankan tugas-tugas manajerial yang terdefinisi dan mulai membangun kemampuan analisis serta pengambilan keputusan dasar ${exCtx}.`,
        indicators: `Membantu menyusun rencana, laporan, atau anggaran dalam proses ${sk}\nMengumpulkan data dan menyiapkan bahan untuk pengambilan keputusan\nMenyampaikan update status kepada atasan secara terstruktur\nMenjalankan keputusan manajerial yang sudah ditetapkan`,
        example: `Terlibat aktif dalam proses perencanaan atau koordinasi ${sk} ${exCtx} sebagai asisten atau koordinator di bawah supervisi langsung.`,
      },
      3: {
        title: `Mengelola ${sk} secara mandiri`,
        description: `Mampu merencanakan, mengorganisasi, dan menjalankan ${sk} untuk lingkup tugasnya secara mandiri. Membuat keputusan operasional yang tepat, mengelola sumber daya, dan memastikan target tercapai ${exCtx}.`,
        indicators: `Menyusun rencana kerja, target, dan alokasi sumber daya secara mandiri\nMembuat keputusan operasional sesuai wewenang tanpa eskalasi rutin\nMemantau progres dan mengambil tindakan korektif secara proaktif\nMengelola hubungan dengan stakeholder terkait ${sk}`,
        example: `Memimpin proyek atau fungsi ${sk} secara penuh ${exCtx}, termasuk mengambil keputusan operasional dan melaporkan hasilnya.`,
      },
      4: {
        title: `Memimpin ${sk} dan mengembangkan tim`,
        description: `Memimpin pelaksanaan ${sk} dalam lingkup yang lebih luas, termasuk situasi kompleks dan penuh ketidakpastian. Mengembangkan kapabilitas tim dan berkontribusi pada perbaikan sistem manajemen di ${ctx}.`,
        indicators: `Memimpin dan mengoordinasikan tim dalam menjalankan ${sk} yang kompleks\nMengembangkan kapabilitas anggota tim melalui coaching dan delegasi\nMerancang sistem atau proses untuk meningkatkan efektivitas ${sk}\nMenjadi konsultan internal bagi manajer lain yang membutuhkan panduan`,
        example: `Memimpin tim lintas fungsi dalam ${sk} ${exCtx}, sekaligus menjadi coach bagi manajer junior dan merancang perbaikan sistem.`,
      },
      5: {
        title: `Pemimpin strategis ${sk}`,
        description: `Merancang arah strategis dan transformasi organisasi melalui ${sk}. Memimpin perubahan besar, menetapkan kebijakan, dan menjadi penggerak utama kinerja jangka panjang perusahaan dalam ${ctx}.`,
        indicators: `Merancang strategi dan kebijakan ${sk} jangka panjang untuk organisasi\nMemimpin transformasi organisasi melalui perubahan sistem dan budaya\nMenjadi thought leader internal dan eksternal dalam bidang ${sk}\nBertanggung jawab atas keberhasilan ${sk} di tingkat korporat`,
        example: `Merancang ulang sistem ${sk} perusahaan secara menyeluruh, memimpin transformasi yang berdampak pada seluruh ${ctx} secara strategis.`,
      },
    };
    return t[level] ?? EMPTY_LEVEL();
  }

  // ── K3 ────────────────────────────────────────────────────────────────────
  if (cat === "K3") {
    const t: Record<number, LevelData> = {
      1: {
        title: `Mengenal dasar-dasar ${sk}`,
        description: `Memahami konsep dasar ${sk}, termasuk pentingnya keselamatan dalam ${ctx}. Mengetahui peraturan dan prosedur dasar yang berlaku, serta mampu menggunakan APD yang diwajibkan.`,
        indicators: `Memahami tujuan dan pentingnya ${sk} dalam lingkungan kerja\nMengetahui peraturan K3 dasar yang relevan dengan pekerjaannya\nMenggunakan APD yang diwajibkan dengan benar\nMengetahui cara melaporkan kondisi tidak aman atau insiden`,
        example: `Lulus pelatihan K3 dasar/induksi, selalu menggunakan APD yang benar, dan tahu kepada siapa melapor jika menemukan bahaya ${exCtx}.`,
      },
      2: {
        title: `Menerapkan prosedur ${sk} dengan benar`,
        description: `Mengikuti seluruh prosedur dan peraturan ${sk} secara konsisten dalam pekerjaan sehari-hari di ${ctx}. Mampu mengidentifikasi bahaya yang jelas dan mengambil tindakan dasar sesuai SOP.`,
        indicators: `Mengikuti SOP ${sk} secara konsisten tanpa pengabaian\nMengidentifikasi bahaya yang terlihat jelas dan melaporkannya\nMelakukan inspeksi pre-task sebelum memulai pekerjaan berisiko\nMendukung rekan dalam kepatuhan terhadap prosedur keselamatan`,
        example: `Selalu melakukan safety checklist sebelum bekerja, tidak pernah melanggar prosedur keselamatan, dan aktif melaporkan potensi bahaya ${exCtx}.`,
      },
      3: {
        title: `Mengelola ${sk} secara proaktif`,
        description: `Secara proaktif mengidentifikasi bahaya dan risiko sebelum terjadi insiden di ${ctx}. Menjalankan tindakan pencegahan mandiri dan berkontribusi pada peningkatan kondisi keselamatan lingkungan kerja.`,
        indicators: `Melakukan hazard identification dan risk assessment secara mandiri\nMengusulkan dan mengimplementasikan tindakan perbaikan keselamatan\nMenjadi contoh kepatuhan K3 yang diakui oleh rekan kerja\nMampu memberi penjelasan K3 kepada karyawan baru di area kerjanya`,
        example: `Mengidentifikasi potensi bahaya ${exCtx} sebelum terjadi insiden dan mengambil tindakan pencegahan yang tepat tanpa menunggu instruksi.`,
      },
      4: {
        title: `Memimpin budaya ${sk} di tim`,
        description: `Memimpin penerapan ${sk} di lingkungan tim dan departemen. Melakukan audit, investigasi insiden, dan aktif melatih karyawan untuk memperkuat budaya keselamatan dalam ${ctx}.`,
        indicators: `Memimpin safety audit, inspeksi berkala, dan investigasi insiden\nMelatih karyawan tentang ${sk} dan memastikan pemahaman merata\nMengembangkan atau merevisi prosedur keselamatan berdasarkan temuan\nMemonitor tren insiden dan merekomendasikan tindakan pencegahan sistemik`,
        example: `Memimpin program safety awareness ${exCtx}, melakukan investigasi insiden, dan melatih tim dalam identifikasi bahaya serta tindakan darurat.`,
      },
      5: {
        title: `Merancang sistem ${sk} organisasi`,
        description: `Merancang dan menetapkan sistem, kebijakan, dan standar ${sk} yang berlaku di seluruh organisasi. Menjadi otoritas tertinggi dalam keselamatan kerja dan mendorong transformasi budaya K3 di ${ctx}.`,
        indicators: `Merancang sistem manajemen K3 yang komprehensif untuk seluruh organisasi\nMenetapkan kebijakan dan standar keselamatan yang melampaui regulasi minimum\nMemimpin transformasi budaya keselamatan secara lintas departemen\nMenjadi perwakilan organisasi dalam audit eksternal atau sertifikasi K3`,
        example: `Merancang dan mengimplementasikan sistem manajemen K3 perusahaan, yang diadopsi seluruh divisi dan lulus sertifikasi eksternal.`,
      },
    };
    return t[level] ?? EMPTY_LEVEL();
  }

  // ── HR ────────────────────────────────────────────────────────────────────
  if (cat === "HR") {
    const t: Record<number, LevelData> = {
      1: {
        title: `Memahami konsep ${sk}`,
        description: `Mengenal konsep dasar, kebijakan, dan regulasi yang berkaitan dengan ${sk} dalam ${ctx}. Memahami alur proses SDM yang relevan secara teoritis, meski belum berpengalaman menjalankannya.`,
        indicators: `Memahami konsep dan tujuan ${sk} dalam pengelolaan SDM\nMengenal kebijakan HR dan regulasi ketenagakerjaan yang relevan\nDapat menjelaskan alur proses ${sk} secara umum\nBelum pernah menjalankan ${sk} secara langsung`,
        example: `Mempelajari prosedur dan peraturan ${sk} melalui pelatihan orientasi atau manual HR ${exCtx}.`,
      },
      2: {
        title: `Menjalankan proses ${sk} dengan panduan`,
        description: `Mampu melaksanakan proses administrasi dan operasional ${sk} dengan bimbingan HR senior. Memproses data karyawan, mengikuti prosedur yang ditetapkan, dan mendukung kelancaran fungsi SDM ${exCtx}.`,
        indicators: `Memproses dokumen dan data ${sk} sesuai prosedur yang ada\nBerinteraksi dengan karyawan terkait ${sk} secara profesional\nMengidentifikasi dan mengeskalasi isu yang melebihi kewenangannya\nMenjaga kerahasiaan data SDM yang dikelola`,
        example: `Memproses administrasi ${sk} secara akurat ${exCtx} dengan panduan dari HR senior, termasuk dokumentasi dan komunikasi ke karyawan.`,
      },
      3: {
        title: `Mengelola ${sk} secara mandiri`,
        description: `Menjalankan seluruh siklus ${sk} secara mandiri dari awal hingga selesai. Mampu menangani berbagai kondisi dan pertanyaan karyawan tentang ${sk} tanpa eskalasi rutin ${exCtx}.`,
        indicators: `Mengelola seluruh proses ${sk} dari awal hingga selesai secara mandiri\nMemberikan panduan dan klarifikasi kepada karyawan tentang ${sk}\nMemastikan kepatuhan terhadap regulasi dan kebijakan perusahaan\nMemelihara data dan laporan ${sk} secara akurat dan tepat waktu`,
        example: `Menjadi PIC mandiri untuk ${sk} ${exCtx}, menangani seluruh proses dari pengajuan hingga penyelesaian tanpa perlu supervisi rutin.`,
      },
      4: {
        title: `Merancang program ${sk} dan memberikan advisory`,
        description: `Merancang program, kebijakan, dan sistem ${sk} yang meningkatkan kualitas pengelolaan SDM di ${ctx}. Memberikan advisory kepada manajer lini dan berkontribusi pada pengambilan keputusan HR strategis.`,
        indicators: `Merancang program atau kebijakan ${sk} yang inovatif dan efektif\nMemberikan advisory kepada manajer lini dalam keputusan terkait ${sk}\nMenganalisis data ${sk} untuk mengidentifikasi tren dan perbaikan\nMemimpin implementasi perubahan kebijakan atau sistem ${sk}`,
        example: `Merancang ulang program ${sk} ${exCtx}, melatih manajer lini, dan menjadi advisor utama dalam keputusan SDM terkait ${sk}.`,
      },
      5: {
        title: `Pemimpin strategis ${sk}`,
        description: `Merancang dan memimpin transformasi ${sk} di tingkat organisasi. Menetapkan arah, kebijakan, dan standar ${sk} yang mendukung strategi bisnis jangka panjang serta membangun kapabilitas SDM unggul.`,
        indicators: `Menetapkan visi dan arah strategis ${sk} untuk seluruh organisasi\nMerancang sistem ${sk} yang selaras dengan tujuan bisnis jangka panjang\nMemimpin transformasi budaya dan kapabilitas SDM melalui ${sk}\nMenjadi benchmark eksternal dalam praktik terbaik ${sk}`,
        example: `Merancang strategi ${sk} perusahaan yang diadopsi seluruh departemen, berdampak pada kualitas SDM dan daya saing organisasi secara keseluruhan.`,
      },
    };
    return t[level] ?? EMPTY_LEVEL();
  }

  // ── DEFAULT (Lainnya / tidak dikenali) ────────────────────────────────────
  const t: Record<number, LevelData> = {
    1: {
      title: `Mengenal dasar ${sk}`,
      description: `Memiliki pemahaman awal tentang ${sk} dan relevansinya dalam ${ctx}. Mengetahui konsep dan terminologi yang digunakan, namun pengalaman praktis masih sangat terbatas.`,
      indicators: `Memahami definisi, tujuan, dan ruang lingkup ${sk}\nMengenal istilah dan konsep kunci yang terkait\nMengetahui konteks penerapan ${sk} dalam pekerjaan\nMemerlukan bimbingan penuh untuk memulai`,
      example: `Mempelajari ${sk} melalui orientasi, pelatihan, atau observasi ${exCtx}.`,
    },
    2: {
      title: `Menerapkan ${sk} dengan bimbingan`,
      description: `Mampu menjalankan ${sk} dalam tugas-tugas dasar dengan arahan dari senior atau supervisor. Output masih perlu diverifikasi sebelum digunakan secara resmi ${exCtx}.`,
      indicators: `Mengikuti prosedur ${sk} sesuai instruksi yang diberikan\nMenggunakan sumber daya dan alat yang terkait ${sk}\nMengenali masalah dan melaporkannya kepada atasan\nHasil kerja perlu dicek dan dikoreksi sebelum difinalisasi`,
      example: `Menyelesaikan tugas ${sk} rutin dengan mengikuti panduan, sesekali meminta klarifikasi ${exCtx}.`,
    },
    3: {
      title: `Mandiri dalam ${sk}`,
      description: `Menjalankan ${sk} tanpa perlu supervisi terus-menerus. Mampu memecahkan masalah yang lazim terjadi dan menghasilkan output berkualitas konsisten dalam ${ctx}.`,
      indicators: `Menyelesaikan tugas ${sk} secara penuh dan mandiri\nMemecahkan masalah umum tanpa eskalasi rutin\nMenghasilkan output yang konsisten dan sesuai standar\nMulai berbagi pengalaman kepada rekan yang lebih baru`,
      example: `Dipercaya menjalankan ${sk} secara rutin dan independen ${exCtx}, termasuk menangani kendala yang biasa ditemui.`,
    },
    4: {
      title: `Mahir ${sk} dan membimbing orang lain`,
      description: `Menguasai ${sk} termasuk aspek-aspek yang kompleks dan tidak standar. Menjadi rujukan bagi tim dan berkontribusi aktif dalam peningkatan kualitas ${sk} di ${ctx}.`,
      indicators: `Menangani kasus ${sk} yang kompleks atau tidak rutin\nMenjadi narasumber utama terkait ${sk} dalam tim\nMelatih dan mendampingi rekan yang membutuhkan pengembangan ${sk}\nMengidentifikasi area perbaikan dan mengusulkan solusi yang konkret`,
      example: `Menjadi mentor dalam ${sk} ${exCtx} dan dipercaya menangani situasi yang paling kompleks dalam tim.`,
    },
    5: {
      title: `Pakar dan inovator ${sk}`,
      description: `Diakui sebagai keahlian tertinggi dalam ${sk} di tingkat organisasi. Merancang pendekatan, standar, dan inovasi baru yang meningkatkan kinerja ${ctx} secara menyeluruh dan berkelanjutan.`,
      indicators: `Menetapkan standar dan praktik terbaik ${sk} untuk seluruh organisasi\nMenciptakan solusi dan metodologi baru yang melampaui pendekatan yang ada\nDiakui internal dan eksternal sebagai otoritas dalam ${sk}\nMemimpin pengembangan kapabilitas ${sk} secara strategis`,
      example: `Merancang pendekatan baru dalam ${sk} yang diadopsi sebagai standar perusahaan dan memberi dampak nyata pada kualitas ${ctx}.`,
    },
  };
  return t[level] ?? EMPTY_LEVEL();
}

interface Props {
  skills: Skill[];
}

export default function PanduanLevelForm({ skills }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [guides, setGuides] = useState<GuideState>(EMPTY_GUIDES());
  const [expanded, setExpanded] = useState<number | null>(1);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [saving, startSave] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  const selectedSkill = skills.find((s) => s.id === selectedSkillId);

  async function handleSelectSkill(skillId: string) {
    setSelectedSkillId(skillId);
    setMsg(null);
    if (!skillId) { setGuides(EMPTY_GUIDES()); return; }
    setLoadingGuides(true);
    const map = await getSkillGuidesMap(skillId, "");
    const next = EMPTY_GUIDES();
    for (let level = 1; level <= 5; level++) {
      const g: LevelGuide | undefined = map[level];
      if (g) next[level] = { title: g.title, description: g.description, indicators: g.indicators, example: g.example };
    }
    setGuides(next);
    setLoadingGuides(false);
  }

  function loadTemplate() {
    if (!selectedSkill) return;
    const next = EMPTY_GUIDES();
    for (let level = 1; level <= 5; level++) {
      next[level] = generateTemplate(selectedSkill.name, level, selectedSkill.category);
    }
    setGuides(next);
    setMsg(null);
  }

  function updateGuide(level: number, field: keyof LevelData, value: string) {
    setGuides((prev) => ({ ...prev, [level]: { ...prev[level], [field]: value } }));
  }

  function handleSave() {
    if (!selectedSkillId) { setMsg({ type: "error", text: "Pilih kompetensi terlebih dahulu." }); return; }
    if (!formRef.current) return;
    setMsg(null);
    const fd = new FormData(formRef.current);
    // inject guides state (controlled inputs are not in formRef naturally)
    fd.set("skill_id", selectedSkillId);
    for (let level = 1; level <= 5; level++) {
      fd.set(`level_${level}_title`, guides[level]?.title || "");
      fd.set(`level_${level}_description`, guides[level]?.description || "");
      fd.set(`level_${level}_indicators`, guides[level]?.indicators || "");
      fd.set(`level_${level}_example`, guides[level]?.example || "");
    }
    startSave(async () => {
      const result = await saveAllSkillLevelGuides(fd);
      if ("error" in result) {
        setMsg({ type: "error", text: result.error ?? "Terjadi kesalahan" });
      } else {
        setMsg({ type: "success", text: "Panduan level berhasil disimpan!" });
      }
    });
  }

  const filteredSkills = skills.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filteredSkills.reduce<Record<string, Skill[]>>((acc, s) => {
    const key = s.department ? `Departemen: ${s.department}` : s.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: skill list */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <p className="text-xs font-extrabold text-slate-700 mb-2">Pilih Kompetensi</p>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kompetensi..."
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-[#CC0000] outline-none" />
          </div>
          <div className="overflow-y-auto max-h-[60vh] divide-y divide-slate-50">
            {Object.entries(grouped).length === 0 ? (
              <p className="p-6 text-xs text-slate-400 text-center">Tidak ada hasil.</p>
            ) : Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">{group}</p>
                {items.map((s) => (
                  <button key={s.id} onClick={() => handleSelectSkill(s.id)}
                    className={`w-full text-left px-4 py-3 text-xs transition-colors hover:bg-slate-50 ${selectedSkillId === s.id ? "bg-[#CC0000]/5 border-l-2 border-[#CC0000]" : ""}`}>
                    <p className={`font-bold ${selectedSkillId === s.id ? "text-[#CC0000]" : "text-slate-800"}`}>{s.name}</p>
                    {s.department && <p className="text-[9px] text-slate-400 mt-0.5">Dept: {s.department}</p>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div className="lg:col-span-2">
        {!selectedSkillId ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
            <BookOpen size={48} className="text-slate-300 mb-4" />
            <p className="text-sm font-bold text-slate-500">Pilih kompetensi di sebelah kiri</p>
            <p className="text-xs text-slate-400 mt-1">untuk mulai mengisi panduan levelnya</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-extrabold text-slate-800">{selectedSkill?.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedSkill?.category}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={loadTemplate}
                    className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold rounded-xl hover:bg-sky-100 transition-colors">
                    <Wand2 size={13} /> Muat Template
                  </button>
                  <button onClick={handleSave} disabled={saving || loadingGuides}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#CC0000] text-white text-xs font-bold rounded-xl hover:bg-[#aa0000] disabled:opacity-60 transition-colors">
                    <Save size={13} /> {saving ? "Menyimpan..." : "Simpan Semua Level"}
                  </button>
                </div>
              </div>
              {msg && (
                <div className={`mt-3 flex items-center gap-2 text-xs font-medium rounded-xl px-3 py-2 ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                  {msg.type === "success" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  {msg.text}
                  <button onClick={() => setMsg(null)} className="ml-auto"><X size={12} /></button>
                </div>
              )}
            </div>

            {/* Level forms */}
            {loadingGuides ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-xs text-slate-400">Memuat panduan...</div>
            ) : (
              <form ref={formRef} className="space-y-3">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isOpen = expanded === level;
                  const colors = LEVEL_COLORS[level];
                  const g = guides[level] || EMPTY_LEVEL();
                  const filled = !!(g.title || g.description);
                  return (
                    <div key={level} className={`border rounded-2xl overflow-hidden ${colors}`}>
                      <button type="button" onClick={() => setExpanded(isOpen ? null : level)}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:opacity-90 transition-opacity">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center font-black text-base shadow-sm shrink-0">
                            {level}
                          </div>
                          <div>
                            <p className="font-extrabold text-sm">Level {level} — {LEVEL_LABELS[level]}</p>
                            {filled && !isOpen && (
                              <p className="text-[10px] opacity-70 mt-0.5 truncate max-w-xs">{g.title}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {filled && <CheckCircle2 size={14} className="opacity-70" />}
                          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>

                      {isOpen && (
                        <div className="bg-white/60 px-5 pb-5 space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold text-current opacity-70 uppercase mb-1.5">Judul Level</label>
                            <input type="text" value={g.title} onChange={(e) => updateGuide(level, "title", e.target.value)}
                              placeholder={`Judul singkat untuk Level ${level}...`}
                              className="w-full text-xs border border-current/20 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-current/50" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-current opacity-70 uppercase mb-1.5">Deskripsi</label>
                            <textarea value={g.description} onChange={(e) => updateGuide(level, "description", e.target.value)}
                              rows={3} placeholder="Deskripsi lengkap apa yang dimaksud dengan level ini untuk kompetensi ini..."
                              className="w-full text-xs border border-current/20 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-current/50 resize-y" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-current opacity-70 uppercase mb-1.5">Indikator Perilaku <span className="normal-case font-normal">(satu per baris)</span></label>
                            <textarea value={g.indicators} onChange={(e) => updateGuide(level, "indicators", e.target.value)}
                              rows={4} placeholder={"Mampu melakukan X\nMampu menjelaskan Y\nTelah menguasai Z"}
                              className="w-full text-xs border border-current/20 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-current/50 resize-y font-mono" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-current opacity-70 uppercase mb-1.5">Contoh Nyata <span className="normal-case font-normal">(opsional)</span></label>
                            <textarea value={g.example} onChange={(e) => updateGuide(level, "example", e.target.value)}
                              rows={2} placeholder="Contoh konkret seseorang yang berada di level ini..."
                              className="w-full text-xs border border-current/20 rounded-xl px-3 py-2.5 bg-white outline-none focus:border-current/50 resize-y" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
