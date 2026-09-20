# FINAL PROJECT BRIEF: "SafeSign" (tagline: "Aman Kerja")
## AI Contract Guardian & Rights Consultant for Migrant & Overseas Workers Worldwide

> Dokumen ini adalah versi final dan paling lengkap dari brief proyek — mencakup problem statement, solusi, arsitektur, semua fitur (termasuk konsultasi AI & filter anti-penyalahgunaan), system prompts siap pakai, panduan API key, rencana build, dan teks submission. Dokumen ini menggantikan draft-draft sebelumnya dan siap diberikan ke AI coding assistant (Replit Agent, Cursor, dll) untuk dieksekusi langsung.

---

## 1. The Problem (Real, Urgent, Global — Not Hypothetical)

- **1.5–5.1 billion people worldwide lack meaningful access to justice** (World Justice Project / UN SDG 16.3 research); legal problems are heavily concentrated in employment, housing, and migration issues.
- A specific, severe, well-documented sub-case: **migrant and overseas workers** — from Indonesia, the Philippines, India, Bangladesh, Nepal, and many other countries — routinely sign employment contracts in a language they cannot read, or have their contract **substituted** with worse terms upon arrival in the destination country.
- Documented patterns of harm (Human Rights Watch, Amnesty International, ILO):
  - Workers often **never see the actual contract** before departure, or are forced to sign a new one on arrival without understanding it (common in Gulf countries under the *kafala* sponsorship system, but **the pattern is global**, not limited to one region or language).
  - Illegal recruitment fees, passport confiscation, wage reductions, excessive hours (up to 15 hrs/day vs. legal 8), no weekly rest day, restricted communication with family/embassy.
  - Indonesia alone expects to send **~600,000 workers to Saudi Arabia** after lifting a nearly decade-long moratorium (2025–2026), with **186+ documented abuse complaints already logged in 2022–2024**.
  - This same structural problem — contracts in an unfamiliar language, signed under financial/time pressure, with no independent review — repeats across every major labor migration corridor worldwide (Southeast Asia → Gulf, South Asia → Gulf, Latin America → North America, Africa → Gulf/Europe, etc.).
- **The Gulf region remains the most severe and best-documented case and is prioritized in this project's examples and defaults — but the tool itself is built to be useful to any worker, anywhere in the world, in any language.**

**This fits squarely into LexHack's "Access to Justice & Civic Tech" and "Digital Rights & Policy Tech" tracks, and is a genuinely underserved global need, not a hackathon-only toy problem.**

---

## 2. The Solution

**SafeSign** is a free, single-page web tool that lets any worker, anywhere, **paste their employment contract text** (in any language) and instantly receive:

1. A **plain-language summary and risk analysis**, delivered in the worker's own language (auto-detected from their browser, not defaulted to any single language).
2. **Red-flag detection** against a checklist of globally-common exploitative clause patterns.
3. A clear **risk rating** (Low / Medium / High) that communicates urgency even to someone with limited reading ability, via color + icon.
4. **Actionable next steps** — country-adaptive resource recommendations (national migrant worker protection agencies where identifiable, plus always-available international resources: ILO, IOM, Migrant-Rights.org).
5. An **optional AI consultation chat**, scoped strictly to the contract and to migrant worker rights — so a worker who doesn't understand a red flag can ask follow-up questions and get a real explanation, not just a static report.

**Why this is a genuinely strong project, not just a hackathon demo:**
- It intervenes at the one moment a worker still has leverage: **before signing**, not after they're already trapped.
- The builder has a rare, authentic edge: Arabic literacy (from an Islamic boarding school / *pesantren* background) plus Indonesian — the exact language pair millions of Southeast Asian workers need for Gulf-bound contracts — while the tool itself is architected to generalize to any language, maximizing real-world reach.
- Realistically buildable solo in a hackathon timeframe: no complex backend, no user accounts, no database — core logic is a well-engineered AI prompt plus a curated red-flag knowledge base plus a lightweight chat layer.

---

## 3. Target Users

- **Primary**: Migrant and overseas workers worldwide, preparing to sign or review an employment contract, accessing the tool via a phone browser (often a shared or borrowed phone, often with limited data/time).
- **Secondary**: Family members helping a worker review a contract; recruitment-agency caseworkers; NGO staff and embassy labor attachés who could use it as a fast triage tool.

---

## 4. Feature Set

### 4.1 Core Feature: Contract Analysis (MVP — build this first)

1. **Input**: A text area where the user pastes contract text, in any language.
2. **Process**: Text is sent to an LLM with the Contract Analysis System Prompt (Section 6.1), along with the user's detected/selected UI language.
3. **Output**: Structured results (risk badge, summary, red flags, next steps, disclaimer) rendered in the user's UI language — see Section 6.1 for exact JSON structure.

### 4.2 Multi-Language, Auto-Adapting UI (not a stretch goal — core requirement)

- On page load, detect the user's browser language (`navigator.language` in JS) and set the UI language automatically. **Never default to Indonesian or any single language** — detect first, fall back to English only if the detected language isn't in the supported list.
- Provide a manual language switcher dropdown as a fallback/override, covering at minimum: English, Bahasa Indonesia, Arabic, Tagalog/Filipino, Hindi, Bengali, Nepali, Urdu, Spanish, Amharic. Architect the UI string dictionary as a simple JS object (`{lang_code: {key: string}}`) so more languages can be added later without restructuring code.
- The contract text the user pastes can be in **any language** — the AI auto-detects it. The UI language and the contract's language are independent of each other.
- All AI-generated output (summary, red flags, chat responses) must be generated in the user's UI language, not tied to the contract's language.

### 4.3 AI Consultation Chat (Feature 2 — build after 4.1 and 4.2 work end-to-end)

**Purpose**: After the initial analysis, let the user ask follow-up questions in plain conversation — "Is this actually dangerous?", "What should I do if I still want to take this job?", "Which clause should I try to renegotiate?" — and get a real, contextual answer instead of just a static report.

**Architecture**:
- A chat box appears below the analysis results.
- Each new message is sent to the LLM together with: the original contract text, the prior analysis result, and the recent chat history (cap at the last 5–6 exchanges, not unlimited history) — so the AI has full context without unbounded token growth.
- Chat state lives in a JS variable for the session only — **no persistent storage/database needed** for the MVP.
- Include **quick-reply chips** for common questions ("What does this mean?", "Is this dangerous?", "What should I do?") so users with lower digital literacy or typing difficulty can tap instead of type. Translate these chips per UI language.

**Strict scope enforcement (critical — two-layer filter, see Section 4.4)**: the chat must only answer questions about (a) the pasted contract, or (b) migrant/overseas worker rights and legal help in that context. It must not become a general-purpose chatbot.

**Honesty on uncertainty**: the system prompt must instruct the AI to say "I'm not certain about this specific detail — please confirm with [relevant organization]" rather than guessing on high-stakes legal specifics it isn't confident about. This is a safety requirement, not optional politeness.

### 4.4 Off-Topic Filtering (cost control + abuse prevention — two layers)

**Why**: prevent the chat from being used as a free general-purpose AI chatbot (wastes API quota/cost and is out of scope for a legal-aid tool).

**Layer 1 — Client-side keyword filter (runs in the browser, before any API call):**
- Before a chat message is sent, check it against a simple blocklist/heuristic (common off-topic patterns: recipes, weather, "write me a poem," celebrity gossip, unrelated general knowledge, etc., checked across the app's supported languages).
- If it matches an off-topic pattern, **do not call the API at all** — instantly show a static, pre-written response (not AI-generated): "This assistant only helps with employment contracts and migrant worker rights. Please ask something related to that." (translated per UI language).
- This saves API cost and gives an instant response for the clearest abuse cases.

**Layer 2 — System-prompt-enforced refusal (safety net for whatever Layer 1 misses):**
- Because the app is multi-language, a perfect keyword blocklist across ~10 languages isn't realistic for a solo build — so any message that passes Layer 1 still goes to the LLM with an explicit instruction (see Section 6.2) to briefly and politely refuse anything outside contract/migrant-rights scope, keeping refusals short to minimize token cost on off-topic messages that slip through.

**Optional additional safeguard**: cap the number of chat turns per session (e.g. max 5–8 follow-up messages) to further bound cost and discourage misuse, with a friendly message if the cap is reached (e.g. "For further help, please contact [resource]").

---

## 5. Suggested Architecture

```
[User: phone browser, any language]
      |
      v
[Frontend: single-page HTML/CSS/JS]
   - Language auto-detect (navigator.language) + manual switcher
   - Contract text input
   - Results display (risk badge, summary, red flags, next steps)
   - Chat box (quick-reply chips + free text input)
   - Client-side off-topic keyword filter (Layer 1, Section 4.4)
      |
      v
[Backend: one lightweight API route]
   - Holds the LLM API key server-side (do not expose it in frontend JS)
   - Forwards requests to the LLM: (a) initial contract analysis calls,
     (b) chat consultation calls (with recent history + contract context)
      |
      v
[LLM API] — system prompts in Section 6, with output language parameter
      |
      v
[Static red-flag knowledge base] — a JSON/markdown file bundled in the app
  with known exploitative clause patterns + country-specific resource info
  (BP2MI, POEA/DMW, ILO, IOM, Migrant-Rights.org, etc.), injected as
  reference context into the prompt (simple prompt-stuffing RAG — no
  vector database needed for MVP)
      |
      v
[Structured JSON response] -> parsed and rendered in the UI in the
  user's selected/detected language
```

**Recommended stack for a solo, low-code build:**
- Frontend: plain HTML/CSS/JS (fastest, zero build tooling, works great in Replit on a phone browser).
- Hosting/dev environment: **Replit** (browser-based, nothing to install, gives a live shareable URL automatically — required for Devpost submission).
- Backend: a minimal server route (Replit supports a simple Node/Express or Python/Flask backend alongside the frontend) — used only to keep the API key off the client.
- LLM: see Section 7 for which provider/API key to use.
- No database needed — the app is fully stateless; each session's chat history lives only in browser memory (a JS variable), not persisted anywhere.

---

## 6. System Prompts (ready to hand to the coding AI)

### 6.1 Contract Analysis System Prompt

```
You are "SafeSign," an assistant that helps migrant and overseas workers
anywhere in the world understand employment contracts before signing them.
You are NOT a lawyer and must always include a disclaimer that this is not
formal legal advice.

You will be given: (a) a contract text in any language, and (b) a target
output language code. Do the following, and respond entirely in the target
output language:

1. SUMMARY: Summarize the contract in plain, simple language (avoid legal
   jargon), covering: job role, salary, working hours, rest days, contract
   duration, and any fees mentioned.

2. RED FLAGS: Compare the contract against this checklist of known
   globally-common exploitative patterns and flag any that appear (quote
   the relevant clause if present):
   - Passport or ID confiscation by employer
   - No weekly rest day, or rest day less than 24 hours
   - Working hours exceeding 8-10 hours/day with no overtime pay mentioned
   - Salary lower than what is typically promised for this role/destination
     country, or salary not clearly stated
   - Worker required to pay recruitment/placement fees (illegal or heavily
     restricted under many origin-country laws and ILO standards)
   - No clear clause allowing the worker to terminate or transfer
     employment (sponsorship-lock / "kafala"-style restrictions)
   - Vague or missing description of job duties (risk of duties being
     changed after arrival, or "contract substitution")
   - Contract written in a language the worker may not read fluently, with
     no certified translation mentioned or provided
   - Any clause restricting communication with family, embassy, or outside
     contacts

3. RISK RATING: Give an overall rating: Low concern / Review carefully /
   High risk — do not sign without help, with a one-sentence reason.

4. NEXT STEPS: Recommend concrete next actions. If the contract or context
   indicates a specific origin or destination country, name the relevant
   national body (examples: BP2MI for Indonesia, POEA/DMW for the
   Philippines, relevant ministries for South Asian countries, embassy
   labor attaché of the destination country). Always also mention
   international resources available regardless of country: the
   International Labour Organization (ILO) and International Organization
   for Migration (IOM) migrant worker helplines, and Migrant-Rights.org
   for the Gulf region.

Always end with a disclaimer sentence (translated into the target output
language): "This is not a substitute for formal legal advice. If in doubt,
contact your country's migrant worker protection agency or your embassy
before signing."

Respond ONLY in valid JSON with this exact structure:
{
  "risk_level": "low" | "medium" | "high",
  "risk_reason": "string",
  "summary": "string",
  "red_flags": [{"clause": "string", "explanation": "string"}],
  "next_steps": "string",
  "disclaimer": "string"
}
```

### 6.2 Chat Consultation System Prompt

```
You are "SafeSign," continuing a conversation with a migrant/overseas
worker about a specific employment contract they already had analyzed.
You are NOT a lawyer.

You will be given: the original contract text, the prior structured
analysis (summary, red flags, risk rating), the recent chat history, the
user's new message, and a target output language code.

RULES:
1. SCOPE: Only answer questions about (a) this specific contract, or
   (b) migrant/overseas worker rights and legal help in that general
   context (e.g. how to report abuse, how to contact an embassy, what
   standard contract terms typically look like). If the user's message is
   clearly unrelated to these topics (general chit-chat, unrelated
   knowledge questions, requests to role-play as something else, etc.),
   politely decline in ONE short sentence and redirect them back to the
   contract topic. Do not answer the off-topic question in any form, and
   keep the refusal brief to minimize cost.

2. HONESTY ON UNCERTAINTY: If a question requires specific legal knowledge
   you are not confident about (e.g. a very specific provision of a
   particular country's labor law), say so plainly and point the user to
   the relevant authority (BP2MI, POEA/DMW, embassy labor attaché, ILO,
   IOM, or a local legal aid organization) rather than guessing.

3. TONE: Warm, clear, plain language — assume the user may have limited
   digital literacy and may be reading in a non-native script. Avoid
   legal jargon. Keep answers concise.

4. Always respond in the target output language.

5. If this is one of the last couple of exchanges allowed in this session
   (approaching the turn limit), gently remind the user of the relevant
   next-step resource rather than continuing indefinitely.

Respond in plain text (not JSON) for chat replies — this is a
conversational reply, not a structured report.
```

### 6.3 Layer-1 Off-Topic Filter — Implementation Note for the Coding AI

Implement a lightweight, easily-extendable keyword/pattern list in JS (e.g. an array of regex patterns per supported language) covering obviously off-topic categories: recipes/cooking, weather, entertainment/celebrity topics, generic trivia, "write me a poem/story," coding help unrelated to the app, etc. If a user message matches, do not call the API — show a static, pre-translated refusal message instead. This is a best-effort first pass; Section 6.2's Rule 1 is the safety net for anything this misses.

---

## 7. API Key Strategy (Prototype vs. Production)

**For the hackathon prototype: use a free-tier API key. This is legitimate and expected — not a hack or a loophole.**

- **Google AI Studio** (aistudio.google.com) — free API key with a generous free tier, easy to set up from a phone browser, works well with Replit Agent and similar coding tools.
- **Groq Console** (console.groq.com) — free tier, very fast inference, good for prototyping with open-source models.
- **OpenRouter** (openrouter.ai) — access to multiple models, some genuinely free, useful if one provider's free tier runs out mid-build.

**How to use it safely**: once you have a key, enter it into Replit's **Secrets** panel (not hard-coded into the source file) — the AI coding tool will typically prompt for this automatically when it needs an API key. This keeps the key out of the public GitHub repo required for submission.

**For production (only if the project continues after the hackathon)**: switch to a paid API plan once there's real usage, so the service is reliable and not dependent on free-tier rate limits. This is a natural "v2" step, not something needed for the hackathon submission itself.

---

## 8. Design & UX Requirements

- Must look clean and trustworthy on a small mobile screen — the primary and often only use case, sometimes on a shared/borrowed phone.
- Calm, professional color palette (blues/greens); avoid anything flashy or alarming beyond the risk-color-coding itself.
- Large, legible text, generous spacing, high contrast — assume limited digital literacy and possibly a non-native script/tired eyes after a work shift.
- No login/signup required — must work instantly for a first-time visitor anywhere in the world.
- Linear, single-focus flow: paste contract → wait → see results → (optional) ask follow-up. Avoid presenting too many choices up front.
- Risk badge and color-coding must communicate urgency even across language barriers (🟢🟡🔴 or equivalent, large and prominent).
- Quick-reply chips in the chat for common follow-up questions (see 4.3), translated per UI language.

---

## 9. Alignment with LexHack Judging Criteria

| Criteria | How this project scores |
|---|---|
| Real-World Impact & Feasibility (25%) | Addresses a documented, large-scale, ongoing global harm; realistic to deploy as a free public tool; global scope (not one-country-limited) increases potential reach |
| Technical Execution (25%) | Clean MVP: input → AI analysis → structured output, plus a scoped consultation chat with a real cost-control architecture (two-layer filter) — shows thoughtful engineering, not just a prompt wrapper |
| UX & Design (20%) | Auto-adapting language, large touch targets, quick-reply chips — designed for genuinely low-literacy, high-vulnerability users on basic phones |
| Innovation & Originality (15%) | Most legal-tech hackathon projects target English-speaking, single-country users; this targets a global, multi-language, highly vulnerable population, with a builder who has genuine relevant language expertise |
| Presentation & Documentation (15%) | Use the real statistics in Section 1 in the pitch — grounded, well-researched problem framing lands strongly with judges |

---

## 10. Submission Text (Problem & Solution — adapt in your own words)

> Every year, hundreds of thousands of migrant and overseas workers worldwide sign employment contracts in a language they cannot read, often under financial and time pressure, with no independent review. Human rights organizations have documented widespread cases of passport confiscation, wage reduction, excessive hours, and contract substitution — a pattern that repeats across every major labor migration corridor, from Southeast Asia to the Gulf, South Asia to the Gulf, and beyond. SafeSign lets any worker, anywhere, check their contract in their own language, in minutes, on their phone, before they sign — flagging exploitative clauses, explaining their rights in plain language through an AI consultation chat, and pointing them to real protective resources, at the one moment they still have the power to say no.

---

## 11. Build Plan (Solo, Using AI Coding Tools)

1. **Phase 1 — Core analysis MVP**: Replit project setup, static frontend shell, wire up the LLM call with the Section 6.1 system prompt, test with 2–3 sample contract texts in different languages.
2. **Phase 2 — Multi-language UI**: implement browser-language auto-detect, manual switcher, UI string dictionary.
3. **Phase 3 — Chat consultation**: add the chat UI, wire up Section 6.2 system prompt with context passing (contract + prior analysis + recent history), add quick-reply chips.
4. **Phase 4 — Off-topic filter**: implement the Layer 1 client-side keyword filter (Section 6.3); confirm Layer 2 (system prompt) refusal behavior works for anything that slips through.
5. **Phase 5 — Polish**: mobile responsiveness, risk-badge visual design, resource box, disclaimer placement.
6. **Phase 6 — Submission prep**: record 2–3 minute demo video (screen recording, text captions or narration per earlier discussion), write architecture diagram (can be a simple flowchart image based on Section 5), finalize GitHub repo (public), write submission text using Section 10, submit before deadline (Sep 27, 2026, 5:00pm EDT).

---

## 12. Notes for Whoever Builds This (Replit Agent/Cursor/etc.)

- Prioritize a working end-to-end flow over polish — a working ugly demo beats a broken beautiful one.
- Build Phase 1 (single contract analysis call) completely before adding the chat feature — don't parallelize prematurely.
- Keep each LLM call structured and single-purpose (one call for analysis, one call per chat turn) — no need for multi-agent complexity.
- Always keep the "not formal legal advice" disclaimer visible — both an ethical requirement and something judges will likely look for.
- If time runs short, the chat consultation feature (Section 4.3) and Layer 1 filter (Section 4.4) are the first things to simplify or cut — the core contract analysis (Section 4.1) plus multi-language UI (Section 4.2) is the non-negotiable MVP.
