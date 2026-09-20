import type { Dictionary } from "./dictionary";

export const es: Dictionary = {
  nativeName: "Español",
  dir: "ltr",
  tagline: "Trabajo Seguro",
  heroTitle: "Revisa tu contrato de trabajo antes de firmar",
  heroSubtitle:
    "Pega tu contrato en cualquier idioma. Recibe un resumen en lenguaje sencillo, alertas de cláusulas peligrosas y tus próximos pasos — gratis, al instante, sin registro.",
  howItWorksTitle: "Cómo funciona",
  howItWorks: [
    "Sube una foto o un archivo de tu contrato (o pega el texto) — en cualquier idioma.",
    "SafeSign lo lee y lo compara con una lista de cláusulas de explotación conocidas.",
    "Recibes una valoración de riesgo, una explicación en lenguaje sencillo y dónde conseguir ayuda real.",
  ],
  inputLabel: "Tu contrato",
  inputHint:
    "Toma una foto, sube un archivo (PDF, Word, foto) o pega el texto del contrato abajo. Cualquier idioma está bien.",
  inputPlaceholder: "Pega aquí el texto de tu contrato de trabajo (cualquier idioma)…",
  charCount: "{n} caracteres",
  uploadTitle: "O sube tu contrato",
  uploadCamera: "Cámara",
  uploadPhoto: "Fotos",
  uploadFile: "Archivo",
  uploadFormatsHint:
    "Foto (JPG/PNG), PDF, Word (.docx) o TXT — puedes subir varios archivos o páginas a la vez.",
  uploadCloudHint:
    "Consejo: desde el selector de archivos también puedes elegir archivos de Google Drive, iCloud, OneDrive o documentos de WhatsApp.",
  uploadFromLink: "Importar desde un enlace",
  linkPlaceholder: "Pega el enlace del contrato (Google Drive, Dropbox o enlace directo)…",
  linkImport: "Importar",
  readingProgress: "Leyendo página {n} de {m}…",
  readingFile: "Leyendo {name}…",
  orPasteDivider: "o pega el texto tú mismo",
  extractDone:
    "Se extrajo el texto de {n} página(s) y ya está en el cuadro de abajo — revísalo rápidamente y luego toca “Revisar mi contrato”.",
  extractPartial:
    "Solo se leyeron las primeras {n} páginas, para que la revisión sea rápida y centrada.",
  ocrNoText:
    "No se encontró texto legible en la foto. Prueba de nuevo con una foto más nítida, con buena luz y tomada justo encima de la página.",
  uploadFailed: "No se pudo leer este archivo. Inténtalo de nuevo o pega el texto manualmente.",
  uploadUnsupported:
    "Este tipo de archivo no es compatible. Usa una foto (JPG/PNG), PDF, Word (.docx) o TXT.",
  uploadTooLarge: "El archivo es demasiado grande (máximo 15 MB).",
  uploadTooMany:
    "Demasiados archivos seleccionados (máximo {n}). Sube solo las páginas más importantes.",
  linkInvalid:
    "Este enlace no se puede usar. Usa un enlace directo al archivo o un enlace compartido de Google Drive / Dropbox.",
  linkFailed:
    "No se pudo descargar el archivo desde este enlace. Asegúrate de que el enlace sea público (“cualquiera con el enlace”), o descarga el archivo primero y súbelo aquí.",
  uploadPrivacy:
    "Las fotos y archivos solo se usan para leer el texto, en esta sesión únicamente. No se guarda nada.",
  trySample: "Probar con un contrato de ejemplo",
  clearButton: "Borrar",
  analyzeButton: "Revisar mi contrato",
  analyzing: "Revisando tu contrato…",
  analyzingHint:
    "Normalmente tarda entre 15 y 40 segundos. SafeSign está leyendo cada cláusula con detenimiento.",
  resultsTitle: "Resultado de la revisión",
  riskReasonLabel: "Por qué",
  riskLow: "Riesgo bajo",
  riskMedium: "Revisa con cuidado",
  riskHigh: "Riesgo alto — no firmes sin ayuda",
  summaryTitle: "Resumen en lenguaje sencillo",
  redFlagsTitle: "Cláusulas peligrosas encontradas",
  redFlagsCount: "{n} encontradas",
  noRedFlags:
    "No se detectaron patrones comunes de explotación. Aun así, lee todo con cuidado antes de firmar — esta revisión no es una garantía.",
  clauseLabel: "La cláusula",
  nextStepsTitle: "Qué puedes hacer a continuación",
  chatTitle: "Pregunta sobre tu contrato",
  chatSubtitle:
    "Haz preguntas de seguimiento sobre este contrato o tus derechos como trabajador migrante.",
  chatIntro:
    "He leído tu contrato y el análisis de arriba. Pregúntame lo que quieras — o toca una pregunta abajo.",
  chatPlaceholder: "Escribe tu pregunta…",
  chatSend: "Enviar",
  quickReplies: [
    "¿Qué significa esto?",
    "¿Es peligroso?",
    "¿Qué debo hacer?",
    "¿Qué cláusula debo intentar renegociar?",
  ],
  chatTurnsLeft: "Quedan {n} preguntas en esta sesión",
  chatLimitReached:
    "Has alcanzado el límite de preguntas de esta sesión. Para más ayuda, contacta con las organizaciones que aparecen abajo — son gratuitas y confidenciales.",
  offTopicMessage:
    "Este asistente solo ayuda con contratos de trabajo y derechos de trabajadores migrantes. Por favor, pregunta algo relacionado con eso.",
  newAnalysis: "Revisar otro contrato",
  errorTitle: "Algo salió mal",
  errorEmpty: "Primero pega el texto de tu contrato.",
  errorTooLong:
    "El texto es demasiado largo. Pega la parte más importante del contrato (hasta unos 20.000 caracteres).",
  errorGeneric:
    "SafeSign no pudo analizar el contrato en este momento. Inténtalo de nuevo en unos momentos.",
  tryAgain: "Intentar de nuevo",
  footerDisclaimerTitle: "Importante",
  footerDisclaimer:
    "SafeSign no es un bufete de abogados y no ofrece asesoría legal formal. Ante la duda, contacta con la agencia de protección de trabajadores migrantes de tu país o con tu embajada antes de firmar.",
  privacyNote:
    "Sin registro. Tu texto se analiza solo para esta sesión y no se almacena.",
  resourcesTitle: "Ayuda real, gratis",
  poweredBy: "Herramienta gratuita para trabajadores migrantes y del extranjero",
};
