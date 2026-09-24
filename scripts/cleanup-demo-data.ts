// Bersihkan DATA DEMO dari database live Neon — repo/self-host harus mulai kosong.
// Dihapus: contracts, approvals, signatures, versions, advocacy cases & emails,
//          analysis logs, SEMUA user (mulai bersih — user pertama = admin).
// DIPERTAHANKAN: institutions (34 — direktori publik) & templates (6 — konten app).
// Run: DATABASE_URL=<neon> bun scripts/cleanup-demo-data.ts [--dry]
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const dry = process.argv.includes("--dry");

async function main() {
  const before = {
    users: await db.user.count(),
    contracts: await db.contract.count(),
    cases: await db.advocacyCase.count(),
    caseEmails: await db.caseEmail.count(),
    analysisLogs: await db.analysisLog.count(),
    institutions: await db.institution.count(),
    templates: await db.template.count(),
  };
  console.log("Sebelum:", before);
  if (dry) {
    console.log("DRY RUN — tidak ada yang dihapus.");
    return;
  }

  await db.analysisLog.deleteMany();
  await db.caseEmail.deleteMany();
  await db.advocacyCase.deleteMany();
  await db.signature.deleteMany();
  await db.approval.deleteMany();
  await db.contractVersion.deleteMany();
  await db.contract.deleteMany();
  await db.user.deleteMany();

  const after = {
    users: await db.user.count(),
    contracts: await db.contract.count(),
    cases: await db.advocacyCase.count(),
    institutions: await db.institution.count(),
    templates: await db.template.count(),
  };
  console.log("Sesudah:", after);
  console.log("Selesai — database bersih, siap dipakai nyata.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
