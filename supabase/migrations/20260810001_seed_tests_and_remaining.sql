-- ============================================================================
-- SEED: TES REKRUTMEN LENGKAP + MODUL-MODUL YANG BELUM ADA DATA
-- Run after 20260809001_seed_all_pages.sql
-- ============================================================================

-- ══════════════════════════════════════════════════════════════════════════
-- 1. TES REKRUTMEN — Template lengkap untuk semua posisi
-- ══════════════════════════════════════════════════════════════════════════

-- Template Tes Tulis: Freight Forwarding & Kepabeanan (sudah ada di 20260701001)
-- Tambahkan tes untuk posisi lain yang belum punya

DO $$ BEGIN
INSERT INTO tes_rekrutmen (
  id, job_posting_id, test_type, title, instructions,
  questions, duration_minutes, passing_score, is_active, department, created_at
) VALUES (
  'tes-tulis-procurement',
  NULL, 'tulis',
  'Tes Pengetahuan Procurement & Pengadaan',
  'Bacalah setiap soal dengan teliti. Pilih satu jawaban yang paling tepat. Waktu 45 menit. Nilai kelulusan minimal 70.',
  '[
    {"id":"p01","text":"Dokumen yang digunakan untuk meminta penawaran harga dari vendor disebut...","type":"pilihan_ganda","options":["Purchase Order","Request for Quotation (RFQ)","Delivery Order","Invoice"],"correct_answer":"B","points":5},
    {"id":"p02","text":"Purchase Order (PO) diterbitkan oleh...","type":"pilihan_ganda","options":["Vendor kepada pembeli","Pembeli kepada vendor setelah negosiasi","Bank kepada vendor","Bagian gudang"],"correct_answer":"B","points":5},
    {"id":"p03","text":"Prinsip pengadaan yang mengutamakan nilai terbaik dengan biaya terendah disebut...","type":"pilihan_ganda","options":["Just in Time","Value for Money","Cost Reduction","Total Cost of Ownership"],"correct_answer":"B","points":5},
    {"id":"p04","text":"Dokumen Three-Way Matching dalam procurement membandingkan...","type":"pilihan_ganda","options":["PO, GR (Goods Receipt), dan Invoice","PO, RFQ, dan Kontrak","Invoice, PO, dan BPO","Quotation, PO, dan Delivery"],"correct_answer":"A","points":5},
    {"id":"p05","text":"Vendor dengan track record terbaik namun harga tertinggi vs vendor baru dengan harga terendah. Pendekatan terbaik adalah...","type":"pilihan_ganda","options":["Selalu pilih harga terendah","Lakukan evaluasi menyeluruh: kualitas, track record, harga, dan risiko","Selalu pilih vendor lama","Tunda keputusan"],"correct_answer":"B","points":5},
    {"id":"p06","text":"Lead time dalam konteks pengadaan berarti...","type":"pilihan_ganda","options":["Waktu pembayaran invoice","Waktu dari pemesanan hingga barang diterima","Waktu negosiasi kontrak","Waktu inspeksi barang"],"correct_answer":"B","points":5},
    {"id":"p07","text":"Kontrak payung (blanket order) paling tepat digunakan untuk...","type":"pilihan_ganda","options":["Pembelian satu kali dalam jumlah besar","Pengadaan berulang untuk item yang sama dalam periode tertentu","Pengadaan barang unik/custom","Pengadaan darurat"],"correct_answer":"B","points":5},
    {"id":"p08","text":"NPWP vendor diperlukan dalam pengadaan untuk keperluan...","type":"pilihan_ganda","options":["Verifikasi rekening bank","Pemotongan PPh dan pelaporan pajak","Pendaftaran sistem ERP","Audit internal"],"correct_answer":"B","points":5},
    {"id":"p09","text":"Metode evaluasi vendor yang mempertimbangkan harga, kualitas, dan layanan purna jual secara bersamaan disebut...","type":"pilihan_ganda","options":["Lowest Bid","Best Value Evaluation","Single Source","Direct Award"],"correct_answer":"B","points":5},
    {"id":"p10","text":"Goods Receipt Note (GRN) dibuat oleh...","type":"pilihan_ganda","options":["Vendor saat mengirim barang","Bagian penerima/gudang saat barang tiba dan diperiksa","Finance saat membayar","Procurement saat membuat PO"],"correct_answer":"B","points":5},
    {"id":"p11","text":"Konflik kepentingan dalam pengadaan harus...","type":"pilihan_ganda","options":["Disembunyikan agar proses berjalan lancar","Dilaporkan dan orang yang bersangkutan mengundurkan diri dari proses","Diabaikan jika nilainya kecil","Diselesaikan secara informal"],"correct_answer":"B","points":5},
    {"id":"p12","text":"Safety stock dalam manajemen persediaan berfungsi untuk...","type":"pilihan_ganda","options":["Mengurangi biaya penyimpanan","Mengantisipasi fluktuasi permintaan dan keterlambatan pengiriman","Meningkatkan kecepatan pengiriman","Mengurangi jumlah vendor"],"correct_answer":"B","points":5}
  ]'::jsonb,
  45, 70, true, 'Procurement Division', NOW()
),
(
  'tes-tulis-finance',
  NULL, 'tulis',
  'Tes Pengetahuan Akuntansi & Keuangan',
  'Bacalah setiap soal dengan teliti. Pilih satu jawaban yang paling tepat. Waktu 60 menit. Nilai kelulusan minimal 70.',
  '[
    {"id":"f01","text":"Dalam persamaan akuntansi dasar, Aset = Liabilitas + ...","type":"pilihan_ganda","options":["Pendapatan","Ekuitas","Beban","Kas"],"correct_answer":"B","points":5},
    {"id":"f02","text":"Metode penyusutan yang menghasilkan beban penyusutan sama setiap tahun adalah...","type":"pilihan_ganda","options":["Double Declining Balance","Garis Lurus (Straight Line)","Sum of Years Digit","Unit Produksi"],"correct_answer":"B","points":5},
    {"id":"f03","text":"Jurnal untuk mencatat penerimaan kas dari pelanggan adalah...","type":"pilihan_ganda","options":["Debit Piutang, Kredit Kas","Debit Kas, Kredit Piutang","Debit Pendapatan, Kredit Kas","Debit Kas, Kredit Utang"],"correct_answer":"B","points":5},
    {"id":"f04","text":"Current Ratio yang baik umumnya berada di atas...","type":"pilihan_ganda","options":["0.5","1.0","2.0 (standar umum ideal)","5.0"],"correct_answer":"B","points":5},
    {"id":"f05","text":"Rekonsiliasi bank dilakukan untuk...","type":"pilihan_ganda","options":["Menentukan saldo akhir kas yang benar","Membandingkan dan menyelaraskan saldo buku dengan saldo rekening koran","Menghitung bunga bank","Mengajukan pinjaman"],"correct_answer":"B","points":5},
    {"id":"f06","text":"FIFO dalam metode persediaan berarti...","type":"pilihan_ganda","options":["Barang terakhir masuk yang pertama dijual","Barang pertama masuk yang pertama dijual","Rata-rata biaya semua persediaan","Biaya tertinggi digunakan terlebih dahulu"],"correct_answer":"B","points":5},
    {"id":"f07","text":"Accrued expense (beban yang masih harus dibayar) dicatat dengan jurnal...","type":"pilihan_ganda","options":["Debit Kas, Kredit Beban","Debit Beban, Kredit Utang Beban Masih Harus Dibayar","Debit Utang, Kredit Beban","Debit Beban Dibayar di Muka, Kredit Beban"],"correct_answer":"B","points":5},
    {"id":"f08","text":"Laporan arus kas terdiri dari tiga aktivitas: Operasi, Investasi, dan...","type":"pilihan_ganda","options":["Produksi","Pendanaan (Financing)","Penjualan","Pembelian"],"correct_answer":"B","points":5},
    {"id":"f09","text":"PPh 21 adalah pajak yang dikenakan atas...","type":"pilihan_ganda","options":["Penghasilan badan usaha","Penghasilan orang pribadi dari pekerjaan","Penjualan barang","Impor barang"],"correct_answer":"B","points":5},
    {"id":"f10","text":"Gross Profit Margin dihitung dengan rumus...","type":"pilihan_ganda","options":["(Laba Bersih / Penjualan) x 100%","(Laba Kotor / Penjualan) x 100%","(Penjualan - Beban Operasi) / Penjualan x 100%","(Aset - Liabilitas) / Penjualan x 100%"],"correct_answer":"B","points":5}
  ]'::jsonb,
  60, 70, true, 'Finance', NOW()
),
(
  'tes-tulis-hrd',
  NULL, 'tulis',
  'Tes Pengetahuan Manajemen SDM & Ketenagakerjaan',
  'Bacalah setiap soal dengan teliti. Pilih satu jawaban yang paling tepat. Waktu 45 menit. Nilai kelulusan minimal 70.',
  '[
    {"id":"h01","text":"UU Ketenagakerjaan Indonesia yang berlaku saat ini adalah...","type":"pilihan_ganda","options":["UU No. 13 Tahun 2003","UU No. 11 Tahun 2020 (Cipta Kerja) beserta perubahannya","UU No. 2 Tahun 2004","UU No. 40 Tahun 2004"],"correct_answer":"B","points":5},
    {"id":"h02","text":"PKWT adalah singkatan dari...","type":"pilihan_ganda","options":["Perjanjian Kerja Waktu Tidak Tertentu","Perjanjian Kerja Waktu Tertentu","Peraturan Kerja Waktu Tertentu","Program Kerja Waktu Tertentu"],"correct_answer":"B","points":5},
    {"id":"h03","text":"Masa uji coba (probation) untuk karyawan tetap maksimal selama...","type":"pilihan_ganda","options":["1 bulan","3 bulan","6 bulan","1 tahun"],"correct_answer":"C","points":5},
    {"id":"h04","text":"BPJS Ketenagakerjaan mencakup program JHT, JKK, JKM, dan...","type":"pilihan_ganda","options":["JKS (Jaminan Kesehatan Sosial)","JP (Jaminan Pensiun)","JKL (Jaminan Kerja Lapangan)","JBT (Jaminan Biaya Terakhir)"],"correct_answer":"B","points":5},
    {"id":"h05","text":"Hak cuti tahunan karyawan yang telah bekerja minimal 12 bulan adalah...","type":"pilihan_ganda","options":["7 hari kerja","12 hari kerja","14 hari kerja","21 hari kerja"],"correct_answer":"B","points":5},
    {"id":"h06","text":"360-degree feedback dalam manajemen kinerja berarti...","type":"pilihan_ganda","options":["Evaluasi hanya dari atasan langsung","Evaluasi dari atasan, bawahan, rekan kerja, dan self-assessment","Evaluasi dari pelanggan saja","Evaluasi hanya dari HR"],"correct_answer":"B","points":5},
    {"id":"h07","text":"Onboarding yang efektif bertujuan untuk...","type":"pilihan_ganda","options":["Mengurangi biaya rekrutmen","Membantu karyawan baru beradaptasi, produktif, dan retain lebih cepat","Mempersingkat masa probasi","Mengurangi jumlah pelatihan"],"correct_answer":"B","points":5},
    {"id":"h08","text":"Employee Net Promoter Score (eNPS) mengukur...","type":"pilihan_ganda","options":["Produktivitas karyawan","Seberapa besar kemungkinan karyawan merekomendasikan perusahaan sebagai tempat kerja","Tingkat kehadiran karyawan","Nilai KPI rata-rata"],"correct_answer":"B","points":5},
    {"id":"h09","text":"Turnover rate yang tinggi paling sering disebabkan oleh...","type":"pilihan_ganda","options":["Terlalu banyak pelatihan","Kompensasi tidak kompetitif, lingkungan kerja buruk, atau kurangnya pengembangan karir","Proses rekrutmen yang ketat","Sistem absensi yang terlalu ketat"],"correct_answer":"B","points":5},
    {"id":"h10","text":"Job Evaluation (evaluasi jabatan) dilakukan untuk...","type":"pilihan_ganda","options":["Mengevaluasi kinerja karyawan","Menentukan nilai/bobot sebuah jabatan sebagai dasar penetapan struktur gaji","Menilai kompetensi individu","Menentukan kebutuhan pelatihan"],"correct_answer":"B","points":5}
  ]'::jsonb,
  45, 70, true, 'HR & GA', NOW()
)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'tes_rekrutmen tulis tambahan: %', SQLERRM; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- TES PSIKOTES — Tambahan dimensi untuk posisi berbeda
-- (template umum tmpl-psikotes-umum sudah ada di 20260701001)
-- ──────────────────────────────────────────────────────────────────────────

DO $$ BEGIN
INSERT INTO tes_rekrutmen (
  id, job_posting_id, test_type, title, instructions,
  questions, duration_minutes, passing_score, is_active, department, created_at
) VALUES (
  'tes-psikotes-leadership',
  NULL, 'psikotes',
  'Tes Psikologi — Orientasi Kepemimpinan & Manajerial',
  'Bacalah setiap pernyataan dan pilih angka 1–5 yang paling menggambarkan diri Anda. 1 = Sangat Tidak Setuju, 5 = Sangat Setuju. Tidak ada jawaban benar/salah.',
  '[
    {"id":"l01","text":"Saya merasa nyaman mengambil keputusan penting meskipun informasi yang tersedia tidak lengkap.","type":"skala","dimension":"Kepemimpinan","scale":5,"reverse":false},
    {"id":"l02","text":"Saya secara aktif mencari cara untuk memotivasi anggota tim yang tampak kurang bersemangat.","type":"skala","dimension":"Kepemimpinan","scale":5,"reverse":false},
    {"id":"l03","text":"Ketika terjadi konflik dalam tim, saya cenderung menghindari terlibat langsung.","type":"skala","dimension":"Kepemimpinan","scale":5,"reverse":true},
    {"id":"l04","text":"Saya senang mendelegasikan pekerjaan dan mempercayai orang lain untuk menyelesaikannya.","type":"skala","dimension":"Kepemimpinan","scale":5,"reverse":false},
    {"id":"l05","text":"Saya secara teratur memberikan umpan balik yang konstruktif kepada rekan dan bawahan.","type":"skala","dimension":"Kepemimpinan","scale":5,"reverse":false},
    {"id":"s01","text":"Saya dapat dengan mudah menyesuaikan gaya komunikasi saya dengan berbagai tipe orang.","type":"skala","dimension":"Komunikasi Strategis","scale":5,"reverse":false},
    {"id":"s02","text":"Saya terbiasa mempresentasikan ide kompleks dengan cara yang mudah dipahami semua orang.","type":"skala","dimension":"Komunikasi Strategis","scale":5,"reverse":false},
    {"id":"s03","text":"Saya sering kesulitan meyakinkan orang lain tentang sudut pandang saya.","type":"skala","dimension":"Komunikasi Strategis","scale":5,"reverse":true},
    {"id":"o01","text":"Saya selalu merencanakan langkah-langkah konkret sebelum memulai sebuah proyek.","type":"skala","dimension":"Orientasi Hasil","scale":5,"reverse":false},
    {"id":"o02","text":"Saya secara konsisten memantau progress terhadap target yang telah ditetapkan.","type":"skala","dimension":"Orientasi Hasil","scale":5,"reverse":false},
    {"id":"o03","text":"Ketika menghadapi hambatan besar, saya cenderung menyerah dan mencari jalur yang lebih mudah.","type":"skala","dimension":"Orientasi Hasil","scale":5,"reverse":true},
    {"id":"a01","text":"Saya menikmati menganalisis data dan angka untuk menemukan pola yang bermakna.","type":"skala","dimension":"Pemikiran Analitis","scale":5,"reverse":false},
    {"id":"a02","text":"Sebelum mengambil keputusan, saya secara sistematis mempertimbangkan berbagai alternatif.","type":"skala","dimension":"Pemikiran Analitis","scale":5,"reverse":false},
    {"id":"a03","text":"Saya lebih suka bertindak cepat berdasarkan intuisi daripada menghabiskan waktu menganalisis.","type":"skala","dimension":"Pemikiran Analitis","scale":5,"reverse":true},
    {"id":"i01","text":"Saya aktif mencari cara baru dan inovatif dalam menyelesaikan masalah lama.","type":"skala","dimension":"Inovasi","scale":5,"reverse":false},
    {"id":"i02","text":"Saya senang mengusulkan perubahan proses meskipun cara lama masih berjalan cukup baik.","type":"skala","dimension":"Inovasi","scale":5,"reverse":false}
  ]'::jsonb,
  50, 0, true, NULL, NOW()
),
(
  'tes-psikotes-operasional',
  NULL, 'psikotes',
  'Tes Psikologi — Orientasi Lapangan & Operasional',
  'Pilih angka 1–5 yang paling menggambarkan diri Anda. 1 = Sangat Tidak Setuju, 5 = Sangat Setuju.',
  '[
    {"id":"d01","text":"Saya terbiasa bekerja dalam kondisi yang berubah-ubah dan penuh tekanan waktu.","type":"skala","dimension":"Ketahanan Tekanan","scale":5,"reverse":false},
    {"id":"d02","text":"Saya merasa stres berat ketika jadwal berubah mendadak di lapangan.","type":"skala","dimension":"Ketahanan Tekanan","scale":5,"reverse":true},
    {"id":"d03","text":"Saya dapat tetap fokus dan efektif meski bekerja dalam kondisi fisik yang menantang.","type":"skala","dimension":"Ketahanan Tekanan","scale":5,"reverse":false},
    {"id":"d04","text":"Saya cepat pulih setelah menghadapi situasi darurat atau krisis di tempat kerja.","type":"skala","dimension":"Ketahanan Tekanan","scale":5,"reverse":false},
    {"id":"k01","text":"Saya selalu mematuhi prosedur keselamatan kerja meskipun tidak ada yang mengawasi.","type":"skala","dimension":"Keselamatan & Kepatuhan","scale":5,"reverse":false},
    {"id":"k02","text":"Saya merasa aturan keselamatan kerja terkadang terlalu kaku dan menghambat pekerjaan.","type":"skala","dimension":"Keselamatan & Kepatuhan","scale":5,"reverse":true},
    {"id":"k03","text":"Saya proaktif melaporkan potensi bahaya di lingkungan kerja meskipun bukan tugas saya.","type":"skala","dimension":"Keselamatan & Kepatuhan","scale":5,"reverse":false},
    {"id":"e01","text":"Saya dapat mengkoordinasikan beberapa pekerjaan atau tugas secara bersamaan tanpa kehilangan kontrol.","type":"skala","dimension":"Efisiensi Kerja","scale":5,"reverse":false},
    {"id":"e02","text":"Saya secara aktif mencari cara untuk mempercepat proses tanpa mengorbankan kualitas.","type":"skala","dimension":"Efisiensi Kerja","scale":5,"reverse":false},
    {"id":"e03","text":"Saya lebih suka menyelesaikan satu pekerjaan sepenuhnya sebelum memulai yang berikutnya.","type":"skala","dimension":"Efisiensi Kerja","scale":5,"reverse":false},
    {"id":"t01","text":"Saya senang bekerja dalam tim yang beragam latar belakang dan keahlian.","type":"skala","dimension":"Kerjasama Tim","scale":5,"reverse":false},
    {"id":"t02","text":"Saya secara sukarela membantu rekan kerja yang sedang kesulitan meski bukan tanggung jawab saya.","type":"skala","dimension":"Kerjasama Tim","scale":5,"reverse":false},
    {"id":"t03","text":"Saya lebih produktif ketika bekerja sendiri dibandingkan dalam tim.","type":"skala","dimension":"Kerjasama Tim","scale":5,"reverse":true}
  ]'::jsonb,
  40, 0, true, 'Operational Division', NOW()
)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'tes_rekrutmen psikotes tambahan: %', SQLERRM; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Hubungkan tes template ke lowongan kerja yang aktif
-- ──────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
-- Update lowongan-lowongan untuk pakai tes yang tepat
-- (tes_rekrutmen sudah bisa pakai job_posting_id NULL = template umum,
--  tapi kita buat juga versi yang terikat ke lowongan spesifik)
INSERT INTO tes_rekrutmen (
  id, job_posting_id, test_type, title, instructions,
  questions, duration_minutes, passing_score, is_active, department, created_at
) VALUES (
  'tes-tulis-lok01',
  'lok-01', 'tulis',
  'Tes Tulis — Staff PPJK (Kepabeanan)',
  'Tes khusus untuk posisi Staff PPJK. Pilih jawaban terbaik. Waktu 60 menit. Nilai minimal 70.',
  '[
    {"id":"k01","text":"Dokumen utama dalam proses impor yang wajib diajukan ke Bea Cukai adalah...","type":"pilihan_ganda","options":["PEB","PIB","AWB","BL"],"correct_answer":"B","points":10},
    {"id":"k02","text":"HS Code (Harmonized System Code) digunakan untuk...","type":"pilihan_ganda","options":["Kode identitas perusahaan ekspor","Klasifikasi barang dalam perdagangan internasional","Nomor registrasi PPJK","Kode tracking pengiriman"],"correct_answer":"B","points":10},
    {"id":"k03","text":"Jalur Merah dalam pemeriksaan kepabeanan berarti...","type":"pilihan_ganda","options":["Importasi prioritas tanpa pemeriksaan","Pemeriksaan fisik barang wajib dilakukan","Jalur khusus barang berbahaya","Tidak ada bea masuk"],"correct_answer":"B","points":10},
    {"id":"k04","text":"Sistem CEISA yang digunakan Bea Cukai Indonesia adalah singkatan dari...","type":"pilihan_ganda","options":["Customs Electronic Information System Application","Customs-Excise Information System and Automation","Central Electronic Import System Application","Custom Entry Import System Automation"],"correct_answer":"B","points":10},
    {"id":"k05","text":"Nilai Pabean (Customs Value) untuk perhitungan bea masuk berdasarkan sistem WTO menggunakan metode...","type":"pilihan_ganda","options":["Harga FOB","Harga CIF (Transaction Value)","Harga EXW","Harga netto"],"correct_answer":"B","points":10},
    {"id":"k06","text":"Bea Masuk Anti Dumping (BMAD) dikenakan ketika...","type":"pilihan_ganda","options":["Barang impor melebihi kuota","Barang impor dijual di bawah harga normal di negara asal dan merugikan industri domestik","Barang impor tidak memiliki sertifikat","Volume impor terlalu besar"],"correct_answer":"B","points":10},
    {"id":"k07","text":"Kawasan Berikat (Bonded Zone) memberikan fasilitas...","type":"pilihan_ganda","options":["Bebas PPN untuk semua transaksi","Penangguhan bea masuk dan pajak impor selama barang berada di kawasan","Izin ekspor tanpa dokumen","Bebas bea masuk permanen"],"correct_answer":"B","points":10},
    {"id":"k08","text":"Sertifikat Form E digunakan untuk memanfaatkan perjanjian perdagangan bebas antara...","type":"pilihan_ganda","options":["ASEAN-India FTA","ASEAN-China FTA (ACFTA)","ASEAN-Australia FTA","Indonesia-Japan FTA"],"correct_answer":"B","points":10},
    {"id":"k09","text":"Tanggung jawab utama PPJK dalam pengurusan kepabeanan adalah...","type":"pilihan_ganda","options":["Menanggung biaya bea masuk","Mengurus dokumen dan formalitas kepabeanan atas nama importir/eksportir","Menyediakan armada transportasi","Menjamin kualitas barang"],"correct_answer":"B","points":10},
    {"id":"k10","text":"Jangka waktu penyelesaian PIB setelah diterima Bea Cukai untuk jalur Hijau adalah...","type":"pilihan_ganda","options":["Langsung keluar setelah bayar bea masuk, tanpa penelitian lebih lanjut","Penelitian dokumen 1 hari kerja","Pemeriksaan fisik wajib 3 hari kerja","Menunggu penetapan nilai pabean 5 hari kerja"],"correct_answer":"A","points":10}
  ]'::jsonb,
  60, 70, true, 'Operational Division', NOW()
),
(
  'tes-psikotes-lok01',
  'lok-01', 'psikotes',
  'Tes Psikologi — Staff PPJK (Kepabeanan)',
  'Pilih angka 1–5 yang paling menggambarkan diri Anda secara jujur. Tidak ada jawaban benar/salah.',
  '[
    {"id":"p01","text":"Saya sangat teliti dalam memeriksa kelengkapan dokumen sebelum mengajukannya.","type":"skala","dimension":"Integritas","scale":5,"reverse":false},
    {"id":"p02","text":"Ketika menemukan kesalahan dokumen, saya segera melaporkan meski berpotensi menunda pengiriman.","type":"skala","dimension":"Integritas","scale":5,"reverse":false},
    {"id":"p03","text":"Saya kadang membiarkan kesalahan kecil dalam dokumen jika diperbaiki akan memperlambat proses.","type":"skala","dimension":"Integritas","scale":5,"reverse":true},
    {"id":"p04","text":"Saya nyaman bekerja dengan deadline ketat dan tekanan dari klien secara bersamaan.","type":"skala","dimension":"Ketahanan Tekanan","scale":5,"reverse":false},
    {"id":"p05","text":"Saya mudah panik ketika banyak pekerjaan menumpuk mendekati deadline.","type":"skala","dimension":"Ketahanan Tekanan","scale":5,"reverse":true},
    {"id":"p06","text":"Saya dapat tetap akurat mengisi formulir meski dalam kondisi terburu-buru.","type":"skala","dimension":"Ketahanan Tekanan","scale":5,"reverse":false},
    {"id":"p07","text":"Saya secara aktif mengikuti update regulasi kepabeanan terbaru.","type":"skala","dimension":"Orientasi Hasil","scale":5,"reverse":false},
    {"id":"p08","text":"Saya puas dengan hasil kerja saya hanya ketika dokumen disetujui tanpa catatan/penolakan.","type":"skala","dimension":"Orientasi Hasil","scale":5,"reverse":false},
    {"id":"p09","text":"Saya senang berbagi pengetahuan prosedur kepabeanan dengan rekan yang lebih baru.","type":"skala","dimension":"Kerjasama Tim","scale":5,"reverse":false},
    {"id":"p10","text":"Saya dapat berkomunikasi dengan baik dengan petugas Bea Cukai maupun klien secara bersamaan.","type":"skala","dimension":"Komunikasi","scale":5,"reverse":false}
  ]'::jsonb,
  35, 0, true, 'Operational Division', NOW()
)
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'tes_rekrutmen per-lowongan: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 2. MODUL YANG MASIH KOSONG — cek dan isi
-- ══════════════════════════════════════════════════════════════════════════

-- Applicant Portal: akun pelamar demo agar halaman /applicant bisa dicoba
DO $$ BEGIN
-- Buat akun pelamar dummy agar bisa login dan lihat status aplikasi
-- Password: Demo@12345 (hash standard dari sistem)
INSERT INTO pengguna (email, password_hash, role, full_name, is_temporary, application_id) VALUES
  ('budi.prasetyo@example.com',
   '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93',
   'applicant', 'Budi Prasetyo', false, 'b0000000-0000-0000-0000-000000000001'),
  ('rian.hidayat@example.com',
   '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93',
   'applicant', 'Rian Hidayat', false, 'b0000000-0000-0000-0000-000000000004'),
  ('anita.wijaya@example.com',
   '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93',
   'applicant', 'Anita Wijaya', false, 'b0000000-0000-0000-0000-000000000005')
ON CONFLICT (email) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pengguna applicant: %', SQLERRM; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Interview Schedules — data untuk halaman hrd/recruitment/interviews
-- ──────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
UPDATE pelamar SET
  interview_date     = to_char(CURRENT_DATE + 2, 'YYYY-MM-DD'),
  interview_time     = '10:00',
  interviewer        = 'Budi Santoso & Fajar Nugroho',
  interview_location = 'Kantor Pusat PT PGP — Ruang Meeting Lantai 2',
  interview_online_link = 'https://meet.google.com/pgp-interview-rian',
  interview_notes    = 'Wawancara teknis kepabeanan dan studi kasus pengurusan PIB kompleks'
WHERE id = 'b0000000-0000-0000-0000-000000000004'
  AND interview_date IS NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'update interview schedule: %', SQLERRM; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Negotiations — data untuk halaman hrd/recruitment/negotiations
-- ──────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
-- Pelamar 5 (Anita - Diterima) sudah punya offered_salary dari seed pipeline
-- Pastikan ada data untuk negosiasi halaman
UPDATE pelamar SET
  offered_salary     = 8500000,
  salary_expectation = 9000000,
  negotiation_status = 'offered',
  negotiation_notes  = 'HRD menawarkan paket gaji Rp 8.500.000 + tunjangan makan & transportasi'
WHERE id = 'b0000000-0000-0000-0000-000000000004'
  AND (offered_salary IS NULL OR offered_salary = 0);
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'update negotiation: %', SQLERRM; END $$;

-- ──────────────────────────────────────────────────────────────────────────
-- Applicant Tests — hubungkan pelamar ke tes (biar bisa test flow)
-- Pelamar 3 (Siti - Tes Tulis & Psikotes) sudah punya hasil dari seed
-- Buat satu pelamar baru yang belum mengerjakan tes untuk demo flow
-- ──────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
-- Tambahkan pelamar baru yang status "Tes Tulis & Psikotes" tapi BELUM ada hasil
-- agar halaman /applicant/test bisa didemonstrasikan end-to-end
INSERT INTO pelamar (id, job_id, full_name, email, phone, status, applied_at, channel_id, match_score, match_detail, resume_url)
VALUES (
  'b0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000001',
  'Reza Firmansyah',
  'reza.firmansyah@example.com',
  '081399990007',
  'Tes Tulis & Psikotes',
  NOW() - INTERVAL '4 days',
  'rc-03',
  71,
  '{"skills_match": ["Logistics", "Excel"], "experience_match": "1 year", "education_match": "D3"}'::jsonb,
  '{"headline": "Fresh Graduate Logistics", "summary": "Lulusan D3 Logistik dengan pengalaman magang PPJK 6 bulan.", "location": "Jakarta Utara", "skills": ["Logistics", "Excel", "PIB/PEB Dasar"], "experiences": [{"position": "Magang Staff PPJK", "company": "PT Forwarder Maju", "start": "2025", "end": "2026", "current": false}], "educations": [{"school": "Politeknik Negeri Jakarta", "degree": "D3", "field": "Logistik", "start": "2022", "end": "2025", "current": false}]}'
) ON CONFLICT (id) DO NOTHING;

-- Akun login untuk demo tes
INSERT INTO pengguna (email, password_hash, role, full_name, is_temporary, application_id)
VALUES (
  'reza.firmansyah@example.com',
  '7b3ff040d72943093ea8236f741734e3:ec2de86b8187131c927dc22dcc12209750e06cb8185c6a179d905e8c9eadad16d4bd2ff02cdc42e7ba1500bae614bb6153c90a1636442a11043a8eba05171a93',
  'applicant', 'Reza Firmansyah', false, 'b0000000-0000-0000-0000-000000000007'
) ON CONFLICT (email) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pelamar tes demo: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- 3. MODUL LAIN YANG BELUM ADA DATA
-- ══════════════════════════════════════════════════════════════════════════

-- Manpower Validation Results (untuk halaman hrd/workforce/requests validasi engine)
DO $$ BEGIN
UPDATE permintaan_sdm SET
  validation_result = '{
    "overall_score": 78,
    "recommendation": "Disetujui dengan catatan",
    "checks": [
      {"name": "Formasi Tersedia", "status": "pass", "detail": "1 dari 2 formasi masih Vacant di unit Operational Division"},
      {"name": "Budget Tersedia", "status": "pass", "detail": "Budget SDM Q3 tersisa Rp 45 juta, cukup untuk 2 rekrutmen"},
      {"name": "Utilisasi Formasi", "status": "pass", "detail": "Utilisasi saat ini 67%, penambahan wajar"},
      {"name": "Tenure Minimum", "status": "pass", "detail": "Bukan rotasi, tidak ada minimum tenure"},
      {"name": "Mobilitas Internal", "status": "warning", "detail": "1 kandidat internal potensial (Wawan Setiadi) sedang mengajukan resign"},
      {"name": "Suksesi", "status": "pass", "detail": "Tidak ada kandidat suksesor yang langsung bisa mengisi posisi ini"},
      {"name": "Urgensi Bisnis", "status": "pass", "detail": "Volume ekspor Q3 naik 35%, kebutuhan mendesak terverifikasi"}
    ]
  }'::jsonb,
  validated_at = NOW() - INTERVAL '8 days'
WHERE id = 'rsdm-01' AND validation_result IS NULL;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'manpower validation result: %', SQLERRM; END $$;

-- Kuis Pelatihan (untuk halaman hrd/learning/quizzes)
DO $$ BEGIN
INSERT INTO kuis_pelatihan (id, training_id, title, questions_count, pass_score, duration_minutes, status) VALUES
  ('kuis-01', 'trn-02', 'Evaluasi Pasca Pelatihan K3 Gudang',                10, 70, 20, 'Aktif'),
  ('kuis-02', 'trn-04', 'Evaluasi Penggunaan HRIS',                           8, 75, 15, 'Aktif'),
  ('kuis-03', 'trn-01', 'Pre-Test Sertifikasi PPJK',                         15, 65, 30, 'Draft'),
  ('kuis-04', 'trn-05', 'Evaluasi Workshop Negosiasi Klien',                  10, 70, 20, 'Draft')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'kuis_pelatihan: %', SQLERRM; END $$;

-- Materi Pelatihan (untuk halaman hrd/learning/materials)
DO $$ BEGIN
INSERT INTO materi_pelatihan (id, training_id, title, type, file_size) VALUES
  ('mat-01', 'trn-02', 'Modul K3 Gudang — Identifikasi Bahaya.pdf',           'PDF',  '3.2 MB'),
  ('mat-02', 'trn-02', 'Prosedur Bongkar Muat Aman.pdf',                      'PDF',  '2.8 MB'),
  ('mat-03', 'trn-02', 'Video Demonstrasi Penggunaan Forklift Aman.mp4',       'Video','128 MB'),
  ('mat-04', 'trn-04', 'Panduan Pengguna HRIS PT PGP.pdf',                    'PDF',  '5.1 MB'),
  ('mat-05', 'trn-04', 'Tutorial HRIS — Absensi & Cuti.mp4',                  'Video','85 MB'),
  ('mat-06', 'trn-01', 'Modul Regulasi Kepabeanan Terbaru 2026.pdf',          'PDF',  '4.7 MB'),
  ('mat-07', 'trn-01', 'Bank Soal Ujian Sertifikasi PPJK.pdf',                'PDF',  '2.1 MB'),
  ('mat-08', 'trn-05', 'Teknik Negosiasi Win-Win.pdf',                        'PDF',  '1.9 MB')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'materi_pelatihan: %', SQLERRM; END $$;

-- TNA (Training Needs Analysis) untuk halaman hrd/learning/tna
DO $$ BEGIN
INSERT INTO permintaan_pelatihan (id, department, skill_name, current_level, required_level, reason, status) VALUES
  ('tna-01', 'Operational Division', 'CEISA 4.0 — Pengajuan PIB/PEB Digital',  2, 4, 'Bea Cukai mengimplementasi CEISA 4.0 mulai Oktober 2026, seluruh staf PPJK wajib terlatih', 'Disetujui'),
  ('tna-02', 'Finance',              'SAP Finance Module',                      1, 3, 'Perusahaan akan migrasi ke SAP pada Q4 2026, staf Finance butuh pelatihan intensif',        'Pending'),
  ('tna-03', 'Semua Divisi',         'Keamanan Data & Cybersecurity Dasar',      1, 2, 'Peningkatan insiden phishing dan kebocoran data di industri logistik',                      'Pending'),
  ('tna-04', 'Operational Division', 'English for Business Communication',       2, 3, 'Ekspansi klien internasional membutuhkan kemampuan komunikasi Bahasa Inggris bisnis',       'Disetujui')
ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'permintaan_pelatihan TNA: %', SQLERRM; END $$;

-- Performance Framework (untuk hrd/performance/framework)
DO $$ BEGIN
INSERT INTO pengaturan_sistem (key, value, description) VALUES
  ('performance_framework', '{
    "review_periods": ["Tengah Tahun (H1)", "Akhir Tahun (H2)"],
    "rating_scale": [
      {"score": 5, "label": "Istimewa", "description": "Secara konsisten melampaui target dengan kontribusi luar biasa"},
      {"score": 4, "label": "Sangat Baik", "description": "Melampaui sebagian besar target dan ekspektasi"},
      {"score": 3, "label": "Baik", "description": "Memenuhi semua target dan ekspektasi"},
      {"score": 2, "label": "Perlu Perbaikan", "description": "Memenuhi sebagian target, ada area yang perlu ditingkatkan"},
      {"score": 1, "label": "Tidak Memuaskan", "description": "Tidak memenuhi sebagian besar target"}
    ],
    "weights": {"kpi": 40, "competency": 30, "behavior": 20, "attendance": 10},
    "calibration_enabled": true,
    "forced_distribution": {"top": 20, "good": 50, "average": 20, "below": 10}
  }', 'Konfigurasi framework manajemen kinerja perusahaan'),
  ('kpi_framework', '{
    "categories": ["Finansial", "Pelanggan", "Proses Internal", "Pembelajaran & Pertumbuhan"],
    "measurement_frequency": "Bulanan",
    "auto_reminder_days": 5,
    "escalation_days": 10
  }', 'Konfigurasi framework KPI perusahaan'),
  ('succession_settings', '{
    "min_successors_per_critical_role": 2,
    "readiness_levels": ["Ready Now", "Ready 1 Year", "Ready 2-3 Years", "In Development"],
    "talent_review_frequency": "Dua kali setahun (H1 & H2)",
    "nine_box_enabled": true
  }', 'Konfigurasi program suksesi perusahaan')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'pengaturan_sistem framework: %', SQLERRM; END $$;

-- Kompetisi Jabatan Links (untuk Competency Library > Required Level)
DO $$ BEGIN
-- Butuh jabatan_id dari tabel jabatan (demo-jab-ppjk dll dari 20260723001)
INSERT INTO kompetensi_jabatan (position_code, skill_id, required_level, jabatan_id) VALUES
  ('JAB-OPS-PPJK',    'sk-01', 4, 'demo-jab-ppjk'),
  ('JAB-OPS-PPJK2',   'sk-08', 3, 'demo-jab-ppjk'),
  ('JAB-OPS-PPJK3',   'sk-04', 3, 'demo-jab-ppjk'),
  ('JAB-OPS-CS',      'sk-04', 4, 'demo-jab-cs'),
  ('JAB-OPS-CS2',     'sk-03', 3, 'demo-jab-cs'),
  ('JAB-OPS-GDG',     'sk-02', 4, 'demo-jab-gudang'),
  ('JAB-OPS-GDG2',    'sk-05', 3, 'demo-jab-gudang'),
  ('JAB-OPS-GDG3',    'sk-07', 3, 'demo-jab-gudang'),
  ('JAB-HR-SPVSR',    'sk-09', 4, 'demo-jab-hrspv'),
  ('JAB-HR-SPVSR2',   'sk-05', 3, 'demo-jab-hrspv'),
  ('JAB-FIN-STAFF',   'sk-06', 4, 'demo-jab-finstaff'),
  ('JAB-FIN-STAFF2',  'sk-10', 3, 'demo-jab-finstaff'),
  ('JAB-HSE-OFF',     'sk-07', 5, 'demo-jab-hse'),
  ('JAB-HSE-OFF2',    'sk-04', 3, 'demo-jab-hse')
ON CONFLICT (position_code) DO UPDATE SET required_level = EXCLUDED.required_level, jabatan_id = EXCLUDED.jabatan_id;
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'kompetensi_jabatan links: %', SQLERRM; END $$;

-- ══════════════════════════════════════════════════════════════════════════
-- FINAL NOTICE
-- ══════════════════════════════════════════════════════════════════════════
DO $$ BEGIN
  RAISE NOTICE '=== SEED 20260810001 SELESAI ===';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '  tes_rekrutmen: 3 tes tulis (Procurement, Finance, HRD) + 2 psikotes (Leadership, Operasional)';
  RAISE NOTICE '  tes_rekrutmen: 2 tes terikat lowongan lok-01 (tulis + psikotes)';
  RAISE NOTICE '  pengguna applicant: 4 akun demo (password: password)';
  RAISE NOTICE '  pelamar: 1 pelamar baru untuk demo flow tes end-to-end';
  RAISE NOTICE '  kuis_pelatihan: 4 kuis evaluasi pelatihan';
  RAISE NOTICE '  materi_pelatihan: 8 materi pelatihan';
  RAISE NOTICE '  permintaan_pelatihan TNA: 4 kebutuhan pelatihan baru';
  RAISE NOTICE '  manpower validation_result: update rsdm-01';
  RAISE NOTICE '  pengaturan_sistem: performance & succession framework';
  RAISE NOTICE '  kompetensi_jabatan: linked ke jabatan_id';
END $$;
