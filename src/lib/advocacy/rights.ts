// SafeSign Advokasi — Panduan Hak per negara penempatan + data SOS darurat.
// Angka bersifat INDIKATIF per 2025–2026 dan dapat berubah — selalu verifikasi
// ke sumber resmi / kedutaan. Ditampilkan dengan disclaimer di UI.

export interface RightsCountry {
  id: string;
  name: string;
  currency: string;
  minWage: string;
  workHours: string;
  restDays: string;
  leave: string;
  termination: string;
  protections: string[];
  hotlines: { label: string; value: string }[];
  notes?: string;
}

export const RIGHTS_COUNTRIES: RightsCountry[] = [
  {
    id: "Arab Saudi",
    name: "Arab Saudi",
    currency: "SAR (Riyal)",
    minWage: "Tidak ada upah minimum untuk pekerja rumah tangga; umumnya SAR 1.200–1.800/bln sesuai kontrak",
    workHours: "±10 jam/hari untuk pekerja rumah tangga (regulasi terbatas)",
    restDays: "1 hari/minggu (sering tidak dilaksanakan — catat bukti jika dilanggar)",
    leave: "Cuti tahunan umumnya 10–15 hari sesuai kontrak",
    termination: "Pemutusan kontrak umumnya dengan pemberitahuan 30 hari; tiket pulang tanggung jawab majikan",
    protections: [
      "Regulasi Pekerja Rumah Tangga 2013 (jam kerja, istirahat, larangan penahanan dokumen)",
      "Platform Musaned untuk rekrutmen resmi & pengaduan",
      "Konvensi ILO tentang kekerasan & pelecehan di dunia kerja (C190) sebagai rujukan internasional",
    ],
    hotlines: [
      { label: "Polisi / Darurat", value: "999" },
      { label: "Aman (kekerasan dalam rumah)", value: "1919" },
      { label: "KBRI Riyadh", value: "lihat kemlu.go.id" },
    ],
    notes: "Kafala telah direformasi sebagian (2019–2021), tapi penahanan paspor masih sering dilaporkan.",
  },
  {
    id: "Uni Emirat Arab",
    name: "Uni Emirat Arab",
    currency: "AED (Dirham)",
    minWage: "Tidak ada upah minimum nasional; praktik umum pekerja rumah tangga AED 2.000+/bln",
    workHours: "8 jam/hari, 48 jam/minggu (sektor formal)",
    restDays: "Minimal 1 hari/minggu",
    leave: "Cuti tahunan 30 hari setelah 1 tahun kerja",
    termination: "Pemberitahuan 30–90 hari sesuai masa kerja; kontrak standar MOHRE",
    protections: [
      "UU Pekerja Rumah Tangga Federal 2017 (hak cuti, gaji, akomodasi)",
      "Sistem perlindungan upah WPS (Wage Protection System)",
      "Asuransi kesehatan wajib",
    ],
    hotlines: [
      { label: "Darurat", value: "999" },
      { label: "MOHRE (tenaga kerja)", value: "600 590 000" },
    ],
  },
  {
    id: "Qatar",
    name: "Qatar",
    currency: "QAR (Riyal)",
    minWage: "QAR 1.000/bln + tunjangan makan QAR 500 + tempat tinggal QAR 300 (berlaku non-diskriminatif sejak 2021)",
    workHours: "Maks. 48 jam/minggu (10 jam/hari selama Ramadan untuk beberapa sektor)",
    restDays: "Minimal 1 hari/minggu berbayar",
    leave: "Cuti tahunan minimal 3 minggu",
    termination: "Pemberitahuan 1 bulan; larangan pemindahan kerja sudah dihapus (2020)",
    protections: [
      "UU No. 17/2020 — upah minimum non-diskriminatif untuk SEMUA pekerja termasuk rumah tangga",
      "Sistem WPS untuk upah; komite penyelesaian sengketa",
      "Reformasi kafala: izin keluar & perpindahan majikan tanpa persetujuan (NO Wajib)",
    ],
    hotlines: [
      { label: "Darurat", value: "999" },
      { label: "Pusat Kontak Pemerintah", value: "103" },
    ],
  },
  {
    id: "Kuwait",
    name: "Kuwait",
    currency: "KWD (Dinar)",
    minWage: "±KWD 75–100/bln untuk pekerja rumah tangga (indikatif)",
    workHours: "Maks. 10 jam/hari untuk pekerja rumah tangga (UU 2015)",
    restDays: "1 hari/minggu (wajib berbayar)",
    leave: "Cuti tahunan sesuai kontrak (umumnya 14–21 hari)",
    termination: "Pemberitahuan 15–30 hari; akhir kontrak wajib tiket pulang",
    protections: [
      "UU Pekerja Rumah Tangga 2015 (jam kerja, istirahat, akomodasi)",
      "PAM menerima pengaduan pekerja termasuk rumah tangga",
      "Larangan kerja di luar rumah majikan",
    ],
    hotlines: [
      { label: "Darurat", value: "112" },
      { label: "PAM", value: "128" },
    ],
  },
  {
    id: "Bahrain",
    name: "Bahrain",
    currency: "BHD (Dinar)",
    minWage: "±BHD 200–220/bln sektor formal (indikatif)",
    workHours: "8 jam/hari, 48 jam/minggu",
    restDays: "Minimal 1 hari/minggu",
    leave: "Cuti tahunan 21–30 hari",
    termination: "Pemberitahuan 30 hari; LMRA mengawasi pekerja asing",
    protections: [
      "Sistem jaminan sosial & gpo (Gulf Payment Online)",
      "LMRA menerima pengaduan dan memantau agen",
      "UU Anti-Traficking yang relatif kuat",
    ],
    hotlines: [
      { label: "Darurat", value: "999" },
      { label: "LMRA", value: "8000 8000" },
    ],
  },
  {
    id: "Oman",
    name: "Oman",
    currency: "OMR (Rial)",
    minWage: "±OMR 325/bln sektor formal (indikatif 2025)",
    workHours: "8–9 jam/hari, 45 jam/minggu",
    restDays: "Minimal 1 hari/minggu (Jumat umumnya)",
    leave: "Cuti tahunan 15–23 hari",
    termination: "Pemberitahuan 30 hari; end-of-service benefit",
    protections: [
      "Undang-undang ketenagakerjaan Oman berlaku untuk pekerja asing",
      "Larangan penahanan paspor (ditegakkan berjenjang)",
      "MOMR (kementerian tenaga kerja) menerima pengaduan",
    ],
    hotlines: [{ label: "Darurat", value: "9999" }],
  },
  {
    id: "Hong Kong",
    name: "Hong Kong",
    currency: "HKD (Dolar)",
    minWage: "±HKD 5.000/bln Minimum Allowable Wage untuk Foreign Domestic Helper (ditinjau tiap tahun)",
    workHours: "Tidak diatur maksimum untuk FDH — tunduk pada kontrak; masak/berbelanja sesuai tugas kontrak",
    restDays: "1 hari libur berbayar SETIAP minggu (wajib, 24 jam berturut-turut)",
    leave: "Cuti tahunan 7–14 hari setelah 1 tahun + 12 hari libur umum",
    termination: "1 bulan pemberitahuan atau ganti upah 1 bulan; FDH berhak ganti majikan di HK",
    protections: [
      "Standard Employment Contract (ID 407) — wajib & standar, tidak boleh disunting sepihak",
      "Food allowance (±HKD 1.200/bln) jika tidak menyediakan makanan",
      "Labour Department menangani klaim upah & kontrak; agen penempatan diatur ketat",
      "Larangan live-out bagi FDH (harus tinggal di rumah majikan)",
    ],
    hotlines: [
      { label: "Darurat", value: "999" },
      { label: "Labour Department", value: "+852 2717 1771" },
    ],
  },
  {
    id: "Taiwan",
    name: "Taiwan",
    currency: "TWD (Dollar)",
    minWage: "±NT$ 28.590/bln upah minimum (per 2025, ditinjau tahunan)",
    workHours: "8 jam/hari, 40 jam/minggu; lembur maks. 46 jam/bln dengan upah lembur 1,33–1,67×",
    restDays: "1 hari libur setiap 7 hari (contoh sistem workweek)",
    leave: "Cuti tahunan 3–30 hari sesuai masa kerja + 12 hari libur nasional",
    termination: "Pemberitahuan 10–30 hari; severance pay 0,5–1 bulan per tahun kerja",
    protections: [
      "Hotline 1955 khusus pekerja migran, dukungan Bahasa Indonesia",
      "Larangan agen memungut biaya di luar ketentuan (maks. terbatas)",
      "Program direct-hire (DHM) tanpa agen",
      "Asuransi kesehatan NHI wajib",
    ],
    hotlines: [
      { label: "Polisi", value: "110" },
      { label: "Ambulans", value: "119" },
      { label: "Hotline Pekerja Migran", value: "1955" },
    ],
  },
  {
    id: "Korea Selatan",
    name: "Korea Selatan",
    currency: "KRW (Won)",
    minWage: "±KRW 2,1 juta/bln upah minimum (2026, naik tiap tahun)",
    workHours: "40 jam/minggu + lembur maks. 12 jam/minggu, upah lembur 1,5×",
    restDays: "1 hari libur berbayar per minggu",
    leave: "Cuti tahunan 15 hari setelah 1 tahun (berkurang proporsional untuk pekerja pendek)",
    termination: "Perlu alasan yang sah; severance pay ±1 bulan per tahun kerja",
    protections: [
      "Sistem EPS (izin kerja non-dokumen) + permit perpindahan majikan (change of workplace)",
      "Hotline EPS 1350 dengan penerjemah Bahasa Indonesia",
      "Jaminan upah tertunggak (wage claim guarantee) dari pemerintah",
      "Asuransi kecelakaan kerja & kesehatan wajib (4 asuransi)",
    ],
    hotlines: [
      { label: "Polisi", value: "112" },
      { label: "Ambulans/Api", value: "119" },
      { label: "EPS Help Center", value: "1350" },
    ],
  },
  {
    id: "Jepang",
    name: "Jepang",
    currency: "JPY (Yen)",
    minWage: "±¥ 1.050/jam rata-rata nasional (berbeda per prefektur, naik tiap tahun)",
    workHours: "8 jam/hari, 40 jam/minggu; lembur maks. 45 jam/bln dengan upah +25%",
    restDays: "Minimal 1 hari/minggu atau 4 hari per 4 minggu",
    leave: "Cuti tahunan 10 hari setelah 6 bulan (naik hingga 20 hari)",
    termination: "Perlu alasan objektif & wajar (doktrin penyalahgunaan pemutusan)",
    protections: [
      "Visa SSW (Tokutei Ginou) — bisa berganti majikan dalam sektor sama, tanpa agen",
      "Undang-undang kerja berlaku sama untuk pekerja asing (gaji, asuransi, lembur)",
      "Konsultasi tenaga kerja multibahasa (support center)",
      "Larangan diskriminasi berbasis kewarganegaraan",
    ],
    hotlines: [
      { label: "Polisi", value: "110" },
      { label: "Ambulans/Api", value: "119" },
    ],
  },
  {
    id: "Malaysia",
    name: "Malaysia",
    currency: "MYR (Ringgit)",
    minWage: "RM 1.700/bln upah minimum (sejak Feb 2025, sebagian kota RM 1.900)",
    workHours: "8 jam/hari, 45 jam/minggu; lembur 1,5× pada hari kerja",
    restDays: "1 hari istirahat berbayar per minggu",
    leave: "Cuti tahunan 8–16 hari + cuti sakit 14–18 hari",
    termination: "Pemberitahuan 4–8 minggu sesuai masa kerja; indemnity jika tanpa alasan sah",
    protections: [
      "Akta Ketenagakerjaan 1955 (direvisi 2022) — berlaku pekerja lokal & asing",
      "Jabatan Tenaga Kerja (JTK) menangani klaim upah",
      "Larangan agen memungut biaya dari pekerja (biaya tanggung majikan)",
      "Program Pekerja Rumah Tangga Asing (PRA) — kontrak berstandar",
    ],
    hotlines: [
      { label: "Darurat", value: "999" },
      { label: "JTK (tenaga kerja)", value: "03-8886 2356" },
    ],
  },
  {
    id: "Singapura",
    name: "Singapura",
    currency: "SGD (Dollar)",
    minWage: "Tidak ada upah minimum umum; MDW diatur dengan kriteria gaji & jaminan (umumnya SGD 550–800/bln untuk pekerja rumah tangga)",
    workHours: "8–9 jam/hari sektor formal; MDW tunduk aturan istirahat (lihat rest days)",
    restDays: "MDW: 1 hari libur per minggu (kompensasi hanya dengan persetujuan tertulis)",
    leave: "Cuti tahunan 7–14 hari + cuti sakit; MDW punya hak serupa di UU EFMA",
    termination: "Pemberitahuan 1 hari–1 bulan sesuai kontrak; MDW dilindungi UU EFMA",
    protections: [
      "Akta Pekerja Migran Rumah Tangga (EFMA) — hak istirahat, gaji, makanan",
      "MOM menangani klaim gaji (salary claims via TADM) dengan cepat & gratis",
      "Asuransi medis wajib untuk MDW (≥SGD 15.000/tahun)",
      "Larangan penahanan dokumen & penyalahgunaan deposito keamanan",
    ],
    hotlines: [
      { label: "Darurat", value: "999" },
      { label: "MOM", value: "+65 6438 5122" },
    ],
  },
];

export function getRightsCountry(id: string): RightsCountry | undefined {
  return RIGHTS_COUNTRIES.find((c) => c.id === id);
}

/* ---------- SOS Darurat ---------- */

export const SOS_INDONESIA = [
  {
    label: "BP2MI / KemenP2MI — Layanan Pengaduan PMI",
    detail: "WhatsApp 154 (dalam negeri) · gratis & 24 jam",
    href: "https://wa.me/6281215455005",
    icon: "message",
  },
  {
    label: "Kemenlu RI — Hotline WNI 24 Jam",
    detail: "+62 812-9000-9070 (telepon / WhatsApp)",
    href: "tel:+6281290009070",
    icon: "phone",
  },
] as const;

export const SOS_CHECKLIST = [
  "Nama lengkap & tanggal lahir Anda",
  "Nomor paspor / identitas lain",
  "Nama & alamat lengkap majikan atau tempat kerja",
  "Nama agen / P3MI yang mengirim Anda",
  "Kronologi singkat: sejak kapan masalah terjadi",
  "Foto/dokumen pendukung yang tersisa (kontrak, slip gaji, chat)",
];

export const SOS_STEPS = [
  {
    title: "1. Pastikan Anda aman dulu",
    desc: "Jika dalam bahaya fisik langsung, hubungi nomor darurat lokal di bawah ATAU pindah ke tempat aman (tetangga, toko, masjid/gereja terdekat) sebelum menelepon.",
  },
  {
    title: "2. Hubungi hotline Indonesia",
    desc: "BP2MI (WhatsApp 154) dan Kemenlu (+62 812-9000-9070) melayani 24 jam. Sampaikan identitas + lokasi + masalah secara singkat dan jelas.",
  },
  {
    title: "3. Simpan bukti",
    desc: "Foto semua dokumen (kontrak, paspor, slip gaji) dan simpan di tempat aman / kirim ke keluarga. Jangan serahkan satu-satunya salinan kepada siapa pun.",
  },
  {
    title: "4. Buat laporan terdokumentasi",
    desc: "Gunakan fitur Buat Laporan di modul ini agar bantuan terstruktur, terlacak, dan AI dapat menyusun email resmi ke lembaga yang berwenang.",
  },
];
