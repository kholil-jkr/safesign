// Seed SafeSign Manajemen — users, contracts, approvals, versions, templates.
// Run: bunx bun scripts/seed.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

const ANALYSIS_HIGH = {
  risk_level: "high",
  risk_reason:
    "Ditemukan beberapa klausul yang sangat merugikan pekerja: gaji ditahan oleh majikan, paspor disimpan oleh pihak ketiga, dan denda terminasi yang timpang.",
  summary:
    "Perjanjian kerja ini menempatkan pekerja dalam posisi rentan: upah disalurkan melalui majikan dengan potongan tidak rinci, paspor ditahan, dan jam kerja melebihi batas wajar tanpa kompensasi lembur yang jelas.",
  red_flags: [
    { clause: "Pasal 4 ayat 2", explanation: "Gaji ditahan 2 bulan pertama sebagai 'jaminan disiplin' — praktik yang dilarang dan berpotensi perbudakan utang." },
    { clause: "Pasal 7", explanation: "Paspor dan dokumen identitas disimpan oleh agensi — melanggar prinsip kebebasan bergerak." },
    { clause: "Pasal 11", explanation: "Jam kerja 12 jam/hari tanpa rincian upah lembur yang jelas." },
  ],
  next_steps:
    "1. Minta rincian potongan gaji secara tertulis. 2. Tolak penahanan paspor — minta klausul dihapus. 3. Konsultasikan dengan BP2MI sebelum menandatangani.",
  disclaimer:
    "Analisis ini bersifat informatif dan bukan nasihat hukum profesional. Selalu konsultasikan dengan lembaga resmi sebelum menandatangani kontrak.",
};

const ANALYSIS_MEDIUM = {
  risk_level: "medium",
  risk_reason:
    "Kontrak ini relatif wajar, namun terdapat klausul auto-renewal dan batasan tanggung jawab yang perlu diperhatikan.",
  summary:
    "Perjanjian kerja dengan perlindungan dasar yang memadai. Perhatikan klausul perpanjangan otomatis dan pembatasan tanggung jawab pihak penyedia.",
  red_flags: [
    { clause: "Pasal 14", explanation: "Perpanjangan otomatis 12 bulan jika tidak dibatalkan 60 hari sebelum berakhir — risiko terikat lebih lama dari yang diinginkan." },
  ],
  next_steps: "Catat tanggal H-60 untuk evaluasi perpanjangan. Negosiasikan klausul pembatasan tanggung jawab.",
  disclaimer: "Analisis ini bersifat informatif dan bukan nasihat hukum profesional.",
};

const ANALYSIS_LOW = {
  risk_level: "low",
  risk_reason: "Tidak ditemukan klausul yang merugikan secara signifikan.",
  summary: "Kontrak standar dengan keseimbangan kewajiban yang wajar antara para pihak.",
  red_flags: [],
  next_steps: "Pantau tanggal jatuh tempo dan lakukan evaluasi rutin 30 hari sebelum berakhir.",
  disclaimer: "Analisis ini bersifat informatif dan bukan nasihat hukum profesional.",
};

  const DEMO = process.env.SEED_DEMO === "1";
  console.log(DEMO ? "Seeding basis + DATA DEMO…" : "Seeding basis (template saja)…");

async function main() {
  console.log("Seeding…");

  // wipe in FK-safe order
  await db.signature.deleteMany();
  await db.approval.deleteMany();
  await db.contractVersion.deleteMany();
  await db.contract.deleteMany();
  await db.template.deleteMany();
  if (DEMO) await db.user.deleteMany(); // user asli tidak disentuh saat seed basis

  if (DEMO) {

      const users = {
        admin: await db.user.create({ data: { email: "budi@safesign.id", name: "Budi Santoso", role: "admin" } }),
        legal: await db.user.create({ data: { email: "sari@safesign.id", name: "Sari Wulandari", role: "legal" } }),
        manager: await db.user.create({ data: { email: "agus@safesign.id", name: "Agus Pratama", role: "manager" } }),
        staff: await db.user.create({ data: { email: "rina@safesign.id", name: "Rina Melati", role: "staff" } }),
      };

      type C = {
        title: string; contractNo: string; partyA: string; partyB: string;
        start: number; end: number; value: number; category: string; tags: string;
        status: string; risk?: string; analysis?: object; source?: string; autoRenew?: boolean;
        notes?: string; createdBy: string;
        approvals?: { step: number; role: string; name?: string; status: string; note?: string }[];
      };

      const contracts: C[] = [
        {
          title: "PKWT Penempatan Pekerja Migran — Arab Saudi (Domestic Worker)",
          contractNo: "PKWT/2025/SA-041", partyA: "PT Mitra Jaya Abadi", partyB: "Siti Aminah",
          start: -340, end: 20, value: 42000000, category: "employment", tags: "pekerja migran,tkw,saudi",
          status: "approved", risk: "high", analysis: ANALYSIS_HIGH, source: "photo",
          autoRenew: false, notes: "Kontrak penempatan rumah tangga. Perlu perhatian khusus pada klausul penahanan paspor.",
          createdBy: users.staff.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved", note: "Sesuai budget penempatan." },
            { step: 2, role: "legal", name: "Sari Wulandari", status: "approved", note: "Revisi pasal 7 sudah masuk." },
          ],
        },
        {
          title: "Perjanjian Kerja — Domestic Helper Hong Kong",
          contractNo: "HK/2025/DH-112", partyA: "PT Mitra Jaya Abadi", partyB: "Maria Lourdes",
          start: -290, end: 75, value: 38500000, category: "employment", tags: "pekerja migran,hongkong",
          status: "approved", risk: "medium", analysis: ANALYSIS_MEDIUM, source: "file",
          autoRenew: true, createdBy: users.staff.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved" },
            { step: 2, role: "legal", name: "Sari Wulandari", status: "approved", note: "Auto-renewal diperhatikan." },
          ],
        },
        {
          title: "Kontrak Sewa Ruko — Jl. Sudirman No. 45",
          contractNo: "Sewa/2024/RK-08", partyA: "PT Mitra Jaya Abadi", partyB: "H. Rahman Wijaya",
          start: -720, end: 8, value: 96000000, category: "lease", tags: "sewa,ruko,kantor",
          status: "approved", risk: "low", analysis: ANALYSIS_LOW, source: "file",
          createdBy: users.admin.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved" },
            { step: 2, role: "legal", name: "Sari Wulandari", status: "approved" },
          ],
        },
        {
          title: "Perjanjian Kerja Sama Vendor — Cleaning Service Kantor Pusat",
          contractNo: "Vendor/2025/CS-19", partyA: "PT Mitra Jaya Abadi", partyB: "CV Bersih Prima",
          start: -215, end: 150, value: 132000000, category: "vendor", tags: "vendor,fasilitas",
          status: "approved", risk: "low", source: "cloud",
          createdBy: users.manager.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved" },
            { step: 2, role: "legal", name: "Sari Wulandari", status: "approved" },
          ],
        },
        {
          title: "NDA — Kolaborasi Produk Digital dengan PT Sumber Makmur",
          contractNo: "NDA/2025/SM-03", partyA: "PT Mitra Jaya Abadi", partyB: "PT Sumber Makmur Sejahtera",
          start: -100, end: 635, value: 0, category: "nda", tags: "kerahasiaan,kolaborasi",
          status: "approved", risk: "low", source: "file",
          createdBy: users.legal.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved" },
            { step: 2, role: "legal", name: "Sari Wulandari", status: "approved" },
          ],
        },
        {
          title: "Perjanjian Penempatan Pekerja Migran — Jepang (Tokutei Ginou)",
          contractNo: "JP/2025/TG-77", partyA: "PT Mitra Jaya Abadi", partyB: "Ahmad Fauzi",
          start: -165, end: 200, value: 78000000, category: "employment", tags: "pekerja migran,jepang,ssw",
          status: "approved", risk: "medium", analysis: ANALYSIS_MEDIUM, source: "camera",
          autoRenew: true, createdBy: users.staff.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved" },
            { step: 2, role: "legal", name: "Sari Wulandari", status: "approved" },
          ],
        },
        {
          title: "Kontrak Pengadaan ATK & Consumable Tahunan",
          contractNo: "Vendor/2025/ATK-02", partyA: "PT Mitra Jaya Abadi", partyB: "PT Kantor Lengkap Indonesia",
          start: -310, end: 55, value: 45000000, category: "vendor", tags: "vendor,atk,pengadaan",
          status: "approved", risk: "low", source: "cloud",
          createdBy: users.manager.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved" },
            { step: 2, role: "legal", name: "Sari Wulandari", status: "approved" },
          ],
        },
        {
          title: "Perjanjian Kerja — Pabrik Elektronik Malaysia (Johor)",
          contractNo: "MY/2024/EL-156", partyA: "PT Mitra Jaya Abadi", partyB: "Dewi Lestari",
          start: -560, end: -15, value: 36000000, category: "employment", tags: "pekerja migran,malaysia,pabrik",
          status: "approved", risk: "high", analysis: ANALYSIS_HIGH, source: "photo",
          createdBy: users.staff.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved" },
            { step: 2, role: "legal", name: "Sari Wulandari", status: "approved" },
          ],
        },
        {
          title: "Kontrak Jasa Maintenance IT & Dukungan Sistem",
          contractNo: "Jasa/2025/IT-11", partyA: "PT Mitra Jaya Abadi", partyB: "PT Teknologi Andalan",
          start: -120, end: 245, value: 84000000, category: "service", tags: "jasa,it,maintenance",
          status: "pending_approval", risk: "medium", analysis: ANALYSIS_MEDIUM, source: "file",
          createdBy: users.staff.id,
          approvals: [
            { step: 1, role: "manager", name: "Agus Pratama", status: "approved", note: "Lanjut review legal." },
            { step: 2, role: "legal", status: "pending" },
          ],
        },
        {
          title: "Kontrak Kerja Sama Pelatihan Bahasa Jepang",
          contractNo: "Jasa/2025/BJ-05", partyA: "PT Mitra Jaya Abadi", partyB: "Yayasan Bunga Sakura",
          start: -60, end: 305, value: 28000000, category: "service", tags: "jasa,pelatihan,bahasa",
          status: "rejected", risk: "high", analysis: ANALYSIS_HIGH, source: "manual",
          notes: "Ditolak: struktur pembayaran tidak jelas & klausul denda berat.",
          createdBy: users.staff.id,
          approvals: [
            { step: 1, role: "manager", status: "rejected", name: "Agus Pratama", note: "Skema pembayaran 100% di muka tidak wajar." },
          ],
        },
        {
          title: "PKWT Penempatan — Perawat Lansia Taiwan",
          contractNo: "PKWT/2026/TW-001", partyA: "PT Mitra Jaya Abadi", partyB: "Nur Halimah",
          start: 30, end: 755, value: 66000000, category: "employment", tags: "pekerja migran,taiwan,perawat",
          status: "draft", source: "file",
          createdBy: users.staff.id,
        },
        {
          title: "Perjanjian Sewa Server & Cloud Hosting",
          contractNo: "Jasa/2026/CL-004", partyA: "PT Mitra Jaya Abadi", partyB: "Cloud Nusantara Data",
          start: 14, end: 379, value: 54000000, category: "service", tags: "jasa,cloud,infrastruktur",
          status: "draft", source: "manual",
          createdBy: users.admin.id,
        },
      ];

      for (const c of contracts) {
        const contract = await db.contract.create({
          data: {
            title: c.title,
            contractNo: c.contractNo,
            partyA: c.partyA,
            partyB: c.partyB,
            startDate: daysFromNow(c.start),
            endDate: daysFromNow(c.end),
            value: c.value,
            currency: "IDR",
            category: c.category,
            tags: c.tags,
            status: c.status,
            riskLevel: c.risk ?? null,
            analysisJson: c.analysis ? JSON.stringify(c.analysis) : null,
            contentText: null,
            sourceType: c.source ?? null,
            autoRenew: c.autoRenew ?? false,
            notes: c.notes ?? null,
            createdById: c.createdBy,
            remindersJson: JSON.stringify([90, 60, 30, 7]),
            ackedJson: JSON.stringify([]),
          },
        });
        // version 1
        await db.contractVersion.create({
          data: {
            contractId: contract.id,
            version: 1,
            title: c.title,
            contentText: null,
            snapshotJson: JSON.stringify({ status: c.status, value: c.value }),
            changeNote: "Kontrak dibuat (impor awal)",
            editedBy: "Sistem",
          },
        });
        if (c.approvals?.length) {
          for (const a of c.approvals) {
            await db.approval.create({
              data: {
                contractId: contract.id,
                step: a.step,
                approverRole: a.role,
                approverName: a.name ?? null,
                status: a.status,
                note: a.note ?? null,
                decidedAt: a.status === "pending" ? null : daysFromNow(-Math.abs(10 - a.step * 3)),
              },
            });
          }
        }
        // sample signature on a couple of approved contracts
        if (c.status === "approved" && c.category === "lease") {
          await db.signature.create({
            data: {
              contractId: contract.id,
              signerName: "H. Rahman Wijaya",
              signerRole: "party_b",
              signatureData:
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
              typedName: "Rahman Wijaya",
              signedAt: daysFromNow(-718),
            },
          });
        }
      }
  }


  const templates = [
    {
      name: "PKWT — Perjanjian Kerja Waktu Tertentu",
      category: "employment",
      description: "Template PKWT standar untuk karyawan lokal, sesuai UU Ketenagakerjaan.",
      content: `PERJANJIAN KERJA WAKTU TERTENTU (PKWT)

Antara:
{{nama_perusahaan}} ("Perusahaan")
dan
{{nama_pekerja}} ("Pekerja")

Pasal 1 — Jangka Waktu
Perjanjian ini berlaku selama {{durasi_bulan}} bulan, terhitung sejak {{tanggal_mulai}} sampai dengan {{tanggal_berakhir}}.

Pasal 2 — Jabatan & Pekerjaan
Pekerja menjabat sebagai {{jabatan}} dan bertanggung jawab atas {{tugas_utama}}.

Pasal 3 — Upah
Perusahaan membayar upah sebesar Rp {{upah_bulanan}} per bulan, dibayarkan setiap tanggal {{tanggal_pembayaran}}.

Pasal 4 — Jam Kerja
Jam kerja mengikuti ketentuan perusahaan: 8 jam/hari, 40 jam/minggu, dengan waktu istirahat sesuai peraturan.

Pasal 5 — PhK
Pemutusan hubungan kerja mengikuti ketentuan UU No. 13/2003 dan peraturan perusahaan.

Ditandatangani pada {{tanggal_ttd}}.

{{nama_perusahaan}}              {{nama_pekerja}}`,
    },
    {
      name: "NDA — Perjanjian Kerahasiaan",
      category: "nda",
      description: "Perjanjian kerahasiaan mutual untuk kolaborasi bisnis dan diskusi awal.",
      content: `PERJANJIAN KERAHASIAAN (NON-DISCLOSURE AGREEMENT)

Antara {{pihak_pertama}} dan {{pihak_kedua}} ("Para Pihak").

Pasal 1 — Informasi Rahasia
"Informasi Rahasia" adalah setiap informasi non-publik yang dipertukarkan Para Pihak, termasuk data teknis, komersial, keuangan, dan rencana bisnis.

Pasal 2 — Kewajiban
Masing-masing pihak wajib: (a) menjaga kerahasiaan; (b) tidak mengungkapkan kepada pihak ketiga tanpa persetujuan tertulis; (c) menggunakan hanya untuk {{tujuan_kolaborasi}}.

Pasal 3 — Jangka Waktu
Perjanjian berlaku {{durasi_tahun}} tahun sejak {{tanggal_mulai}}. Kewajiban kerahasiaan tetap berlaku {{masa_lindung_tahun}} tahun setelah perjanjian berakhir.

Pasal 4 — Pengecualian
Kewajiban tidak berlaku untuk informasi yang: (a) sudah publik tanpa pelanggaran; (b) dikembangkan secara independen; (c) diwajibkan oleh hukum.

Ditandatangani pada {{tanggal_ttd}}.`,
    },
    {
      name: "Kontrak Kerja Sama Vendor",
      category: "vendor",
      description: "Perjanjian pengadaan barang/jasa berulang dengan vendor terpilih.",
      content: `PERJANJIAN KERJA SAMA PENYEDIAAN BARANG/JASA

Antara {{pihak_pembeli}} ("Pembeli") dan {{pihak_vendor}} ("Vendor").

Pasal 1 — Lingkup
Vendor menyediakan {{jenis_barang_jasa}} sesuai spesifikasi yang disepakati.

Pasal 2 — Harga & Pembayaran
Harga: Rp {{harga_total}} untuk periode {{periode_kontrak}}. Pembayaran {{skema_pembayaran}} setelah invoice dan barang diterima dalam kondisi baik.

Pasal 3 — Serah Terima
Serah terima dilakukan di {{lokasi_serah_terima}} paling lambat {{batas_waktu_hari}} hari setelah PO.

Pasal 4 — Sanksi Keterlambatan
Keterlambatan penyerahan dikenakan denda {{persen_denda}}% per hari dari nilai PO, maksimal {{maks_denda}}%.

Pasal 5 — Berakhirnya Perjanjian
Perjanjian berakhir pada {{tanggal_berakhir}} dan dapat diperpanjang dengan persetujuan tertulis kedua pihak.

Ditandatangani pada {{tanggal_ttd}}.`,
    },
    {
      name: "Kontrak Sewa Menyewa",
      category: "lease",
      description: "Perjanjian sewa ruang komersial (ruko/kantor) tahunan.",
      content: `PERJANJIAN SEWA MENYEWA

Antara {{pihak_pemilik}} ("Pemilik") dan {{pihak_penyewa}} ("Penyewa").

Pasal 1 — Objek Sewa
Pemilik menyewakan {{objek_sewa}} yang terletak di {{alamat_objek}}, luas {{luas}} m2.

Pasal 2 — Jangka Waktu & Harga
Sewa berlangsung {{durasi_sewa_tahun}} tahun sejak {{tanggal_mulai}} hingga {{tanggal_berakhir}}. Harga sewa Rp {{harga_sewa_tahunan}}/tahun, dibayar {{skema_pembayaran}}.

Pasal 3 — Deposito
Penyewa menyetorkan deposito sebesar Rp {{nilai_deposito}}, dikembalikan dalam 14 hari setelah sewa berakhir tanpa kerusakan.

Pasal 4 — Pemeliharaan
Perbaikan struktural menjadi tanggung jawab Pemilik; perbaikan ringan menjadi tanggung jawab Penyewa.

Pasal 5 — Perpanjangan
Penyewa berhak memperpanjang dengan pemberitahuan {{pemberitahuan_hari}} hari sebelum berakhir.

Ditandatangani pada {{tanggal_ttd}}.`,
    },
    {
      name: "Perjanjian Penempatan Pekerja Migran",
      category: "employment",
      description: "Perjanjian penempatan kerja ke luar negeri sesuai regulasi BP2MI (hanya referensi awal — WAJIB review legal).",
      content: `PERJANJIAN PENEMPATAN KERJA KE LUAR NEGERI

Antara {{nama_p3mi}} ("P3MI") dan {{nama_calon_pmi}} ("Calon PMI").

Pasal 1 — Penempatan
P3MI menempatkan Calon PMI bekerja sebagai {{jenis_pekerjaan}} di {{negara_tujuan}} pada {{nama_majikan}}.

Pasal 2 — Masa Kontrak
Kontrak kerja berlaku {{durasi_kontrak_tahun}} tahun sejak {{tanggal_mulai}} dan dapat diperpanjang sesuai perjanjian tiga pihak.

Pasal 3 — Upah & Pembayaran
Upah sebesar {{mata_uang_upah}} {{nilai_upah_bulanan}}/bulan, dibayarkan langsung ke rekening Calon PMI setiap bulan tanpa potongan yang tidak disepakati.

Pasal 4 — Hak Calon PMI
(a) Memegang dokumen keimigrasian dan paspor sendiri; (b) Waktu istirahat dan hari libur sesuai hukum negara penempatan; (c) Asuransi dan perlindungan sesuai regulasi.

Pasal 5 — Biaya
Calon PMI TIDAK dipungut biaya penempatan di luar ketentuan pemerintah. Pelanggaran dapat dilaporkan ke BP2MI.

Ditandatangani pada {{tanggal_ttd}}.

Catatan: Template ini hanya referensi awal dan WAJIB direview oleh tim legal sebelum digunakan.`,
    },
    {
      name: "Kontrak Jasa Profesional",
      category: "service",
      description: "Perjanjian jasa profesional/konsultansi berbasis milestone.",
      content: `PERJANJIAN JASA PROFESIONAL

Antara {{pihak_klien}} ("Klien") dan {{pihak_pemberi_jasa}} ("Pemberi Jasa").

Pasal 1 — Lingkup Pekerjaan
Pemberi Jasa akan melaksanakan {{lingkup_jasa}} dengan hasil akhir berupa {{hasil_kerja}}.

Pasal 2 — Jadwal Milestone
Pekerjaan dibagi menjadi {{jumlah_milestone}} milestone dengan jadwal terlampir.

Pasal 3 — Imbalan Jasa
Imbalan jasa sebesar Rp {{nilai_imbal_jasa}}, dibayarkan per milestone disetujui dalam {{hari_pembayaran}} hari kerja.

Pasal 4 — Kekayaan Intelektual
Seluruh hasil kerja menjadi milik Klien setelah pembayaran lunas.

Pasal 5 — Kerahasiaan
Pemberi Jasa menjaga kerahasiaan seluruh informasi Klien selama dan setelah perjanjian.

Pasal 6 — Berakhirnya Perjanjian
Perjanjian berakhir pada {{tanggal_berakhir}} atau setelah seluruh milestone diserah terimakan.

Ditandatangani pada {{tanggal_ttd}}.`,
    },
  ];

  for (const t of templates) {
    await db.template.create({ data: t });
  }

  const counts = {
    users: await db.user.count(),
    contracts: await db.contract.count(),
    versions: await db.contractVersion.count(),
    approvals: await db.approval.count(),
    templates: await db.template.count(),
  };
  console.log("Seed selesai:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
