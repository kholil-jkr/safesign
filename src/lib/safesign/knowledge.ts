// SafeSign — static red-flag knowledge base + country-adaptive resources.
// Brief §5: bundled in the app and injected as reference context into the
// prompts (simple prompt-stuffing RAG — no vector database for MVP).

/** Globally-common exploitative clause patterns (Brief §6.1 checklist, expanded). */
export const RED_FLAG_CHECKLIST = [
  "Passport or ID confiscation by the employer or agency (the worker must surrender their passport on arrival).",
  "No weekly rest day, or a rest day shorter than 24 hours.",
  "Working hours exceeding 8-10 hours per day with no overtime pay mentioned.",
  "Salary lower than typically promised for the role/destination country, or the salary amount not clearly stated.",
  "Worker required to pay recruitment/placement fees (illegal or heavily restricted under many origin-country laws and ILO standards).",
  "Salary deductions for food, accommodation, insurance or 'agent fees' that are not itemised or agreed.",
  "No clear clause allowing the worker to terminate or transfer employment (sponsorship-lock / 'kafala'-style restrictions, exit permits, or employer consent needed to change jobs or leave the country).",
  "Vague or missing description of job duties (risk of duties being changed after arrival, or 'contract substitution' — signing a new, worse contract on arrival).",
  "Contract written in a language the worker may not read fluently, with no certified translation mentioned or provided.",
  "Any clause restricting communication with family, embassy, or outside contacts, or confiscation of the worker's phone.",
  "Employer-controlled housing with no right to leave the accommodation, or freedom of movement restrictions.",
  "Probation or 'training' periods with unpaid or heavily reduced wages.",
  "Repayment penalties, bonds, or 'breach fees' the worker owes if they leave early.",
  "No mention of medical insurance, workplace injury coverage, or repatriation costs.",
  "Employment terms contingent on deductions that can reduce the wage below the legal minimum.",
  "Clauses binding the worker to disputed debts (loan agreements tied to recruitment) that could make the worker owe money if they leave.",
];

/** Country/regional resource map injected into both prompts. */
export const RESOURCES_TEXT = `
RESOURCE DIRECTORY (for NEXT STEPS recommendations and chat referrals):
Origin-country protection agencies:
- Indonesia: BP2MI (Badan Perlindungan Pekerja Migran Indonesia) — https://www.bp2mi.go.id — WhatsApp hotline 154 (from abroad: +62 812-1545-5005)
- Philippines: DMW / POEA (Department of Migrant Workers) — https://www.dmw.gov.ph — hotline 1348
- Bangladesh: BMET (Bureau of Manpower, Employment and Training) — helpline +880 2 5513-0908
- Nepal: Department of Foreign Employment (DoFE) — helpline 1800 11 0111 / +977 1 444 1601; Nepal Association of Foreign Employment Agencies
- India: eMigrate / Protector General of Emigrants (Ministry of External Affairs) — https://emigrate.gov.in ; MADAD portal for overseas workers
- Pakistan: Bureau of Emigration & Overseas Employment — https://beoe.gov.pk ; Overseas Pakistanis Foundation
- Sri Lanka: SLBFE (Sri Lanka Bureau of Foreign Employment) — https://www.slbfe.lk — hotline 1987
- Ethiopia: Ministry of Labour and Skills, Overseas Employment Service
- Kenya: National Employment Authority (NEA) — https://neaims.go.ke
Always-applicable international resources:
- ILO (International Labour Organization) migrant worker information — https://www.ilo.org/topics/labour-migration
- IOM (International Organization for Migration) — migrant helplines and assistance — https://www.iom.int
- Migrant-Rights.org (Gulf region multilingual guides) — https://www.migrant-rights.org
- Destination-country embassies: the labour attaché / consular section of the worker's own embassy in the destination country.
`;

/** Full knowledge context injected into the analysis system prompt. */
export function buildKnowledgeContext(): string {
  return `RED-FLAG CHECKLIST — compare the contract against every one of these patterns and flag any that appear:
${RED_FLAG_CHECKLIST.map((item, i) => `${i + 1}. ${item}`).join("\n")}
${RESOURCES_TEXT}`;
}
