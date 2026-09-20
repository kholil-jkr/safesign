import type { Dictionary } from "./dictionary";

export const tl: Dictionary = {
  nativeName: "Tagalog",
  dir: "ltr",
  tagline: "Ligtas na Paggawa",
  heroTitle: "Suriin ang kontrata ng trabaho mo bago pumirma",
  heroSubtitle:
    "I-paste ang kontrata mo sa anumang wika. Makakuha ng buod sa simpleng wika, babala sa mga delikadong klabsa, at mga susunod na hakbang — libre, agad-agad, walang registration.",
  howItWorksTitle: "Paano ito gumagana",
  howItWorks: [
    "Mag-upload ng litrato o file ng kontrata mo (o i-paste ang teksto) — anumang wika.",
    "Binabasa ng SafeSign ang kontrata at tinitingnan ito laban sa listahan ng mga kilalang klabsang pangsasamantala.",
    "Makakakuha ka ng risk rating, paliwanag sa simpleng wika, at kung saan makakakuha ng tunay na tulong.",
  ],
  inputLabel: "Kontrata mo",
  inputHint:
    "Kumuha ng litrato, mag-upload ng file (PDF, Word, litrato), o i-paste ang teksto ng kontrata sa ibaba. Anumang wika ay pwede.",
  inputPlaceholder: "I-paste ang teksto ng kontrata ng trabaho mo dito (anumang wika)…",
  charCount: "{n} karakter",
  uploadTitle: "O i-upload ang kontrata mo",
  uploadCamera: "Camera",
  uploadPhoto: "Mga litrato",
  uploadFile: "File",
  uploadFormatsHint:
    "Litrato (JPG/PNG), PDF, Word (.docx), o TXT — pwedeng maraming file o pahina nang sabay-sabay.",
  uploadCloudHint:
    "Tip: maaari mong pumili ng files mula sa Google Drive, iCloud, OneDrive, o mga dokumento sa WhatsApp gamit ang file picker.",
  uploadFromLink: "Kunin na lang sa link",
  linkPlaceholder: "I-paste ang link ng kontrata (Google Drive, Dropbox, o direct link)…",
  linkImport: "Kunin",
  readingProgress: "Binabasa ang pahina {n} ng {m}…",
  readingFile: "Binabasa ang {name}…",
  orPasteDivider: "o i-paste mismo ang teksto",
  extractDone:
    "Nabasa ang teksto mula sa {n} pahina at nasa kahon sa ibaba na — pakitingnan muna nang maikli, saka pindutin ang “Suriin ang kontrata ko”.",
  extractPartial:
    "Ang unang {n} pahina lamang ang nabasa, para mabilis at nakatuon ang pagsusuri.",
  ocrNoText:
    "Walang nabasang teksto sa litrato. Subukan ulit nang mas malinaw ang kuha, sapat ang liwanag, at tinama tuwid ang angulo mula taas ng pahina.",
  uploadFailed: "Hindi mabasa ang file na ito. Pakisubukan ulit, o i-paste ang teksto.",
  uploadUnsupported:
    "Hindi suportado ang uri ng file na ito. Gumamit ng litrato (JPG/PNG), PDF, Word (.docx), o TXT.",
  uploadTooLarge: "Masyadong malaki ang file (hanggang 15 MB lamang).",
  uploadTooMany:
    "Masyadong maraming file (hanggang {n} lamang). I-upload na lang ang pinakamahalagang pahina.",
  linkInvalid:
    "Hindi magagamit ang link na ito. Gumamit ng direct link sa file, o Google Drive / Dropbox share link.",
  linkFailed:
    "Hindi ma-download ang file mula sa link na ito. Siguraduhing public ang link (“anyone with the link”), o i-download muna ang file saka i-upload dito.",
  uploadPrivacy:
    "Ang mga litrato at file ay ginagamit lamang para mabasa ang teksto, sa session na ito lamang. Walang itinatago.",
  trySample: "Subukan ang halimbawang kontrata",
  clearButton: "Burahin",
  analyzeButton: "Suriin ang kontrata ko",
  analyzing: "Sinusuri ang kontrata mo…",
  analyzingHint:
    "Karaniwang tumatagal ng 15–40 segundo. Binabasa ng SafeSign ang bawat klabsa nang mabuti.",
  resultsTitle: "Resulta ng pagsusuri sa kontrata",
  riskReasonLabel: "Bakit",
  riskLow: "Mababang panganib",
  riskMedium: "Pag-aralan nang mabuti",
  riskHigh: "Mataas na panganib — huwag pumirma nang walang tulong",
  summaryTitle: "Buod sa simpleng wika",
  redFlagsTitle: "Mga delikadong klabsa na nahanap",
  redFlagsCount: "{n} nahanap",
  noRedFlags:
    "Walang nakitang karaniwang pattern ng pang-aabuso. Basahin pa rin nang mabuti ang lahat bago pumirma — hindi ito garantiya.",
  clauseLabel: "Ang klabsa",
  nextStepsTitle: "Maaari mong gawin susunod",
  chatTitle: "Magtanong tungkol sa kontrata mo",
  chatSubtitle:
    "Magtanong pa tungkol sa kontratang ito o sa mga karapatan mo bilang manggagawang migrante.",
  chatIntro:
    "Nabasa ko na ang kontrata mo at ang pagsusuri sa itaas. Itanong mo kahit ano — o pindutin ang isang tanong sa baba.",
  chatPlaceholder: "I-type ang tanong mo…",
  chatSend: "Ipadala",
  quickReplies: [
    "Ano ang ibig sabihin nito?",
    "Delikado ba ito?",
    "Ano ang dapat kong gawin?",
    "Aling klabsa ang dapat kong i-renegotiate?",
  ],
  chatTurnsLeft: "{n} na tanong na ang natitira sa session na ito",
  chatLimitReached:
    "Naabot mo na ang limit ng tanong para sa session na ito. Para sa karagdagang tulong, kontakin ang mga organisasyong nakalista sa ibaba — libre at kompidensyal.",
  offTopicMessage:
    "Tumutulong lang ang assistant na ito sa mga kontrata ng trabaho at karapatan ng manggagawang migrante. Magtanong ng may kaugnayan.",
  newAnalysis: "Suriin ang ibang kontrata",
  errorTitle: "May naganap na mali",
  errorEmpty: "I-paste muna ang teksto ng kontrata mo.",
  errorTooLong:
    "Masyadong mahaba ang teksto. I-paste ang pinakamahalagang bahagi ng kontrata (hanggang humigit-kumulang 20,000 karakter).",
  errorGeneric:
    "Hindi mapag-analisa ng SafeSign ang kontrata ngayon. Subukan ulit sa ilang sandali.",
  tryAgain: "Subukan ulit",
  footerDisclaimerTitle: "Mahalaga",
  footerDisclaimer:
    "Ang SafeSign ay hindi law firm at hindi nagbibigay ng pormal na legal na payo. Kung nagdududa, kontakin ang ahensyang nagpoprotekta sa manggagawang migrante ng bansa mo o ang embahada mo bago pumirma.",
  privacyNote:
    "Walang registration. Ang teksto mo ay sinusuri lang para sa session na ito at hindi itinatago.",
  resourcesTitle: "Tunay na tulong, walang bayad",
  poweredBy: "Libreng tool para sa mga manggagawang migrante sa buong mundo",
};
