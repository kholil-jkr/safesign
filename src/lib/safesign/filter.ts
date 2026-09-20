// SafeSign — Layer 1 client-side off-topic filter (Brief §4.4, §6.3).
// Runs in the browser BEFORE any API call. If a message matches an obviously
// off-topic pattern, the API is never called and a static pre-translated
// refusal is shown instead (saves cost, instant response).
//
// This is a best-effort first pass across the app's supported languages;
// the Layer-2 system-prompt refusal (§6.2 Rule 1) is the safety net for
// anything this misses.

// Strong on-topic markers — if any appear, never treat the message as off-topic.
const ON_TOPIC_MARKERS: RegExp[] = [
  // English
  /contract|salary|wage|overtime|passport|visa|sponsor|kafala|embassy|employer|recruitment|agency|rest day|deduction|resign|terminat|rights|work(?:ing)? hours|accommodation|repatriat/i,
  // Bahasa Indonesia
  /kontrak|gaji|upah|majikan|paspor|kedutaan|hak|lembur|potongan|cuti|agen|pekerjaan|surat perjanjian/i,
  // Arabic
  /عقد|راتب|كفيل|تأشيرة|جواز سفر|سفارة|حقوق|استقدام|عمل|خروج/i,
  // Spanish
  /contrato|salario|sueldo|embajada|derechos|empleador|agencia|jornada|horas extra/i,
  // Tagalog
  /kontrata|suweldo|sweldo|pasaporte|embahada|karapatan|ahensiya|trabaho|amo/i,
  // Hindi
  /अनुबंध|तनख्वाह|वेतन|पासपोर्ट|वीजा|दूतावास|अधिकार|मालिक|भर्ती|एजेंसी/i,
  // Bengali
  /চুক্তি|বেতন|পাসপোর্ট|ভিসা|দূতাবাস|অধিকার|নিয়োগ|এজেন্সি|চাকরি/i,
  // Nepali
  /सम्झौता|तलब|रोजगार|पासपोर्ट|भिसा|दूतावास|अधिकार|एजेन्सी/i,
  // Urdu
  /معاہدہ|تنخواہ|پاسپورٹ|ویزا|سفارتخانہ|حقوق|ایجنسی|ملازمت/i,
  // Amharic
  /ውል|ደመወዝ|ፓስፖርት|ቪዛ|ኤምባሲ|መብት|ቅጥር|ኤጀንሲ/i,
];

// Obviously off-topic patterns per category, across supported languages.
const OFF_TOPIC_PATTERNS: RegExp[] = [
  // --- Recipes / cooking ---
  /\brecipe(s)?\b|how to (cook|make) .*(dish|cake|rice|food|bread)|dinner idea/i,
  /\bresep\b|cara masak|masak apa|ide masak/i, // id
  /وصفة|كيف أطبخ|طريقة الطبخ/i, // ar
  /\breceta\b|cómo cocinar|cocinar/i, // es
  /resepi|paano magluto|ano ang iluto/i, // tl
  /रेसिपी|खाना कैसे बनाते|व्यंजन/i, // hi
  /রেসিপি|কীভাবে রান্না|রান্নার/i, // bn
  /रेसिपी|खाना कसरी बनाउने/i, // ne
  /ریسیپی|کھانا کیسے بنائیں/i, // ur
  /የምግብ አዘገጃጀት|እንዴት አብስል/i, // am

  // --- Creative writing requests ---
  /write (me )?(a )?(poem|story|song|essay|joke|speech|letter of love)|love poem/i,
  /(buat|tulis)(kan)? (saya )?(se?buah )?(puisi|cerita|pantun|lagu|lelucon|novel)|tulis cerita/i, // id
  /اكتب (لي )?(قصيدة|قصة|أغنية|مقال|نكتة)/i, // ar
  /escribe (un |una |el )?(poema|cuento|canción|chiste)/i, // es
  /gumawa ka ng (tula|kwento|kanta)|sumulat ng tula/i, // tl
  /(कविता|कहानी|गाना|निबंध) (लिखो|लिखकर दो|बनाओ)/i, // hi
  /(কবিতা|গল্প|গান|প্রবন্ধ) লিখ/i, // bn
  /(कविता|कथा|गीत|निबन्ध) लेख/i, // ne
  /(نظم|کہانی|گانا|مضمون) لکھ/i, // ur
  /(ግጥም|ታሪክ|ዘፈን) ጻፍ|ጽፍልኝ/i, // am

  // --- Weather ---
  /what'?s the weather|weather (today|forecast|like)|will it rain/i,
  /cuaca (hari ini|besok|gimana|bagaimana|apa)/i, // id
  /الطقس (اليوم|غدا|كيف)/i, // ar
  /qué? tiempo hace|clima de hoy|va a llover/i, // es
  /ano ang panahon ngayon|ulan ba bukas/i, // tl
  /मौसम (कैसा|क्या है)|बारिश होगी/i, // hi
  /আবহাওয়া (কেমন|কী)|বৃষ্টি হবে/i, // bn
  /मौसम (कस्तो|के हो)|पानी पर्छ/i, // ne
  /موسم (کیسا ہے|کیا ہے)/i, // ur
  /አየር ሁኔታ (እንዴት|ነው)|ዝናብ ይወርዳል/i, // am

  // --- Celebrity / entertainment / gossip ---
  /celebrity|gossip|who is (dating|married to)|net worth|kim kardashian|hollywood|bollywood/i,
  /gosip|artis|seleb|sinetron|film apa|nonton/i, // id
  /من هي زوجة|من هو صديق|أخبار الفنانين|مسلسل/i, // ar
  /famosos|chismes|telenovela|quién es el novio/i, // es
  /chika|showbiz|artista|teleserye/i, // tl
  /फ़िल्म|बॉलीवुड|अभिनेता|अभिनेत्री|क्रिकेट मैच/i, // hi
  /সিনেমা|অভিনেতা|অভিনেত্রী|গসিপ/i, // bn
  /चलचित्र|नायक|नायिका|गफ/i, // ne
  /فلم|اداکار|گپ شپ/i, // ur
  /የፊልም|ተዋንያን|ወሬ/i, // am

  // --- Generic trivia / homework ---
  /capital of|president of|who invented|solve (this|my) (math|homework)|homework help|what is \d+\s*[\+\-\×x\/\*]\s*\d+/i,
  /ibu kota|siapa presiden|kerjakan pr|soal matematika/i, // id
  /عاصمة|من هو الرئيس|من اخترع|حل واجب/i, // ar
  /capital de|quién es el presidente|quién inventó|deberes de/i, // es
  /kung sino ang presidente|trabaho sa paaralan/i, // tl
  /राजधानी क्या है|गणित का सवाल|होमवर्क/i, // hi
  /রাজধানী কী|গণিতের অঙ্ক|হোমওয়ার্ক/i, // bn
  /राजधानी के हो|गणितको सवाल|गृहकार्य/i, // ne
  /دارالحکومت کون سا|ریاضی کا سوال/i, // ur
  /ዋና ከተማ ማን ነው|የሂሳብ ጥያቄ|የቤት ሥራ/i, // am

  // --- Coding / tech help unrelated to the app ---
  /write (me )?(code|a program|a script)|debug (this|my)|fix my code|\b(javascript|typescript|python|java|c\+\+|sql|html|css)\b|leetcode|stack overflow/i,
  /bikinkan (kode|program)|perbaiki kode|error di python/i, // id
  /اكتب (كود|برنامج)|صحح الكود/i, // ar
  /escríbeme (un )?(código|programa)|arregla mi código/i, // es
  /gawa ka ng code|ayusin ang code/i, // tl
  /कोड लिखो|प्रोग्राम बनाओ/i, // hi
  /কোড লিখ|প্রোগ্রাম বানাও/i, // bn
  /कोड लेख|प्रोग्राम बनाउ/i, // ne
  /کوڈ لکھو|پروگرام بناؤ/i, // ur
  /ኮድ ጻፍ|ፕሮግራም ሠራ/i, // am
];

/**
 * Layer 1 check. Returns true if the message is clearly off-topic and the
 * API call should be skipped (static refusal shown instead).
 */
export function isOffTopic(message: string): boolean {
  const text = message.trim();
  if (!text) return false;

  // On-topic override: contract/migrant-rights vocabulary present → always allow
  for (const marker of ON_TOPIC_MARKERS) {
    if (marker.test(text)) return false;
  }

  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(text));
}
