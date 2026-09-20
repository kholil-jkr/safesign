import type { Dictionary } from "./dictionary";

export const en: Dictionary = {
  nativeName: "English",
  dir: "ltr",
  tagline: "Aman Kerja — Work Safely",
  heroTitle: "Check your employment contract before you sign",
  heroSubtitle:
    "Paste your contract in any language. Get a plain-language summary, red-flag warnings and your next steps — free, instant, no sign-up.",
  howItWorksTitle: "How it works",
  howItWorks: [
    "Upload a photo or a file of your contract (or paste the text) — any language is fine.",
    "SafeSign reads it and checks it against a list of known exploitative clauses.",
    "You get a risk rating, plain-language explanation, and where to get real help.",
  ],
  inputLabel: "Your contract",
  inputHint:
    "Take a photo, upload a file (PDF, Word, photo), or paste the contract text below. Any language is fine.",
  inputPlaceholder: "Paste your employment contract text here (any language)…",
  charCount: "{n} characters",
  uploadTitle: "Or upload your contract",
  uploadCamera: "Camera",
  uploadPhoto: "Photos",
  uploadFile: "File",
  uploadFormatsHint:
    "Photo (JPG/PNG), PDF, Word (.docx) or TXT — you can upload several files or pages.",
  uploadCloudHint:
    "Tip: the file picker can also choose files from Google Drive, iCloud, OneDrive or your WhatsApp documents.",
  uploadFromLink: "Import from a link instead",
  linkPlaceholder: "Paste a link to the contract (Google Drive, Dropbox or direct link)…",
  linkImport: "Import",
  readingProgress: "Reading page {n} of {m}…",
  readingFile: "Reading {name}…",
  orPasteDivider: "or paste the text yourself",
  extractDone:
    "Text extracted from {n} page(s) — it is now in the box below. Please give it a quick check, then tap “Check my contract”.",
  extractPartial:
    "Only the first {n} pages were read, to keep the check quick and focused.",
  ocrNoText:
    "No readable text was found in the photo. Try again with a sharper, well-lit photo taken straight above the page.",
  uploadFailed: "This file could not be read. Please try again, or paste the text manually.",
  uploadUnsupported:
    "This file type is not supported. Please use a photo (JPG/PNG), PDF, Word (.docx) or TXT file.",
  uploadTooLarge: "The file is too large (maximum 15 MB).",
  uploadTooMany:
    "Too many files selected (maximum {n}). Please upload only the most important pages.",
  linkInvalid:
    "This link cannot be used. Please use a direct link to the file, or a Google Drive / Dropbox share link.",
  linkFailed:
    "The file could not be downloaded from this link. Make sure it is public (“anyone with the link”), or download the file first and upload it here.",
  uploadPrivacy:
    "Photos and files are used only to read the text, for this session only. Nothing is stored.",
  trySample: "Try a sample contract",
  clearButton: "Clear",
  analyzeButton: "Check my contract",
  analyzing: "Checking your contract…",
  analyzingHint:
    "This usually takes 15–40 seconds. SafeSign is reading every clause carefully.",
  resultsTitle: "Your contract check",
  riskReasonLabel: "Why",
  riskLow: "Low concern",
  riskMedium: "Review carefully",
  riskHigh: "High risk — do not sign without help",
  summaryTitle: "Plain-language summary",
  redFlagsTitle: "Red flags found",
  redFlagsCount: "{n} found",
  noRedFlags:
    "No common exploitative patterns were detected. Still read everything carefully before you sign — this check is not a guarantee.",
  clauseLabel: "The clause",
  nextStepsTitle: "What you can do next",
  chatTitle: "Ask about your contract",
  chatSubtitle:
    "Ask follow-up questions about this contract or your rights as a migrant worker.",
  chatIntro:
    "I have read your contract and the analysis above. Ask me anything about it — or tap a question below.",
  chatPlaceholder: "Type your question…",
  chatSend: "Send",
  quickReplies: [
    "What does this mean?",
    "Is this dangerous?",
    "What should I do?",
    "Which clause should I try to renegotiate?",
  ],
  chatTurnsLeft: "{n} questions left in this session",
  chatLimitReached:
    "You have reached the question limit for this session. For further help, please contact the organisations listed below — they are free and confidential.",
  offTopicMessage:
    "This assistant only helps with employment contracts and migrant worker rights. Please ask something related to that.",
  newAnalysis: "Check another contract",
  errorTitle: "Something went wrong",
  errorEmpty: "Please paste your contract text first.",
  errorTooLong:
    "The text is too long. Please paste the most important part of the contract (up to about 20,000 characters).",
  errorGeneric:
    "SafeSign could not analyse the contract right now. Please try again in a moment.",
  tryAgain: "Try again",
  footerDisclaimerTitle: "Important",
  footerDisclaimer:
    "SafeSign is not a law firm and does not provide formal legal advice. If in doubt, contact your country's migrant worker protection agency or your embassy before signing.",
  privacyNote:
    "No sign-up. Your text is analysed for this session only and is not stored.",
  resourcesTitle: "Real help, free of charge",
  poweredBy: "Free tool for migrant & overseas workers worldwide",
};
