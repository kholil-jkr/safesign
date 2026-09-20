// SafeSign — help resources shown in the footer (Brief §6.1 item 4):
// always-available international resources + example national agencies.
// Org names are proper nouns and stay untranslated.

export interface HelpResource {
  name: string;
  url: string;
  note: string; // short scope note (kept in English/Latin script for brevity)
}

export const HELP_RESOURCES: HelpResource[] = [
  {
    name: "ILO — International Labour Organization",
    url: "https://www.ilo.org/topics/labour-migration",
    note: "Global labour standards & migration",
  },
  {
    name: "IOM — International Organization for Migration",
    url: "https://www.iom.int",
    note: "Migrant helplines & assistance",
  },
  {
    name: "Migrant-Rights.org",
    url: "https://www.migrant-rights.org",
    note: "Gulf region, multilingual guides",
  },
  {
    name: "BP2MI (Indonesia)",
    url: "https://www.bp2mi.go.id",
    note: "Indonesian migrant worker protection",
  },
  {
    name: "DMW (Philippines)",
    url: "https://www.dmw.gov.ph",
    note: "Department of Migrant Workers",
  },
];
