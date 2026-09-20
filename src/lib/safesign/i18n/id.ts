import type { Dictionary } from "./dictionary";

export const id: Dictionary = {
  nativeName: "Bahasa Indonesia",
  dir: "ltr",
  tagline: "Aman Kerja",
  heroTitle: "Periksa kontrak kerja Anda sebelum menandatangani",
  heroSubtitle:
    "Tempelkan kontrak Anda dalam bahasa apa pun. Dapatkan ringkasan bahasa sederhana, peringatan klausul berbahaya, dan langkah selanjutnya — gratis, instan, tanpa pendaftaran.",
  howItWorksTitle: "Cara kerjanya",
  howItWorks: [
    "Unggah foto atau berkas kontrak Anda (atau tempel teksnya) — bahasa apa pun boleh.",
    "SafeSign membacanya dan memeriksanya terhadap daftar klausul eksploitasi yang sudah dikenal.",
    "Anda mendapat tingkat risiko, penjelasan bahasa sederhana, dan tempat mendapatkan bantuan nyata.",
  ],
  inputLabel: "Kontrak Anda",
  inputHint:
    "Foto kontraknya, unggah berkasnya (PDF, Word, foto), atau tempel teks kontrak di bawah. Bahasa apa pun boleh.",
  inputPlaceholder: "Tempelkan teks kontrak kerja Anda di sini (bahasa apa pun)…",
  charCount: "{n} karakter",
  uploadTitle: "Atau unggah kontrak Anda",
  uploadCamera: "Kamera",
  uploadPhoto: "Foto",
  uploadFile: "Berkas",
  uploadFormatsHint:
    "Foto (JPG/PNG), PDF, Word (.docx), atau TXT — boleh beberapa berkas atau halaman sekaligus.",
  uploadCloudHint:
    "Tips: dari pemilih berkas Anda juga bisa memilih berkas dari Google Drive, iCloud, OneDrive, atau dokumen WhatsApp.",
  uploadFromLink: "Impor dari tautan",
  linkPlaceholder: "Tempel tautan kontrak (Google Drive, Dropbox, atau tautan langsung)…",
  linkImport: "Impor",
  readingProgress: "Membaca halaman {n} dari {m}…",
  readingFile: "Membaca {name}…",
  orPasteDivider: "atau tempel teksnya sendiri",
  extractDone:
    "Teks berhasil dibaca dari {n} halaman dan sudah dimasukkan ke kotak di bawah — mohon periksa sebentar, lalu ketuk “Periksa kontrak saya”.",
  extractPartial:
    "Hanya {n} halaman pertama yang dibaca, agar pemeriksaan tetap cepat dan terarah.",
  ocrNoText:
    "Tidak ada teks yang terbaca dari foto. Coba lagi dengan foto yang lebih jelas, cukup cahaya, dan diambil tegak lurus dari atas halaman.",
  uploadFailed: "Berkas ini tidak dapat dibaca. Silakan coba lagi, atau tempel teksnya secara manual.",
  uploadUnsupported:
    "Jenis berkas ini tidak didukung. Gunakan foto (JPG/PNG), PDF, Word (.docx), atau TXT.",
  uploadTooLarge: "Berkas terlalu besar (maksimal 15 MB).",
  uploadTooMany:
    "Terlalu banyak berkas dipilih (maksimal {n}). Silakan unggah halaman-halaman terpenting saja.",
  linkInvalid:
    "Tautan ini tidak dapat digunakan. Gunakan tautan langsung ke berkasnya, atau tautan berbagi Google Drive / Dropbox.",
  linkFailed:
    "Berkas tidak dapat diunduh dari tautan ini. Pastikan tautannya publik (“siapa saja yang memiliki tautan”), atau unduh dulu berkasnya lalu unggah di sini.",
  uploadPrivacy:
    "Foto dan berkas hanya dipakai untuk membaca teksnya, pada sesi ini saja. Tidak ada yang disimpan.",
  trySample: "Coba contoh kontrak",
  clearButton: "Hapus",
  analyzeButton: "Periksa kontrak saya",
  analyzing: "Memeriksa kontrak Anda…",
  analyzingHint:
    "Biasanya memakan waktu 15–40 detik. SafeSign sedang membaca setiap klausul dengan teliti.",
  resultsTitle: "Hasil pemeriksaan kontrak",
  riskReasonLabel: "Alasannya",
  riskLow: "Risiko rendah",
  riskMedium: "Periksa dengan teliti",
  riskHigh: "Risiko tinggi — jangan tanda tangan tanpa bantuan",
  summaryTitle: "Ringkasan bahasa sederhana",
  redFlagsTitle: "Klausul berbahaya yang ditemukan",
  redFlagsCount: "{n} ditemukan",
  noRedFlags:
    "Tidak ada pola eksploitasi umum yang terdeteksi. Tetap baca semuanya dengan teliti sebelum menandatangani — pemeriksaan ini bukan jaminan.",
  clauseLabel: "Klausulnya",
  nextStepsTitle: "Langkah selanjutnya",
  chatTitle: "Tanya tentang kontrak Anda",
  chatSubtitle:
    "Ajukan pertanyaan lanjutan tentang kontrak ini atau hak Anda sebagai pekerja migran.",
  chatIntro:
    "Saya sudah membaca kontrak Anda dan hasil analisis di atas. Tanyakan apa saja — atau ketuk pertanyaan di bawah.",
  chatPlaceholder: "Tulis pertanyaan Anda…",
  chatSend: "Kirim",
  quickReplies: [
    "Apa artinya ini?",
    "Apakah ini berbahaya?",
    "Apa yang harus saya lakukan?",
    "Klausul mana yang sebaiknya saya negosiasi ulang?",
  ],
  chatTurnsLeft: "Sisa {n} pertanyaan di sesi ini",
  chatLimitReached:
    "Anda telah mencapai batas pertanyaan untuk sesi ini. Untuk bantuan lebih lanjut, silakan hubungi lembaga yang tercantum di bawah — gratis dan rahasia.",
  offTopicMessage:
    "Asisten ini hanya membantu soal kontrak kerja dan hak pekerja migran. Silakan ajukan pertanyaan yang terkait.",
  newAnalysis: "Periksa kontrak lain",
  errorTitle: "Terjadi kesalahan",
  errorEmpty: "Silakan tempelkan teks kontrak Anda terlebih dahulu.",
  errorTooLong:
    "Teksnya terlalu panjang. Silakan tempelkan bagian terpenting dari kontrak (maksimal sekitar 20.000 karakter).",
  errorGeneric:
    "SafeSign tidak dapat menganalisis kontrak saat ini. Silakan coba lagi sebentar lagi.",
  tryAgain: "Coba lagi",
  footerDisclaimerTitle: "Penting",
  footerDisclaimer:
    "SafeSign bukan firma hukum dan tidak memberikan nasihat hukum formal. Jika ragu, hubungi lembaga perlindungan pekerja migran negara Anda atau kedutaan Anda sebelum menandatangani.",
  privacyNote:
    "Tanpa pendaftaran. Teks Anda dianalisis hanya untuk sesi ini dan tidak disimpan.",
  resourcesTitle: "Bantuan nyata, tanpa biaya",
  poweredBy: "Alat gratis untuk pekerja migran & luar negeri di seluruh dunia",
};
