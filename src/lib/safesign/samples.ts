// SafeSign — sample contracts for demo & testing (Brief §11 Phase 1).
// Synthetic but realistic examples covering different languages and risk levels.

export interface SampleContract {
  lang: string; // contract language hint (the AI auto-detects anyway)
  label: string; // label shown on the button (native script)
}

export const SAMPLE_CONTRACTS: Record<string, string> = {
  // High-risk Gulf-bound domestic worker contract, Bahasa Indonesia
  id: `PERJANJIAN KERJA TENAGA KERJA WANITA (TKW)
Antara PT Cahaya Recruitment (selanjutnya "Perusahaan") dan Siti Aminah (selanjutnya "Pekerja")

Pasal 1 — Pekerja bersedia ditempatkan sebagai Pembantu Rumah Tangga di Riyadh, Arab Saudi selama 2 (dua) tahun penuh tanpa cuti ke Indonesia.

Pasal 2 — Jam kerja adalah 15 (lima belas) jam per hari, mulai pukul 05.00 sampai 20.00 dengan jeda istirahat makan. Tidak ada hari libur mingguan.

Pasal 3 — Gaji pokok sebesar Rp 2.500.000 per bulan, dibayarkan dalam mata uang lokal oleh Majikan setelah potongan biaya penempatan sebesar 6 (enam) bulan gaji pertama.

Pasal 4 — Paspor dan dokumen identitas Pekerja wajib diserahkan kepada Majikan atau Perusahaan untuk "penyimpanan yang aman" selama masa kontrak. Pekerja tidak diperkenankan menyimpan ponsel.

Pasal 5 — Pekerja tidak diperbolehkan keluar rumah majikan tanpa izin tertulis majikan, dan tidak diperbolehkan menghubungi kedutaan atau pihak luar tanpa sepengetahuan majikan.

Pasal 6 — Apabila Pekerja mengundurkan diri sebelum masa kontrak berakhir, Pekerja wajib mengganti seluruh biaya rekrutmen, tiket, dan denda sebesar Rp 50.000.000.

Pasal 7 — Perusahaan berhak mengubah isi perjanjian ini sesuai kebutuhan majikan setelah Pekerja tiba di negara tujuan.

Pasal 8 — Segala perselisihan diselesaikan oleh majikan.`,
  // Medium-risk English contract
  en: `EMPLOYMENT CONTRACT — Domestic Helper
Between: Skyline Employment Agency (the "Agency") and Maria D. Santos (the "Helper")
Place of work: Hong Kong. Contract period: 24 months.

1. Duties: The Helper shall perform household duties as assigned by the Employer from time to time.
2. Salary: HKD 4,300 per month.
3. Working hours: The Helper shall work as required by the household routine, approximately 11 hours per day. Rest day: one rest day per month may be arranged at the Employer's discretion.
4. Food allowance: HKD 500 deducted monthly in lieu of meals provided by the Employer.
5. Termination: Either party may terminate this contract with one month's written notice, except that the Helper shall reimburse the Agency placement fee of HKD 8,000 if terminating within the first 12 months.
6. The Helper agrees to accept any changes to duties reasonably assigned by the Employer, including care work for additional family members.
7. This contract is governed by the law of the place of employment.`,
  // High-risk Arabic contract snippet
  ar: `عقد عمل — عاملة منزلية
بين مكتب الاستقدام النور (الطرف الأول) وبين العاملة نيرمين خ. (الطرف الثاني)

المادة ١: تعمل الطرف الثاني عاملة منزلية لدى كفيلها في مدينة جدة لمدة سنتين كاملتين.

المادة ٢: تلتزم الطرف الثاني بتسليم جواز سفرها وإقامتها إلى الطرف الأول فور وصولها، ويحتفظ الكفيل بكامل الوثائق الرسمية حتى نهاية مدة العقد.

المادة ٣: تتراوح ساعات العمل بين ١٤ إلى ١٦ ساعة يوميًا حسب حاجة الأسرة، ولا يحق للعاملة رفض أي عمل إضافي.

المادة ٤: يستقطع الطرف الأول من راتب العاملة مبلغًا شهريًا لتسديد رسوم الاستقدام والفيزا والتذكرة، ولا يُصرف الراتب الفعلي إلا بعد اكتمال السداد.

المادة ٥: لا يجوز للعاملة ترك مسكن الكفيل أو التواصل مع أي جهة خارجية إلا بإذن الكفيل.

المادة ٦: يحق للكفيل نقل خدمات العاملة أو تعديل بنود العقد بعد وصولها حسب ما يراه مناسبًا.

المادة ٧: في حال الهروب أو الإخلال بالعقد، تلتزم العاملة بدفع تعويض قدره ٢٠,٠٠٠ ريال.`,
};
