import { isOffTopic } from "/home/z/my-project/src/lib/safesign/filter";

const cases: Array<[string, boolean, string]> = [
  // [message, expectedBlocked, description]
  ["What's the weather today?", true, "EN weather"],
  ["Write me a poem about love", true, "EN poem"],
  ["Can you give me a recipe for rendang?", true, "EN recipe"],
  ["Who is the president of France?", true, "EN trivia"],
  ["Fix my python code please", true, "EN coding"],
  ["Berikan resep rendang yang enak", true, "ID recipe"],
  ["Tuliskan puisi tentang cinta", true, "ID poem"],
  ["Cuaca hari ini bagus tidak?", true, "ID weather"],
  ["What is the capital of Japan?", true, "EN capital"],
  ["كيف أطبخ الكبسة؟", true, "AR recipe"],
  ["اكتب لي قصيدة عن الحب", true, "AR poem"],
  ["Dame la receta de paella", true, "ES recipe"],
  ["Escribe un poema", true, "ES poem"],
  ["रेसिपी बताओ", true, "HI recipe"],
  ["मौसम कैसा है", true, "HI weather"],
  // On-topic: must NOT be blocked
  ["What does clause 4 about my passport mean?", false, "EN on-topic passport"],
  ["Apakah klausul potongan gaji ini wajar?", false, "ID on-topic salary"],
  ["ما هي حقوقي في عقد العمل؟", false, "AR on-topic rights"],
  ["Is 15 hours a day legal in my contract?", false, "EN on-topic hours"],
  ["Can my employer take my passport?", false, "EN employer question"],
  ["Paano ako makakauwi kung hindi maipanganak ang kontrata?", false, "TL on-topic-ish"],
  ["What should I do if my employer makes me work outside in bad weather?", false, "EN weather-mention but on-topic"],
];

let pass = 0, fail = 0;
for (const [msg, expected, desc] of cases) {
  const got = isOffTopic(msg);
  if (got === expected) { pass++; console.log(`PASS  ${desc}: "${msg.slice(0,40)}" -> blocked=${got}`); }
  else { fail++; console.log(`FAIL  ${desc}: "${msg.slice(0,40)}" -> blocked=${got}, expected ${expected}`); }
}
console.log(`\n${pass}/${pass+fail} passed`);
process.exit(fail > 0 ? 1 : 0);
