// Seed SafeSign Advokasi — institutions (multi-country) + demo cases & emails.
// Idempotent: hanya menghapus tabel advokasi, data kontrak & user tetap.
// Run: bun scripts/seed-advocacy.ts
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const ALL = "SALARY,ABUSE,TRAFFICKING,CONTRACT,REPATRIATION,PLACEMENT,DOCUMENT,WELFARE";

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d;
}

type I = {
  name: string; shortName?: string; type: string;
  originCountry?: string; destinationCountry?: string | null; categories: string;
  email?: string; phone?: string; website?: string; address?: string;
  description: string; jurisdiction: string; priority: number;
  responseTime?: string; language?: string;
};

const INSTITUTIONS: I[] = [
  // ── Lembaga pemerintah Indonesia (negara asal) ──
  {
    name: "Kementerian Perlindungan Pekerja Migran Indonesia / BP2MI", shortName: "KemenP2MI (BP2MI)",
    type: "government", originCountry: "Indonesia", categories: ALL,
    website: "https://www.bp2mi.go.id", phone: "154 (WhatsApp) / +62 812-1545-5005",
    description: "Lembaga utama pelindungan pekerja migran Indonesia (PMI): menerima pengaduan, mediasi sengketa dengan majikan/P3MI, pemulangan, dan bantuan hukum bagi PMI bermasalah di luar negeri.",
    jurisdiction: "Semua kasus pekerja migran Indonesia di luar negeri: gaji, kekerasan, kontrak, penempatan, dokumen, pemulangan.",
    priority: 1, responseTime: "1-3 hari kerja", language: "Indonesian",
  },
  {
    name: "Kementerian Luar Negeri RI — Perlindungan WNI", shortName: "Kemenlu (WNI)",
    type: "government", originCountry: "Indonesia", categories: "SALARY,ABUSE,CONTRACT,REPATRIATION,DOCUMENT,WELFARE",
    website: "https://kemlu.go.id", phone: "+62 812-9000-9070 (24 jam)",
    description: "Direktorat Jenderal Perlindungan Warga Negara Indonesia dan BHI. Hotline darurat 24 jam untuk WNI di luar negeri, koordinasi dengan KBRI/KJRI, dan bantuan konsuler.",
    jurisdiction: "Perlindungan konsuler WNI: keadaan darurat, penahanan dokumen, evakuasi, dan koordinasi perwakilan RI.",
    priority: 2, responseTime: "24 jam (hotline)", language: "Indonesian",
  },
  {
    name: "Kementerian Ketenagakerjaan RI", shortName: "Kemnaker",
    type: "government", originCountry: "Indonesia", categories: "PLACEMENT,CONTRACT,SALARY",
    website: "https://www.kemnaker.go.id",
    description: "Mengawasi P3MI (perusahaan penempatan pekerja migran) dan Atase Tenaga Kerja di perwakilan RI. Menangani pelanggaran oleh agen penempatan di dalam negeri.",
    jurisdiction: "Pelanggaran agen/P3MI, biaya penempatan ilegal, kontrak tidak sesuai ketentuan.",
    priority: 4, responseTime: "3-5 hari kerja", language: "Indonesian",
  },
  {
    name: "LPSK — Lembaga Perlindungan Saksi dan Korban", shortName: "LPSK",
    type: "government", originCountry: "Indonesia", categories: "ABUSE,TRAFFICKING",
    website: "https://lpsk.go.id",
    description: "Memberikan perlindungan saksi dan korban (termasuk korban kekerasan dan perdagangan orang) serta bantuan hukum dan kompensasi.",
    jurisdiction: "Perlindungan korban kekerasan/traficking, bantuan hukum, dan kompensasi.",
    priority: 8, responseTime: "5-10 hari kerja", language: "Indonesian",
  },
  // ── Perwakilan RI di negara penempatan ──
  {
    name: "KBRI Riyadh (Arab Saudi)", shortName: "KBRI Riyadh",
    type: "embassy", originCountry: "Indonesia", destinationCountry: "Arab Saudi", categories: ALL,
    website: "https://riyadh.kemlu.go.id", address: "Riyadh, Arab Saudi",
    description: "Perwakilan RI untuk Arab Saudi (bersama KBRI Jeddah). Memiliki fungsi perlindungan WNI dan penampungan bagi PMI bermasalah.",
    jurisdiction: "Semua kasus PMI di Arab Saudi: sengketa majikan, dokumen, pemulangan.",
    priority: 3, responseTime: "2-4 hari kerja", language: "Indonesian",
  },
  {
    name: "KJRI Hong Kong", shortName: "KJRI Hong Kong",
    type: "embassy", originCountry: "Indonesia", destinationCountry: "Hong Kong", categories: ALL,
    website: "https://hongkong.kemlu.go.id", address: "Wan Chai, Hong Kong",
    description: "Konsulat Jenderal RI di Hong Kong — melayani mayoritas pekerja rumah tangga Indonesia di Hong Kong, termasuk mediasi sengketa dengan majikan dan agen.",
    jurisdiction: "Semua kasus PMI di Hong Kong, termasuk kontrak, gaji, dan pemutusan kerja.",
    priority: 3, responseTime: "2-4 hari kerja", language: "Indonesian",
  },
  {
    name: "KBRI Kuala Lumpur (Malaysia)", shortName: "KBRI KL",
    type: "embassy", originCountry: "Indonesia", destinationCountry: "Malaysia", categories: ALL,
    website: "https://kualalumpur.kemlu.go.id", address: "Kuala Lumpur, Malaysia",
    description: "Perwakilan RI untuk Malaysia. Fungsi perlindungan WNI dan Atase Tenaga Kerja menangani sengketa ketenagakerjaan PMI, termasuk di sektor manufaktur dan perkebunan.",
    jurisdiction: "Semua kasus PMI di Malaysia: gaji, kontrak, kekerasan, pemulangan.",
    priority: 3, responseTime: "2-5 hari kerja", language: "Indonesian",
  },
  {
    name: "KBRI Seoul (Korea Selatan)", shortName: "KBRI Seoul",
    type: "embassy", originCountry: "Indonesia", destinationCountry: "Korea Selatan", categories: ALL,
    website: "https://seoul.kemlu.go.id", address: "Seoul, Korea Selatan",
    description: "Perwakilan RI untuk Korea Selatan. Menangani pekerja EPS dan non-EPS, mediasi dengan majikan Korea, serta koordinasi dengan kantor imigrasi Korea.",
    jurisdiction: "Semua kasus PMI di Korea Selatan, khususnya program EPS.",
    priority: 3, responseTime: "2-4 hari kerja", language: "Indonesian",
  },
  {
    name: "KDEI Taipei (Taiwan)", shortName: "KDEI Taipei",
    type: "embassy", originCountry: "Indonesia", destinationCountry: "Taiwan", categories: ALL,
    website: "https://taipei.kemlu.go.id", address: "Taipei, Taiwan",
    description: "Kantor Dagang dan Ekonomi Indonesia di Taipei — perlindungan pekerja migran Indonesia di Taiwan (pabrik, perawat, nelayan).",
    jurisdiction: "Semua kasus PMI di Taiwan, termasuk sengketa perusahaan dan agen.",
    priority: 3, responseTime: "2-4 hari kerja", language: "Indonesian",
  },
  {
    name: "KBRI Tokyo (Jepang)", shortName: "KBRI Tokyo",
    type: "embassy", originCountry: "Indonesia", destinationCountry: "Jepang", categories: ALL,
    website: "https://tokyo.kemlu.go.id", address: "Tokyo, Jepang",
    description: "Perwakilan RI untuk Jepang. Menangani pekerja SSW/Tokutei Ginou, magang (internship), dan mediasi dengan majikan/penerima asuhan.",
    jurisdiction: "Semua kasus PMI di Jepang: gaji, kontrak, pelecehan, izin tinggal.",
    priority: 3, responseTime: "2-4 hari kerja", language: "Indonesian",
  },
  {
    name: "KBRI Singapura", shortName: "KBRI Singapura",
    type: "embassy", originCountry: "Indonesia", destinationCountry: "Singapura", categories: ALL,
    website: "https://singapura.kemlu.go.id", address: "Singapura",
    description: "Perwakilan RI untuk Singapura — perlindungan pekerja migran Indonesia di sektor konstruksi, maritim, manufaktur, dan pekerjaan rumah tangga.",
    jurisdiction: "Semua kasus PMI di Singapura: gaji, kontrak, kekerasan, pemulangan.",
    priority: 3, responseTime: "2-4 hari kerja", language: "Indonesian",
  },
  // ── Lembaga internasional ──
  {
    name: "International Labour Organization (ILO)", shortName: "ILO",
    type: "international", originCountry: "ANY", categories: "SALARY,ABUSE,TRAFFICKING,CONTRACT",
    email: "ilo@ilo.org", website: "https://www.ilo.org",
    description: "Badan PBB untuk ketenagakerjaan. Menangani pelanggaran standar kerja internasional bagi pekerja migran (Konvensi C097, C143, Protokol Kerja Paksa P29) — terutama pola sistemik dan praktik perbudakan modern.",
    jurisdiction: "Pelanggaran standar ketenagakerjaan internasional, kerja paksa, trafiking tenaga kerja.",
    priority: 6, responseTime: "1-4 minggu", language: "English",
  },
  {
    name: "ILO Country Office for Indonesia", shortName: "ILO Jakarta",
    type: "international", originCountry: "Indonesia", categories: "SALARY,ABUSE,TRAFFICKING,CONTRACT",
    email: "ilo-jakarta@ilo.org", website: "https://www.ilo.org/jakarta",
    description: "Kantor ILO di Jakarta — memantau kondisi pekerja migran Indonesia dan mendukung program perlindungan bersama pemerintah Indonesia.",
    jurisdiction: "Isu pekerja migran Indonesia secara nasional dan pola pelanggaran sistemik.",
    priority: 6, responseTime: "1-3 minggu", language: "English",
  },
  {
    name: "International Organization for Migration (IOM)", shortName: "IOM",
    type: "international", originCountry: "ANY", categories: "TRAFFICKING,REPATRIATION,WELFARE",
    website: "https://www.iom.int",
    description: "Badan PBB untuk migrasi — membantu korban trafiking dan pekerja migran terjerat krisis, termasuk bantuan pemulangan aman dan dukungan langsung.",
    jurisdiction: "Korban trafiking, pemulangan darurat, bantuan kesejahteraan migran.",
    priority: 7, responseTime: "1-3 minggu", language: "English",
  },
  {
    name: "UN Special Rapporteur on the Human Rights of Migrants", shortName: "UN SR Migrants",
    type: "international", originCountry: "ANY", categories: "ABUSE,TRAFFICKING",
    email: "sr-migrants@ohchr.org", website: "https://www.ohchr.org",
    description: "Mandat khusus PBB untuk hak asasi pekerja migran. Menerima laporan individu mengenai pelanggaran HAM berat terhadap pekerja migran untuk ditelaah dan dikomunikasikan kepada negara terkait.",
    jurisdiction: "Pelanggaran HAM berat terhadap pekerja migran (pengaduan individu diterima).",
    priority: 9, responseTime: "4-8 minggu", language: "English",
  },
  {
    name: "Migrant Forum in Asia (MFA)", shortName: "MFA",
    type: "ngo", originCountry: "ANY", categories: "SALARY,ABUSE,TRAFFICKING,CONTRACT,REPATRIATION",
    email: "mfa@mfasia.org", website: "https://mfasia.org",
    description: "Jaringan masyarakat sipil Asia-Pasifik untuk hak pekerja migran — advokasi, rujukan ke organisasi mitra lokal, dan kampanye kebijakan.",
    jurisdiction: "Advokasi lintas negara dan rujukan ke mitra lokal di negara asal/penempatan.",
    priority: 8, responseTime: "1-2 minggu", language: "English",
  },
  // ── LSM Indonesia ──
  {
    name: "Migrant CARE", shortName: "Migrant CARE",
    type: "ngo", originCountry: "Indonesia", categories: "SALARY,ABUSE,TRAFFICKING,CONTRACT",
    website: "https://migrantcare.net",
    description: "LSM advokasi utama untuk pekerja migran Indonesia — pendampingan kasus, bantuan hukum, dan advokasi kebijakan publik.",
    jurisdiction: "Pendampingan kasus PMI dan advokasi kebijakan perlindungan.",
    priority: 7, responseTime: "3-7 hari kerja", language: "Indonesian",
  },
  {
    name: "Jaringan Bantuan Hukum (LBH) Nasional", shortName: "LBH",
    type: "ngo", originCountry: "Indonesia", categories: "SALARY,ABUSE,TRAFFICKING,CONTRACT",
    website: "https://www.bantuanhukum.or.id",
    description: "Jaringan Lembaga Bantuan Hukum di seluruh Indonesia — konsultasi hukum gratis/terjangkau untuk pekerja migran dan keluarganya.",
    jurisdiction: "Bantuan hukum di pengadilan Indonesia dan pendampingan administratif.",
    priority: 8, responseTime: "3-7 hari kerja", language: "Indonesian",
  },
  // ── Lembaga negara asal lain (pendukung pencarian lintas negara) ──
  {
    name: "Department of Migrant Workers (DMW) — Filipina", shortName: "DMW Filipina",
    type: "government", originCountry: "Filipina", categories: ALL,
    website: "https://www.dmw.gov.ph", phone: "1348",
    description: "Kementerian pekerja migran Filipina (pengganti POEA) — pengaduan, mediasi one-stop, dan bantuan bagi OFW di seluruh dunia.",
    jurisdiction: "Semua kasus pekerja migran Filipina di luar negeri.",
    priority: 1, responseTime: "1-3 hari kerja", language: "English",
  },
  {
    name: "OWWA — Overseas Workers Welfare Administration (Filipina)", shortName: "OWWA",
    type: "government", originCountry: "Filipina", categories: "WELFARE,REPATRIATION",
    website: "https://www.owwa.gov.ph",
    description: "Badan kesejahteraan OFW: bantuan repatriasi, asuransi, bantuan darurat keluarga.",
    jurisdiction: "Kesejahteraan dan pemulangan pekerja Filipina.",
    priority: 3, responseTime: "2-5 hari kerja", language: "English",
  },
  {
    name: "Department of Foreign Employment (DoFE) — Nepal", shortName: "DoFE Nepal",
    type: "government", originCountry: "Nepal", categories: ALL,
    website: "https://dofe.gov.np", phone: "1800 11 0111",
    description: "Departemen Tenaga Kerja Asing Nepal — pengaduan pekerja migran Nepal, lisensi agen, dan kompensasi korban.",
    jurisdiction: "Semua kasus pekerja migran Nepal di luar negeri.",
    priority: 1, responseTime: "2-4 hari kerja", language: "English",
  },
  {
    name: "BMET — Bureau of Manpower, Employment and Training (Bangladesh)", shortName: "BMET",
    type: "government", originCountry: "Bangladesh", categories: ALL,
    website: "https://bmet.gov.bd", phone: "+880 2 5513-0908",
    description: "Biro tenaga kerja Bangladesh — layanan pengaduan pekerja migran Bangladesh di luar negeri, termasuk kompensasi dan pemulangan.",
    jurisdiction: "Semua kasus pekerja migran Bangladesh di luar negeri.",
    priority: 1, responseTime: "2-5 hari kerja", language: "English",
  },
  {
    name: "SLBFE — Sri Lanka Bureau of Foreign Employment", shortName: "SLBFE",
    type: "government", originCountry: "Sri Lanka", categories: ALL,
    website: "https://www.slbfe.lk", phone: "1987",
    description: "Biro penempatan luar negeri Sri Lanka — perlindungan pekerja migran Sri Lanka, pengaduan, dan bantuan hukum.",
    jurisdiction: "Semua kasus pekerja migran Sri Lanka di luar negeri.",
    priority: 1, responseTime: "2-5 hari kerja", language: "English",
  },
  {
    name: "eMigrate / Protector General of Emigrants (India)", shortName: "eMigrate India",
    type: "government", originCountry: "India", categories: ALL,
    website: "https://emigrate.gov.in",
    description: "Sistem eMigrate Kementerian Luar Negeri India + portal MADAD untuk pengaduan pekerja India di luar negeri.",
    jurisdiction: "Semua kasus pekerja migran India di luar negeri.",
    priority: 1, responseTime: "2-5 hari kerja", language: "English",
  },
  {
    name: "Bureau of Emigration & Overseas Employment (Pakistan)", shortName: "BEOE Pakistan",
    type: "government", originCountry: "Pakistan", categories: ALL,
    website: "https://beoe.gov.pk",
    description: "Biro emigrasi Pakistan — perlindungan pekerja Pakistan di luar negeri dan pengaduan terhadap agen.",
    jurisdiction: "Semua kasus pekerja migran Pakistan di luar negeri.",
    priority: 1, responseTime: "2-5 hari kerja", language: "English",
  },
  {
    name: "Ministry of Labour and Skills (Ethiopia)", shortName: "MoLS Ethiopia",
    type: "government", originCountry: "Etiopia", categories: ALL,
    description: "Kementerian tenaga kerja Etiopia — layanan penempatan luar negeri dan perlindungan pekerja migran Etiopia.",
    jurisdiction: "Semua kasus pekerja migran Etiopia di luar negeri.",
    priority: 1, responseTime: "5-10 hari kerja", language: "English",
  },
  // ── Otoritas negara penempatan ──
  {
    name: "Labour Department Hong Kong", shortName: "HK Labour Dept",
    type: "government", originCountry: "ANY", destinationCountry: "Hong Kong", categories: "SALARY,CONTRACT,ABUSE,WELFARE",
    website: "https://www.labour.gov.hk", phone: "+852 2717 1771",
    description: "Departemen Tenaga Kerja Hong Kong — menangani klaim upah, pelanggaran kontrak pekerja rumah tangga asing, dan perselisihan majikan-pekerja.",
    jurisdiction: "Sengketa ketenagakerjaan di Hong Kong (semua pekerja, termasuk FDH).",
    priority: 5, responseTime: "1-2 minggu", language: "English",
  },
  {
    name: "Hotline 1955 Pekerja Migran Taiwan", shortName: "1955 Taiwan",
    type: "government", originCountry: "ANY", destinationCountry: "Taiwan", categories: "SALARY,CONTRACT,ABUSE,WELFARE,DOCUMENT",
    website: "https://1955lab.wda.gov.tw", phone: "1955",
    description: "Hotline resmi 24 jam Kementerian Tenaga Kerja Taiwan untuk pekerja migran — konsultasi, pengaduan, dan rujukan dalam berbagai bahasa (termasuk Indonesia).",
    jurisdiction: "Semua sengketa pekerja migran di Taiwan.",
    priority: 5, responseTime: "1-3 hari kerja", language: "English",
  },
  {
    name: "MOEL / EPS Help Center Korea", shortName: "MOEL Korea",
    type: "government", originCountry: "ANY", destinationCountry: "Korea Selatan", categories: "SALARY,CONTRACT,ABUSE,DOCUMENT",
    website: "https://www.moel.go.kr", phone: "1350",
    description: "Kementerian Tenaga Kerja Korea — pusat bantuan EPS 1350 (dukungan bahasa Indonesia), klaim upah tertunggak, dan perselisihan kerja pekerja asing.",
    jurisdiction: "Sengketa ketenagakerjaan pekerja asing di Korea Selatan.",
    priority: 5, responseTime: "1-2 minggu", language: "English",
  },
  {
    name: "Ministry of Manpower Singapura (MOM)", shortName: "MOM Singapura",
    type: "government", originCountry: "ANY", destinationCountry: "Singapura", categories: "SALARY,CONTRACT,ABUSE,WELFARE",
    website: "https://www.mom.gov.sg", phone: "+65 6438 5122",
    description: "Kementerian Tenaga Kerja Singapura — klaim gaji tertunggak (MOM's salary claims), pelanggaran izin kerja, dan perlindungan pekerja asing.",
    jurisdiction: "Sengketa ketenagakerjaan pekerja asing di Singapura.",
    priority: 5, responseTime: "1-2 minggu", language: "English",
  },
  {
    name: "Musaned / HRSD Arab Saudi", shortName: "Musaned",
    type: "government", originCountry: "ANY", destinationCountry: "Arab Saudi", categories: "SALARY,CONTRACT,PLACEMENT,DOCUMENT",
    website: "https://musaned.com",
    description: "Platform resmi Arab Saudi untuk rekrutmen pekerja rumah tangga dan penyelesaian sengketa (Kementerian Sumber Daya Manusia).",
    jurisdiction: "Sengketa pekerja rumah tangga dan rekrutmen di Arab Saudi.",
    priority: 6, responseTime: "2-4 minggu", language: "Arabic",
  },
  {
    name: "Jabatan Tenaga Kerja (JTK) Malaysia", shortName: "JTK Malaysia",
    type: "government", originCountry: "ANY", destinationCountry: "Malaysia", categories: "SALARY,CONTRACT,WELFARE",
    website: "https://www.mohr.gov.my",
    description: "Departemen Tenaga Kerja Semenanjung Malaysia — klaim upah tertunggak dan pelanggaran akta ketenagakerjaan.",
    jurisdiction: "Sengketa ketenagakerjaan di Malaysia.",
    priority: 5, responseTime: "2-4 minggu", language: "English",
  },
  {
    name: "MADLSA / ILO Qatar Project", shortName: "MADLSA Qatar",
    type: "government", originCountry: "ANY", destinationCountry: "Qatar", categories: "SALARY,CONTRACT,WELFARE",
    website: "https://www.adi.gov.qa",
    description: "Kementerian Tenaga Kerja Qatar — pengaduan upah melalui sistem electronic (WPS) dan fasilitas penyelesaian sengketa pekerja.",
    jurisdiction: "Sengketa ketenagakerjaan di Qatar.",
    priority: 6, responseTime: "2-4 minggu", language: "English",
  },
  {
    name: "PAM — Public Authority of Manpower Kuwait", shortName: "PAM Kuwait",
    type: "government", originCountry: "ANY", destinationCountry: "Kuwait", categories: "SALARY,CONTRACT,PLACEMENT",
    website: "https://www.manpower.gov.kw",
    description: "Otoritas tenaga kerja Kuwait — pengaduan pekerja (termasuk pekerja rumah tangga) dan pengawasan agen.",
    jurisdiction: "Sengketa ketenagakerjaan di Kuwait.",
    priority: 6, responseTime: "2-4 minggu", language: "English",
  },
];

async function main() {
  console.log("Seeding advokasi…");

  await db.caseEmail.deleteMany();
  await db.advocacyCase.deleteMany();
  await db.institution.deleteMany();

  const inst: Record<string, string> = {};
  for (const i of INSTITUTIONS) {
    const created = await db.institution.create({
      data: {
        name: i.name,
        shortName: i.shortName ?? null,
        type: i.type,
        originCountry: i.originCountry ?? "ANY",
        destinationCountry: i.destinationCountry ?? null,
        categories: i.categories,
        email: i.email ?? null,
        phone: i.phone ?? null,
        website: i.website ?? null,
        address: i.address ?? null,
        description: i.description,
        jurisdiction: i.jurisdiction,
        priority: i.priority,
        responseTime: i.responseTime ?? null,
        language: i.language ?? "English",
      },
    });
    inst[i.shortName ?? i.name] = created.id;
  }
  console.log(`Institusi: ${Object.keys(inst).length}`);

  const year = new Date().getFullYear();

  const DEMO = process.env.SEED_DEMO === "1";
  if (DEMO) {
      // ── Kasus 1: gaji tidak dibayar (Terkirim, follow-up terlambat) ──
      const c1 = await db.advocacyCase.create({
        data: {
          caseNumber: `ADV-${year}-0001`,
          title: "Gaji 3 bulan tidak dibayar — pabrik elektronik Johor",
          category: "SALARY",
          priority: "high",
          status: "sent",
          originCountry: "Indonesia",
          destinationCountry: "Malaysia",
          chronology:
            "Saya bekerja sebagai operator produksi di pabrik elektronik di Johor sejak Agustus 2024. Sejak Januari 2026 gaji saya tidak dibayar. Sudah 3 kali minta ke supervisor selalu ditunda dengan alasan 'proses administrasi'. Rekan sekampung saya di pabrik yang sama juga mengalami hal serupa. Saya masih melanjutkan kerja karena takut kehilangan izin kerja.",
          anonymous: false,
          institutionId: inst["KBRI KL"],
          attachmentsJson: JSON.stringify([
            { name: "Kontrak kerja MY/2024/EL-156", kind: "contract" },
            { name: "Foto slip gaji Desember 2025", kind: "evidence" },
          ]),
          createdByEmail: "rina@safesign.id",
          createdByName: "Rina Melati (untuk Dewi Lestari)",
          sentAt: daysFromNow(-20),
          followUpDue: daysFromNow(-6),
          timelineJson: JSON.stringify([
            { at: daysFromNow(-22).toISOString(), event: "CREATED", note: "Kasus dibuat melalui wizard Advokasi" },
            { at: daysFromNow(-22).toISOString(), event: "DRAFT_CREATED", note: "AI menyusun draf email ke KBRI Kuala Lumpur" },
            { at: daysFromNow(-20).toISOString(), event: "APPROVED", note: "Pengguna mengizinkan pengiriman email" },
            { at: daysFromNow(-20).toISOString(), event: "SENT", note: "Email terkirim ke KBRI Kuala Lumpur" },
          ]),
        },
      });
      await db.caseEmail.create({
        data: {
          caseId: c1.id,
          type: "initial",
          subject: "Pengaduan penunggakan gaji 3 bulan — Pekerja Migran Indonesia di pabrik elektronik Johor",
          body: `Kepada Yth.
    Atase Tenaga Kerja, KBRI Kuala Lumpur

    Dengan hormat,

    Saya, Dewi Lestari, warga negara Indonesia, bekerja sebagai operator produksi di sebuah pabrik elektronik di Johor, Malaysia, berdasarkan kontrak kerja MY/2024/EL-156 sejak bulan Agustus 2024 dengan gaji bulanan RM 1.200.

    Melalui surel ini saya ingin melaporkan bahwa perusahaan tidak membayar gaji saya selama tiga bulan terakhir, yaitu Januari hingga Maret 2026, dengan total tunggakan RM 3.600. Permintaan secara lisan kepada supervisor beberapa kali hanya dijawab dengan penundaan dengan alasan proses administrasi. Rekan kerja saya di departemen yang sama mengalami perlakuan yang sama.

    Sehubungan dengan hal tersebut, saya memohon bantuan Bapak/Ibu untuk:
    1. Melakukan koordinasi dan verifikasi dengan perusahaan mengenai tunggakan gaji saya;
    2. Memberikan pendampingan agar hak saya sesuai kontrak dan hukum ketenagakerjaan Malaysia dipenuhi;
    3. Memberikan advis mengenai langkah hukum yang dapat saya temppuh jika perusahaan tetap tidak membayar.

    Sebagai bahan verifikasi, saya lampirkan:
    1. Salinan kontrak kerja MY/2024/EL-156;
    2. Foto slip gaji Desember 2025 sebagai pembanding pembayaran normal.

    Atas perhatian dan bantuan Bapak/Ibu, saya ucapkan terima kasih.

    Hormat saya,
    Dewi Lestari`,
          bodyUser: null, // bahasa lembaga = bahasa Indonesia (tidak perlu terjemahan)
          advice: "Siapkan bukti transfer gaji bulan-bulan sebelumnya dan catat setiap percakapan dengan supervisor sebagai bukti tambahan.",
          attachmentsJson: JSON.stringify(["Kontrak kerja MY/2024/EL-156", "Foto slip gaji Desember 2025"]),
          status: "sent",
          sentAt: daysFromNow(-20),
        },
      });

      // ── Kasus 2: kontrak diganti & paspor ditahan (Sedang ditangani) ──
      const c2 = await db.advocacyCase.create({
        data: {
          caseNumber: `ADV-${year}-0002`,
          title: "Kontrak diganti saat tiba di Riyadh & paspor ditahan majikan",
          category: "DOCUMENT",
          priority: "urgent",
          status: "in_progress",
          originCountry: "Indonesia",
          destinationCountry: "Arab Saudi",
          chronology:
            "Saya berangkat ke Riyadh sebagai pekerja rumah tangga dengan kontrak gaji SAR 1.800/bulan. Saat tiba di bandara, majikan meminta saya tanda tangan kontrak baru berbahasa Arab dengan gaji SAR 1.200. Paspor saya juga diambil dan disimpan majikan sampai sekarang. Saya tidak berani menolak karena takut dikirim pulang.",
          anonymous: true,
          institutionId: inst["KemenP2MI (BP2MI)"],
          attachmentsJson: JSON.stringify([
            { name: "Kontrak asli (foto sebelum keberangkatan)", kind: "contract" },
            { name: "Foto kontrak baru yang ditandatangani di bandara", kind: "evidence" },
          ]),
          createdByEmail: "sari@safesign.id",
          createdByName: "Sari Wulandari (untuk pelapor anonim)",
          sentAt: daysFromNow(-35),
          followUpDue: daysFromNow(-21),
          timelineJson: JSON.stringify([
            { at: daysFromNow(-37).toISOString(), event: "CREATED", note: "Kasus dibuat (mode anonim)" },
            { at: daysFromNow(-37).toISOString(), event: "DRAFT_CREATED", note: "AI menyusun draf email ke KemenP2MI" },
            { at: daysFromNow(-35).toISOString(), event: "APPROVED", note: "Pengguna mengizinkan pengiriman email" },
            { at: daysFromNow(-35).toISOString(), event: "SENT", note: "Email terkirim ke KemenP2MI" },
            { at: daysFromNow(-12).toISOString(), event: "STATUS_CHANGED", note: "Dijawab oleh petugas — verifikasi identitas & koordinasi dengan Atase KBRI Riyadh dimulai", by: "sari@safesign.id" },
          ]),
        },
      });
      await db.caseEmail.create({
        data: {
          caseId: c2.id,
          type: "initial",
          subject: "[RAHASIA] Laporan penggantian kontrak dan penahanan paspor — pekerja rumah tangga Indonesia di Riyadh",
          body: `Kepada Yth.
    Unit Pengaduan, Kementerian Perlindungan Pekerja Migran Indonesia / BP2MI

    Dengan hormat,

    Saya adalah seorang pekerja migran Indonesia (PRT) yang saat ini berada di Riyadh, Arab Saudi. Karena takut terhadap pembalasan dari majikan, saya memohon identitas saya dijaga kerahasiaannya dan tidak dibocorkan kepada pihak manapun tanpa persetujuan saya.

    Saya berangkat dari Indonesia dengan kontrak kerja bergaji SAR 1.800 per bulan. Namun saat tiba di Bandara King Khalid, saya diminta menandatangani kontrak baru berbahasa Arab yang tidak saya pahami, dan setelah itu diketahui gaji dalam kontrak baru hanya SAR 1.200 per bulan. Selain itu, paspor saya disimpan oleh majikan sejak hari kedua saya bekerja dan belum dikembalikan hingga surat ini dibuat.

    Saya melaporkan dugaan:
    1. Penggantian kontrak (contract substitution) tanpa persetujuan yang sah;
    2. Penahanan paspor oleh majikan, yang bertentangan dengan prinsip perlindungan PMI.

    Sehubungan dengan hal tersebut, saya memohon:
    1. Intervensi dan mediasi melalui Atase Tenaga Kerja KBRI Riyadh agar kontrak saya dikembalikan sesuai ketentuan awal;
    2. Bantuan pengambilalihan paspor saya sesuai prinsip dokumen keimigrasian dipegang sendiri oleh pekerja;
    3. Perlindungan dari ancaman pengiriman paksa ke Indonesia selama proses mediasi berlangsung.

    Lampiran yang saya sertakan:
    1. Foto kontrak asli sebelum keberangkatan;
    2. Foto kontrak baru yang ditandatangani di bandara.

    Demikian laporan ini saya sampaikan. Atas perhatian dan perlindungan yang diberikan, saya ucapkan terima kasih.

    Hormat saya,
    (Pelapor meminta kerahasiaan identitas)`,
          bodyUser: null,
          advice: "Jangan tanda tangani dokumen apa pun lagi sebelum ada pendampingan. Simpan bukti foto semua dokumen di tempat aman.",
          attachmentsJson: JSON.stringify(["Kontrak asli (foto sebelum keberangkatan)", "Foto kontrak baru yang ditandatangani di bandara"]),
          status: "sent",
          sentAt: daysFromNow(-35),
        },
      });

      // ── Kasus 3: pelecehan di Hong Kong (Selesai) ──
      const c3 = await db.advocacyCase.create({
        data: {
          caseNumber: `ADV-${year}-0003`,
          title: "Pelecehan verbal berulang oleh majikan — Hong Kong",
          category: "ABUSE",
          priority: "high",
          status: "resolved",
          originCountry: "Indonesia",
          destinationCountry: "Hong Kong",
          chronology:
            "Majikan sering membentak dengan kata-kata kasar dan mengancam mengirim saya pulang setiap kali saya minta hari libur sesuai kontrak. Sekali majikan melempar piring ke arah saya.",
          anonymous: false,
          institutionId: inst["KJRI Hong Kong"],
          attachmentsJson: JSON.stringify([{ name: "Rekaman percakapan singkat via telepon", kind: "evidence" }]),
          createdByEmail: "rina@safesign.id",
          createdByName: "Rina Melati (untuk Maria Lourdes)",
          sentAt: daysFromNow(-60),
          followUpDue: daysFromNow(-46),
          timelineJson: JSON.stringify([
            { at: daysFromNow(-62).toISOString(), event: "CREATED", note: "Kasus dibuat melalui wizard Advokasi" },
            { at: daysFromNow(-62).toISOString(), event: "DRAFT_CREATED", note: "AI menyusun draf email ke KJRI Hong Kong" },
            { at: daysFromNow(-60).toISOString(), event: "APPROVED", note: "Pengguna mengizinkan pengiriman email" },
            { at: daysFromNow(-60).toISOString(), event: "SENT", note: "Email terkirim ke KJRI Hong Kong" },
            { at: daysFromNow(-30).toISOString(), event: "STATUS_CHANGED", note: "Mediasi bersama NGO mitra selesai — pekerja dipindahkan ke majikan baru, by: sari@safesign.id" },
            { at: daysFromNow(-28).toISOString(), event: "STATUS_CHANGED", note: "Kasus ditandai selesai oleh pengguna", by: "rina@safesign.id" },
          ]),
        },
      });
      await db.caseEmail.create({
        data: {
          caseId: c3.id,
          type: "initial",
          subject: "Laporan pelecehan verbal berulang oleh majikan — PRT Indonesia di Hong Kong",
          body: `Kepada Yth.
    Bagian Perlindungan WNI, KJRI Hong Kong

    Dengan hormat,

    Saya, Maria Lourdes, warga negara Indonesia, bekerja sebagai pekerja rumah tangga (domestic helper) di Hong Kong sejak tahun 2025.

    Melalui surel ini saya melaporkan bahwa majikan saya berulang kali melakukan pelecehan verbal — membentak dengan kata-kata kasar dan mengancam mengirim saya pulang setiap kali saya mengajukan hak hari istirahat mingguan sesuai kontrak. Pada satu kesempatan, majikan melempar piring ke arah saya sehingga saya merasa tidak aman tinggal di rumah tersebut.

    Sehubungan dengan hal tersebut, saya memohon:
    1. Pendampingan dari KJRI untuk melaporkan kejadian ini kepada Labour Department Hong Kong;
    2. Bantuan pencarian penampungan sementara (shelter) bila diperlukan;
    3. Konsultasi mengenai hak saya untuk mengganti majikan sesuai ketentuan Hong Kong.

    Saya lampirkan rekaman singkat percakapan sebagai bukti pendukung.

    Atas perhatian Bapak/Ibu, saya ucapkan terima kasih.

    Hormat saya,
    Maria Lourdes`,
          bodyUser: null,
          advice: "Di Hong Kong, Anda berhak atas 1 hari libur setiap minggu dan berhak mengganti majikan — jangan menandatangani pengakuan apa pun dalam bahasa yang tidak dipahami.",
          attachmentsJson: JSON.stringify(["Rekaman percakapan singkat via telepon"]),
          status: "sent",
          sentAt: daysFromNow(-60),
        },
      });

      // ── Kasus 4: draf ke ILO (belum dikirim, contoh bahasa Inggris) ──
      const c4 = await db.advocacyCase.create({
        data: {
          caseNumber: `ADV-${year}-0004`,
          title: "Upah di bawah Minimum Allowable Wage & potongan ilegal — Hong Kong",
          category: "SALARY",
          priority: "medium",
          status: "draft",
          originCountry: "Indonesia",
          destinationCountry: "Hong Kong",
          chronology:
            "Kontrak saya menyebut gaji HKD 5.000 per bulan, tapi yang diterima hanya HKD 4.300 dengan alasan potongan makan dan agen. Agency juga memotong HKD 700 tiap bulan selama 6 bulan pertama.",
          anonymous: false,
          institutionId: inst["ILO"],
          attachmentsJson: JSON.stringify([
            { name: "Kontrak HK/2025/DH-112", kind: "contract" },
            { name: "Rekaman rekening bank 3 bulan terakhir", kind: "evidence" },
          ]),
          createdByEmail: "budi@safesign.id",
          createdByName: "Budi Santoso (untuk Maria Lourdes)",
          timelineJson: JSON.stringify([
            { at: daysFromNow(-3).toISOString(), event: "CREATED", note: "Kasus dibuat melalui wizard Advokasi" },
            { at: daysFromNow(-3).toISOString(), event: "DRAFT_CREATED", note: "AI menyusun draf email ke ILO (bahasa Inggris)" },
          ]),
        },
      });
      await db.caseEmail.create({
        data: {
          caseId: c4.id,
          type: "initial",
          subject: "Complaint: systemic underpayment of Indonesian domestic helpers in Hong Kong — wage below Minimum Allowable Wage",
          body: `Dear Sir or Madam,

    I am writing on behalf of an Indonesian migrant domestic worker employed in Hong Kong to bring to your attention a pattern of wage abuse that we believe may be systemic among certain placement agencies.

    The worker's signed employment contract (No. HK/2025/DH-112) stipulates a monthly wage of HKD 5,000, in line with Hong Kong's Minimum Allowable Wage for foreign domestic helpers. However, she has received only HKD 4,300 per month, with the difference deducted as "food and agency fees". In addition, her placement agency deducted HKD 700 monthly during her first six months of employment, reducing her effective wage to approximately HKD 3,600 — far below the statutory minimum.

    These practices raise concerns under ILO standards on protection of wages and on private employment agencies, and may constitute debt bondage when combined with passport-style control over the worker's earnings.

    We respectfully request:
    1. Guidance on submitting this pattern to the relevant ILO supervisory mechanisms;
    2. Any recommendations for international referral pathways available to the worker.

    Attached for reference:
    1. Signed employment contract No. HK/2025/DH-112;
    2. Three months of bank statement records.

    Thank you for your attention to this matter.

    Respectfully submitted,
    SafeSign Advocacy (on behalf of the worker)`,
          bodyUser: `Yth. Bapak/Ibu,

    Saya menulis atas nama seorang pekerja rumah tangga Indonesia di Hong Kong untuk menyampaikan pola penyalahgunaan upah yang kami duga bersifat sistemik di antara agen-agen penempatan tertentu.

    Kontrak kerja pekerja tersebut (No. HK/2025/DH-112) menyebutkan gaji bulanan HKD 5.000, sesuai Upah Minimum yang Diizinkan di Hong Kong. Namun ia hanya menerima HKD 4.300 per bulan, dengan selisih dipotong sebagai "biaya makan dan agen". Selain itu, agen penempatan memotong HKD 700 setiap bulan selama enam bulan pertama, sehingga gaji efektifnya hanya sekitar HKD 3.600 — jauh di bawah upah minimum.

    Praktik ini menimbulkan keprihatinan berdasarkan standar ILO mengenai perlindungan upah dan lembaga penempatan swasta, dan berpotensi menjadi perbudakan utang.

    Kami memohon:
    1. Panduan untuk menyampaikan pola ini kepada mekanisme pengawasan ILO;
    2. Rekomendasi jalur rujukan internasional yang tersedia bagi pekerja.

    Terlampir:
    1. Salinan kontrak kerja No. HK/2025/DH-112;
    2. Rekening bank tiga bulan terakhir.

    Atas perhatian, kami ucapkan terima kasih.`,
          advice: "Untuk lembaga internasional seperti ILO, sertakan bukti yang menunjukkan POLA (bukan hanya kasus pribadi) agar laporan lebih kuat. Pertimbangkan juga melapor ke HK Labour Department secara paralel.",
          attachmentsJson: JSON.stringify(["Kontrak HK/2025/DH-112", "Rekaman rekening bank 3 bulan terakhir"]),
          status: "draft",
        },
      });

  }

  const counts = {
    institutions: await db.institution.count(),
    cases: await db.advocacyCase.count(),
    emails: await db.caseEmail.count(),
  };
  console.log("Seed advokasi selesai:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
