// Create test PDFs: one with a text layer, one "scanned" (image-only)
const fs = require("node:fs");
const { PDFDocument, StandardFonts, rgb } = require("/home/z/.npm-global/lib/node_modules/pdf-lib");

(async () => {
  // 1) Text-layer PDF
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  const lines = [
    "EMPLOYMENT CONTRACT - KONTRAK KERJA",
    "",
    "Article 1: The Employee agrees to work as domestic helper for 24 months.",
    "Pasal 1: Pekerja setuju bekerja sebagai pembantu rumah tangga selama 24 bulan.",
    "Article 4: Salary is 900 SAR per month, payable every 3 months.",
    "Pasal 4: Gaji adalah 900 SAR per bulan, dibayar setiap 3 bulan.",
    "Article 7: The Employer will hold the Employee's passport at all times.",
    "Pasal 7: Pemberi kerja akan menyimpan paspor pekerja setiap saat.",
    "Working hours: 06:00 to 23:00 daily, with one day off per month.",
    "Jam kerja: 06:00 sampai 23:00 setiap hari, satu hari libur per bulan.",
  ];
  let y = 780;
  for (const line of lines) {
    page.drawText(line, { x: 50, y, size: 11, font, color: rgb(0.05, 0.05, 0.05) });
    y -= 22;
  }
  fs.writeFileSync("/home/z/my-project/public/test/contract-text.pdf", await doc.save());
  console.log("contract-text.pdf written");

  // 2) Scanned-style PDF (image only, no text layer) from the Arabic+ID test PNG
  const doc2 = await PDFDocument.create();
  const png = await doc2.embedPng(fs.readFileSync("/home/z/my-project/scripts/test-contract-ar.png"));
  const p2 = doc2.addPage([595, 842]);
  const scale = Math.min(495 / png.width, 742 / png.height);
  p2.drawImage(png, {
    x: 50,
    y: 50,
    width: png.width * scale,
    height: png.height * scale,
  });
  fs.writeFileSync("/home/z/my-project/public/test/contract-scan.pdf", await doc2.save());
  console.log("contract-scan.pdf written");
})();
