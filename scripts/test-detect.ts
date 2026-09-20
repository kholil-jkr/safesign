import { detectLangFromLocale, getDictionary, LANGUAGES } from "/home/z/my-project/src/lib/safesign/i18n";

const cases: Array<[string, string]> = [
  ["en-US", "en"], ["id-ID", "id"], ["id", "id"], ["in-ID", "id"],
  ["ar-SA", "ar"], ["ar", "ar"], ["fil-PH", "tl"], ["tl-PH", "tl"],
  ["hi-IN", "hi"], ["bn-BD", "bn"], ["ne-NP", "ne"], ["ur-PK", "ur"],
  ["es-ES", "es"], ["es-MX", "es"], ["am-ET", "am"], ["fr-FR", "en"],
  ["ja-JP", "en"], ["", "en"], [null as unknown as string, "en"],
];

let pass = 0, fail = 0;
for (const [input, expected] of cases) {
  const got = detectLangFromLocale(input);
  if (got === expected) { pass++; }
  else { fail++; console.log(`FAIL: detectLangFromLocale("${input}") = ${got}, expected ${expected}`); }
}
console.log(`${pass}/${pass + fail} detection tests passed`);

// Verify all 10 dictionaries are complete (no missing keys vs English)
const enDict = getDictionary("en") as unknown as Record<string, unknown>;
const enKeys = Object.keys(enDict);
let dictFail = 0;
for (const l of LANGUAGES) {
  const d = getDictionary(l.code) as unknown as Record<string, unknown>;
  for (const k of enKeys) {
    if (d[k] === undefined) { dictFail++; console.log(`MISSING: ${l.code}.${k}`); }
  }
  if (l.dir === "rtl" !== ["ar", "ur"].includes(l.code)) { dictFail++; console.log(`BAD DIR: ${l.code}`); }
}
console.log(dictFail === 0 ? "All 10 dictionaries complete, RTL flags correct" : `${dictFail} dictionary issues`);
process.exit(fail + dictFail > 0 ? 1 : 0);
