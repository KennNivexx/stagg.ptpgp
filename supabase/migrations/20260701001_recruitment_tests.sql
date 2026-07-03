-- ============================================================
-- Tes Rekrutmen Online + Kolom Tambahan + Template Soal
-- ============================================================

-- Tabel soal tes rekrutmen
CREATE TABLE IF NOT EXISTS recruitment_tests (
  id TEXT PRIMARY KEY DEFAULT 'test-' || gen_random_uuid()::text,
  job_posting_id TEXT,
  test_type TEXT NOT NULL DEFAULT 'tulis',
  title TEXT NOT NULL,
  instructions TEXT,
  questions JSONB NOT NULL DEFAULT '[]',
  duration_minutes INTEGER DEFAULT 60,
  passing_score INTEGER DEFAULT 70,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolom hasil tes di tabel applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS test_tulis_result JSONB,
  ADD COLUMN IF NOT EXISTS test_psikotes_result JSONB,
  ADD COLUMN IF NOT EXISTS offered_salary INTEGER,
  ADD COLUMN IF NOT EXISTS salary_expectation INTEGER,
  ADD COLUMN IF NOT EXISTS final_salary INTEGER,
  ADD COLUMN IF NOT EXISTS negotiation_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS negotiation_notes TEXT;

-- Status PTKP di struktur gaji (untuk PPh 21 otomatis)
-- Pakai DO block supaya tidak error kalau tabel belum ada
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'salary_structures') THEN
    ALTER TABLE salary_structures ADD COLUMN IF NOT EXISTS ptkp_status TEXT DEFAULT 'TK/0';
  END IF;
END $$;

-- ============================================================
-- Template tes — aman dijalankan berkali-kali
-- ============================================================

INSERT INTO recruitment_tests (
  id, job_posting_id, test_type, title, instructions,
  questions, duration_minutes, passing_score, is_active, created_at
)
VALUES
(
  'tmpl-tulis-forwarding',
  NULL,
  'tulis',
  'Tes Pengetahuan Freight Forwarding',
  'Bacalah setiap soal dengan teliti. Pilih satu jawaban yang paling tepat. Waktu pengerjaan 60 menit. Nilai kelulusan minimal 70.',
  '[
    {"id":"t01","text":"Apa kepanjangan dari PPJK dalam kegiatan kepabeanan Indonesia?","type":"pilihan_ganda","options":["Perusahaan Pengurusan Jasa Kepabeanan","Pengusaha Pengurusan Jasa Kepabeanan","Pusat Pengelolaan Jasa Kepabeanan","Petugas Pengurusan Jasa Kepabeanan"],"correct_answer":"B","points":5},
    {"id":"t02","text":"Dokumen utama pengiriman barang melalui jalur laut yang diterbitkan oleh shipping line disebut...","type":"pilihan_ganda","options":["Airway Bill","Bill of Lading","Delivery Order","Surat Jalan"],"correct_answer":"B","points":5},
    {"id":"t03","text":"PIB adalah singkatan dari...","type":"pilihan_ganda","options":["Pemberitahuan Impor Barang","Permohonan Impor Barang","Pemberitahuan Importir Baru","Pemberitahuan Impor Beacukai"],"correct_answer":"A","points":5},
    {"id":"t04","text":"PEB adalah dokumen yang digunakan untuk...","type":"pilihan_ganda","options":["Memberitahukan rencana impor barang","Memberitahukan kegiatan ekspor barang kepada Bea Cukai","Mengajukan permohonan bea masuk","Mendaftarkan perusahaan ekspor"],"correct_answer":"B","points":5},
    {"id":"t05","text":"Istilah FOB (Free On Board) dalam Incoterms berarti...","type":"pilihan_ganda","options":["Penjual menanggung semua biaya termasuk asuransi sampai tujuan","Risiko berpindah ke pembeli saat barang melewati pagar kapal di pelabuhan muat","Pembeli mengambil barang langsung di gudang penjual","Penjual menanggung biaya freight sampai pelabuhan tujuan"],"correct_answer":"B","points":5},
    {"id":"t06","text":"CIF dalam Incoterms singkatan dari...","type":"pilihan_ganda","options":["Cost, Invoice, Freight","Clearance, Insurance, Freight","Cost, Insurance, Freight","Cost, Import, Free"],"correct_answer":"C","points":5},
    {"id":"t07","text":"Packing List berfungsi untuk...","type":"pilihan_ganda","options":["Menyatakan nilai barang untuk perhitungan bea masuk","Merincikan isi, jumlah, dan berat setiap kemasan barang","Membuktikan negara asal barang","Mengajukan asuransi pengiriman"],"correct_answer":"B","points":5},
    {"id":"t08","text":"Certificate of Origin (COO/SKA) berfungsi sebagai...","type":"pilihan_ganda","options":["Sertifikat kualitas produk dari lembaga pengujian","Dokumen yang menyatakan negara asal barang","Izin ekspor yang dikeluarkan Kementerian Perdagangan","Sertifikat asuransi pengiriman barang"],"correct_answer":"B","points":5},
    {"id":"t09","text":"Delivery Order (DO) dalam proses impor dikeluarkan oleh...","type":"pilihan_ganda","options":["Bea dan Cukai","Importir","Shipping line atau agen pelayaran","Freight forwarder"],"correct_answer":"C","points":5},
    {"id":"t10","text":"EXW (Ex Works) dalam Incoterms berarti...","type":"pilihan_ganda","options":["Penjual menanggung semua biaya hingga pelabuhan tujuan","Pembeli mengambil sendiri barang di tempat/gudang penjual","Penjual menanggung biaya freight saja","Barang diserahkan di pelabuhan muat"],"correct_answer":"B","points":5},
    {"id":"t11","text":"Barang yang masuk kategori larangan terbatas (lartas) adalah...","type":"pilihan_ganda","options":["Barang yang sama sekali dilarang masuk ke Indonesia","Barang yang bebas bea masuk","Barang yang memerlukan izin atau dokumen khusus untuk diimpor/diekspor","Barang yang hanya boleh diimpor oleh BUMN"],"correct_answer":"C","points":5},
    {"id":"t12","text":"Airway Bill (AWB) digunakan untuk pengiriman melalui...","type":"pilihan_ganda","options":["Jalur laut","Jalur darat","Jalur udara","Jalur kereta"],"correct_answer":"C","points":5},
    {"id":"t13","text":"Dasar perhitungan bea masuk barang impor adalah...","type":"pilihan_ganda","options":["Harga FOB x tarif bea masuk","Harga CIF x tarif bea masuk","Berat barang x tarif bea masuk","Harga EXW x tarif bea masuk"],"correct_answer":"B","points":5},
    {"id":"t14","text":"Jalur Hijau dalam proses kepabeanan berarti...","type":"pilihan_ganda","options":["Jalur khusus barang berbahaya dan beracun","Importasi yang langsung keluar tanpa pemeriksaan fisik barang","Jalur untuk barang organik bersertifikat","Jalur untuk importir yang baru pertama kali mengimpor"],"correct_answer":"B","points":5},
    {"id":"t15","text":"House Bill of Lading (HBL) diterbitkan oleh...","type":"pilihan_ganda","options":["Shipping line","Bea dan Cukai","PPJK / Freight forwarder","Importir"],"correct_answer":"C","points":5},
    {"id":"t16","text":"LCL (Less than Container Load) adalah layanan pengiriman...","type":"pilihan_ganda","options":["Satu kontainer penuh milik satu pengirim","Penggabungan muatan beberapa pengirim dalam satu kontainer","Pengiriman barang ukuran besar melebihi kapasitas kontainer","Pengiriman barang melalui udara"],"correct_answer":"B","points":5},
    {"id":"t17","text":"Dokumen yang wajib disertakan saat pengajuan PIB antara lain...","type":"pilihan_ganda","options":["Hanya Bill of Lading","Hanya Commercial Invoice","Invoice, Packing List, Bill of Lading, dan dokumen pendukung lainnya sesuai jenis barang","Hanya Packing List dan Delivery Order"],"correct_answer":"C","points":5},
    {"id":"t18","text":"Fungsi utama perusahaan freight forwarding adalah...","type":"pilihan_ganda","options":["Memproduksi barang untuk keperluan ekspor","Mengatur dan mengurus pengiriman barang atas nama eksportir atau importir","Menjamin keamanan barang di gudang berikat","Menetapkan tarif bea cukai bersama pemerintah"],"correct_answer":"B","points":5},
    {"id":"t19","text":"Dalam proses customs clearance, PPJK bertindak atas nama...","type":"pilihan_ganda","options":["Pemerintah dan Bea Cukai","Importir atau eksportir yang memberikan kuasa","Shipping line","Bank penerbit L/C"],"correct_answer":"B","points":5},
    {"id":"t20","text":"Dokumen Letter of Credit (L/C) diterbitkan oleh...","type":"pilihan_ganda","options":["Eksportir","Importir","Bank atas permintaan importir","Bea Cukai"],"correct_answer":"C","points":5}
  ]'::jsonb,
  60,
  70,
  true,
  NOW()
),
(
  'tmpl-psikotes-umum',
  NULL,
  'psikotes',
  'Tes Psikologi (Psikotes)',
  'Bacalah setiap pernyataan dan pilih jawaban yang paling menggambarkan diri Anda secara jujur. Tidak ada jawaban benar atau salah. Pilih dari skala 1 (Sangat Tidak Setuju) hingga 5 (Sangat Setuju).',
  '[
    {"id":"p01","text":"Saya selalu jujur meskipun kebenaran tersebut tidak menyenangkan bagi saya maupun orang lain.","type":"skala","dimension":"Integritas","reverse":false},
    {"id":"p02","text":"Saya mengakui kesalahan yang saya buat kepada atasan tanpa ragu-ragu.","type":"skala","dimension":"Integritas","reverse":false},
    {"id":"p03","text":"Saya tetap bekerja dengan sungguh-sungguh meskipun tidak ada yang mengawasi saya.","type":"skala","dimension":"Integritas","reverse":false},
    {"id":"p04","text":"Saya lebih memilih mengambil jalan pintas daripada mengikuti prosedur yang berlaku.","type":"skala","dimension":"Integritas","reverse":true},
    {"id":"p05","text":"Kepercayaan yang diberikan orang lain kepada saya adalah tanggung jawab yang saya jaga dengan baik.","type":"skala","dimension":"Integritas","reverse":false},
    {"id":"p06","text":"Saya sulit berterus terang jika melakukan kesalahan karena takut dihukum.","type":"skala","dimension":"Integritas","reverse":true},
    {"id":"p07","text":"Saya senang membantu rekan kerja yang mengalami kesulitan dalam pekerjaannya.","type":"skala","dimension":"Kerjasama Tim","reverse":false},
    {"id":"p08","text":"Saya lebih suka menyelesaikan pekerjaan sendiri daripada berkolaborasi dengan tim.","type":"skala","dimension":"Kerjasama Tim","reverse":true},
    {"id":"p09","text":"Saya menghargai pendapat rekan kerja meskipun berbeda dengan pandangan saya.","type":"skala","dimension":"Kerjasama Tim","reverse":false},
    {"id":"p10","text":"Saya bersedia menempatkan kepentingan tim di atas kepentingan pribadi demi hasil yang lebih baik.","type":"skala","dimension":"Kerjasama Tim","reverse":false},
    {"id":"p11","text":"Saya merasa terganggu ketika harus membagi tanggung jawab dengan orang lain.","type":"skala","dimension":"Kerjasama Tim","reverse":true},
    {"id":"p12","text":"Saya dapat menyesuaikan diri dengan cepat ketika ditempatkan di lingkungan kerja yang baru.","type":"skala","dimension":"Adaptasi","reverse":false},
    {"id":"p13","text":"Perubahan mendadak di tempat kerja membuat saya stres dan sulit berkonsentrasi.","type":"skala","dimension":"Adaptasi","reverse":true},
    {"id":"p14","text":"Saya terbuka menerima cara-cara baru dalam menyelesaikan pekerjaan.","type":"skala","dimension":"Adaptasi","reverse":false},
    {"id":"p15","text":"Saya merasa nyaman menghadapi tantangan dan situasi yang tidak terduga.","type":"skala","dimension":"Adaptasi","reverse":false},
    {"id":"p16","text":"Saya mengalami kesulitan ketika harus mempelajari hal baru dalam waktu yang singkat.","type":"skala","dimension":"Adaptasi","reverse":true},
    {"id":"p17","text":"Saya selalu berusaha menyelesaikan pekerjaan dengan hasil melebihi target yang ditetapkan.","type":"skala","dimension":"Orientasi Hasil","reverse":false},
    {"id":"p18","text":"Saya tidak mudah menyerah ketika menghadapi hambatan dalam pekerjaan.","type":"skala","dimension":"Orientasi Hasil","reverse":false},
    {"id":"p19","text":"Saya cenderung menunda-nunda pekerjaan yang saya anggap sulit atau membosankan.","type":"skala","dimension":"Orientasi Hasil","reverse":true},
    {"id":"p20","text":"Saya merasa puas dan termotivasi ketika berhasil mencapai tujuan yang sudah ditetapkan.","type":"skala","dimension":"Orientasi Hasil","reverse":false},
    {"id":"p21","text":"Kualitas hasil pekerjaan adalah prioritas utama saya, bukan sekadar menyelesaikannya.","type":"skala","dimension":"Orientasi Hasil","reverse":false},
    {"id":"p22","text":"Saya dapat menyampaikan ide dan gagasan saya dengan jelas kepada orang lain.","type":"skala","dimension":"Komunikasi","reverse":false},
    {"id":"p23","text":"Saya mendengarkan dengan penuh perhatian ketika orang lain sedang berbicara.","type":"skala","dimension":"Komunikasi","reverse":false},
    {"id":"p24","text":"Saya sering salah memahami instruksi yang diberikan oleh atasan atau rekan kerja.","type":"skala","dimension":"Komunikasi","reverse":true},
    {"id":"p25","text":"Saya merasa nyaman menyampaikan pendapat atau presentasi di hadapan banyak orang.","type":"skala","dimension":"Komunikasi","reverse":false}
  ]'::jsonb,
  45,
  0,
  true,
  NOW()
)
ON CONFLICT (id) DO NOTHING;
