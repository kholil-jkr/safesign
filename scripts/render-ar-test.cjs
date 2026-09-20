// Render Arabic + Indonesian contract image with Chromium (perfect text shaping)
const { chromium } = require("/home/z/.npm-global/lib/node_modules/playwright");
const fs = require("node:fs");

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Noto Sans Arabic', 'Noto Sans', sans-serif; background: #fff; margin: 40px; font-size: 22px; line-height: 1.8; color: #111; }
  h1 { font-size: 26px; text-align: center; }
  .ar { direction: rtl; text-align: right; }
</style></head><body>
<h1>عقد عمل — KONTRAK KERJA</h1>
<div class="ar">
<p>المادة 1: يوافق العامل على العمل كعاملة منزلية لمدة 24 شهرا</p>
<p>المادة 4: الراتب 900 ريال شهريا، يدفع كل 3 أشهر</p>
<p>المادة 7: يحتفظ صاحب العمل بجواز سفر العامل</p>
<p>ساعات العمل: من السادسة صباحا حتى الحادية عشرة مساء يوميا</p>
</div>
<p>Pasal 9: Pekerja tidak diperbolehkan keluar rumah tanpa izin.</p>
</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 900, height: 640 } });
  await page.setContent(html);
  await page.screenshot({ path: "/home/z/my-project/scripts/test-contract-ar.png", fullPage: true });
  await browser.close();
  console.log("saved test-contract-ar.png");
})();
