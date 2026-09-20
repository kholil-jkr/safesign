import type { Dictionary } from "./dictionary";

export const am: Dictionary = {
  nativeName: "አማርኛ",
  dir: "ltr",
  tagline: "የተጠበቀ ሥራ",
  heroTitle: "ከመፈረምዎ በፊት የሥራ ውልዎን ያረጋግጡ",
  heroSubtitle:
    "ውልዎን በማንኛውም ቋንቋ ይለጥፉ። በቀላል ቋንቋ ያለ ማጠቃለያ፣ ስለ አደገኛ አንቀጾች ማስጠንቀቂያዎችን እና ቀጣይ እርምጃዎችን ያግኙ — በነጻ፣ በፍጥነት፣ ያለ ምዝገባ።",
  howItWorksTitle: "እንዴት እንደሚሠራ",
  howItWorks: [
    "የውልዎን ፎቶ ወይም ፋይል ይስቀሉ (ወይም ጽሑፉን ይለጥፉ) — በማንኛውም ቋንቋ።",
    "SafeSign ውሉን ያንብባል እና ከታወቁ የጥቃት አንቀጾች ዝርዝር ጋር ያረጋግጣል።",
    "የአደጋ ደረጃ፣ በቀላል ቋንቋ ያለ ማብራሪያ እና እውነተኛ እርዳታ የሚገኝበትን ቦታ ያገኛሉ።",
  ],
  inputLabel: "ውልዎ",
  inputHint:
    "ፎቶ ይያዙ፣ ፋይል ይስቀሉ (PDF፣ Word፣ ፎቶ)፣ ወይም ከታች የውሉን ጽሑፍ ይለጥፉ። ማንኛውም ቋንቋ ይሆናል።",
  inputPlaceholder: "የሥራ ውልዎን ጽሑፍ እዚህ ይለጥፉ (በማንኛውም ቋንቋ)…",
  charCount: "{n} ፊደላት",
  uploadTitle: "ወይም ውሉን ይስቀሉ",
  uploadCamera: "ካሜራ",
  uploadPhoto: "ፎቶዎች",
  uploadFile: "ፋይል",
  uploadFormatsHint:
    "ፎቶ (JPG/PNG)፣ PDF፣ Word (.docx) ወይም TXT — በአንድ ጊዜ ብዙ ፋይሎች ወይም ገጾች ሊሆኑ ይችላሉ።",
  uploadCloudHint:
    "ምክር፦ ከፋይል መምረጫው ውስጥ Google Drive፣ iCloud፣ OneDrive ወይም የ WhatsApp ሰነዶችን መምረጥ ይችላሉ።",
  uploadFromLink: "ከአገናኝ አስገባ",
  linkPlaceholder: "የውሉን አገናኝ ይለጥፉ (Google Drive፣ Dropbox ወይም ቀጥታ አገናኝ)…",
  linkImport: "አስገባ",
  readingProgress: "ገጽ {n} ከ{m} በማንበብ ላይ…",
  readingFile: "{name} በማንበብ ላይ…",
  orPasteDivider: "ወይም ጽሑፉን ራስዎ ይለጥፉ",
  extractDone:
    "ከ{n} ገጾች ጽሑፍ ተቀንሶ በታች ባለው ሳጥን ውስጥ ገብቷል — እባክዎ በፍጥነት ያረጋግጡት፣ ከዚያ “ውሌን ያረጋግጡ” ይንኩ።",
  extractPartial:
    "ለፈጣን እና አተኩሮ ማረጋገጫ የመጀመሪያዎቹን {n} ገጾች ብቻ ተነብባል።",
  ocrNoText:
    "በፎቶው ውስጥ ሊነበብ የሚችል ጽሑፍ አልተገኘም። ይበልጥ ግልጽ፣ ብርሃን በበጀ እና ገጹ በቀጥታ ከላይ የተነሳ ፎቶ በመያዝ እንደገና ይሞክሩ።",
  uploadFailed: "ይህ ፋይል ሊነበብ አልቻለም። እንደገና ይሞክሩ፣ ወይም ጽሑፉን ራስዎ ይለጥፉ።",
  uploadUnsupported:
    "ይህ የፋይል አይነት አይደገፍም። ፎቶ (JPG/PNG)፣ PDF፣ Word (.docx) ወይም TXT ፋይል ይጠቀሙ።",
  uploadTooLarge: "ፋይሉ በጣም ትልቅ ነው (ከፍተኛው 15 MB)።",
  uploadTooMany:
    "በጣም ብዙ ፋይሎች ተመርጠዋል (ከፍተኛው {n})። እባክዎ አስፈላጊዎቹን ገጾች ብቻ ይስቀሉ።",
  linkInvalid:
    "ይህ አገናኝ መጠቀም አይቻልም። የፋይሉን ቀጥታ አገናኝ ወይም Google Drive / Dropbox ማጋሪያ አገናኝ ይጠቀሙ።",
  linkFailed:
    "ከዚህ አገናኝ ፋይሉ መውረድ አልቻለም። አገናኙ ይፋዊ (“አገናኙ ያለው ማንኛውም ሰው”) መሆኑን ያረጋግጡ፣ ወይም ፋይሉን መጀመሪያ ወርደው እዚህ ይስቀሉት።",
  uploadPrivacy:
    "ፎቶዎችና ፋይሎች ጽሑፉን ለማንበብ ብቻ፣ በዚህ ክፍለ-ጊዜ ብቻ ይጠቀማሉ። ምንም አይቀመጥም።",
  trySample: "ናሙና ውል ይሞክሩ",
  clearButton: "አጽዳ",
  analyzeButton: "ውሌዬን ያረጋግጡ",
  analyzing: "ውልዎ በመፈተሽ ላይ ነው…",
  analyzingHint:
    "በተለምዶ ፲፭–፵ ሰከንድ ይወስዳል። SafeSign እያንዳንዱን አንቀጽ በጥንቃቄ እየተነተነ ነው።",
  resultsTitle: "የውል ምርመራ ውጤት",
  riskReasonLabel: "ለምን",
  riskLow: "ዝቅተኛ ስጋት",
  riskMedium: "በጥንቃቄ ይመልከቱ",
  riskHigh: "ከፍተኛ ስጋት — ያለ እርዳታ አይፈርሙ",
  summaryTitle: "በቀላል ቋንቋ ማጠቃለያ",
  redFlagsTitle: "አደገኛ አንቀጾች ተገኝተዋል",
  redFlagsCount: "{n} ተገኝተዋል",
  noRedFlags:
    "የተለመዱ የጥቃት አማራጮች አልተገኙም። ሆኖም ከመፈረምዎ በፊት ሁሉንም በጥንቃቄ ያንብቡ — ይህ ምርመራ ዋስትና አይደለም።",
  clauseLabel: "አንቀጹ",
  nextStepsTitle: "ቀጣይ ምን ማድረግ ይችላሉ",
  chatTitle: "ስለ ውልዎ ይጠይቁ",
  chatSubtitle:
    "ስለዚህ ውል ወይም እንደ ተሰዶ ሠራተኛ ያለዎት መብት ተጨማሪ ጥያቄዎችን ይጠይቁ።",
  chatIntro:
    "ውልዎን እና ከላይ ያለውን ትንተና አንብቤያለሁ። ስለዚህ ማንኛውንም ጥያቄ ይጠይቑ — ወይም ከታች ያለ ጥያቄ ላይ ይንኩ።",
  chatPlaceholder: "ጥያቄዎን ይጻፉ…",
  chatSend: "ላክ",
  quickReplies: [
    "ይህ ምን ማለት ነው?",
    "ይህ አደገኛ ነው?",
    "ምን ማድረግ አለብኝ?",
    "የትኛው አንቀጽ እንደገና መወያየት ይገባል?",
  ],
  chatTurnsLeft: "በዚህ ክፍለ ጊዜ {n} ጥያቄዎች ቀርተዋል",
  chatLimitReached:
    "በዚህ ክፍለ ጊዜ ያለውን የጥያቄ ገደብ ደርሰዋል። ለተጨማሪ እርዳታ ከታች ከተዘረዘሩት ተቋማት ጋር ይገናኙ — ነጻ እና ሚስጥራዊ ናቸው።",
  offTopicMessage:
    "ይህ አጋዥ ስለ ሥራ ውሎች እና የተሰዶ ሠራተኞች መብት ብቻ ይረዳል። እባክዎ ተዛማጅ ጥያቄ ይጠይቁ።",
  newAnalysis: "ሌላ ውል ያረጋግጡ",
  errorTitle: "ችግር አጋጥሟል",
  errorEmpty: "እባክዎ መጀመሪያ የውልዎን ጽሑፍ ይለጥፉ።",
  errorTooLong:
    "ጽሑፉ በጣም ረጅም ነው። እባክዎ ከውሉ በጣም አስፈላጊውን ክፍል ይለጥፉ (እስከ ወደ 20,000 ፊደዋት ገደማ)።",
  errorGeneric:
    "SafeSign በዚህ ጊዜ ውሉን መተንተን አልቻለም። እባክዎ በደቂቃ ውስጥ እንደገና ይሞክሩ።",
  tryAgain: "እንደገና ይሞክሩ",
  footerDisclaimerTitle: "አስፈላጊ",
  footerDisclaimer:
    "SafeSign የሕግ ቤት አይደለም እና በይፋ የሕግ ምክር አይሰጥም። ጥርጣሬ ካለዎት ከመፈረምዎ በፊት ከሀገርዎ የተሰዶ ሠራተኞች ጥበቃ ኤጀንሲ ወይም ከኤምባሲዎ ጋር ይገናኙ።",
  privacyNote:
    "ያለ ምዝገባ። ጽሑፍዎ ለዚህ ክፍለ ጊዜ ብቻ ይተነተናል እና አይቀመጥም።",
  resourcesTitle: "እውነተኛ እርዳታ፣ በነጻ",
  poweredBy: "ለዓለም አቀፉ ተሰዶ እና በውጭ የሚሠሩ ሠራተኞች ነጻ መሣሪያ",
};
