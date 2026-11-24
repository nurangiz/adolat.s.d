// Adolat SDP Huquqiy Sun'iy Intellekt Maslahatchisi
// O'zbekiston Respublikasi Kodekslari va Qonunlari bo'yicha yuridik xulosalar beruvchi modul

const legalKnowledgeBase = [
  {
    keywords: ['ishdan', 'boshat', 'sababsiz', 'ayol', 'homilador', 'dekret', 'mehnat', 'maosh', 'oylik', 'sinov'],
    code: 'Mehnat kodeksi',
    answer: (q) => `O‘zbekiston Respublikasining yangi tahrirdagi Mehnat kodeksiga muvofiq quyidagi huquqiy kafolatlar belgilangan:\n\n` +
      `1. <b>Sababsiz ishdan bo‘shatish qat’iyan taqiqlanadi:</b> Mehnat kodeksining 161-moddasiga asosan, ish beruvchi xodim bilan mehnat shartnomasini faqatgina qonunda qat’iy ko‘rsatilgan asoslar (korxona tugatilishi, shtat qisqarishi, xodimning malakasi yetarli emasligi yoki mehnat majburiyatlarini muntazam buzganligi) bo‘yichagina bekor qilishi mumkin.\n` +
      `2. <b>Ayollar va onalarni himoya qilish:</b> Mehnat kodeksining 408-moddasiga ko‘ra, homilador ayollar va 3 yoshgacha bolasi bor ayollar bilan mehnat shartnomasini ish beruvchining tashabbusi bilan bekor qilishga mutlaqo yo‘l qo‘yilmaydi (korxona butunlay tugatilgan hollar bundan mustasno).\n` +
      `3. <b>Amaliy yechim va choralar:</b> Agar sizni noqonuniy ravishda ishdan bo‘shatishmoqchi bo‘lishsa, o‘z xohishingiz bilan ariza yozmang! Zudlik bilan Kambag‘allikni qisqartirish va bandlik vazirligi Davlat mehnat inspeksiyasiga hamda "Adolat" SDP yuridik qabulxonasiga murojaat qiling. Noqonuniy bo‘shatilgan taqdirda sud orqali ishga tiklanasiz va barcha majburiy progul kunlari uchun o‘rtacha oylik ish haqingiz undirib beriladi.`
  },
  {
    keywords: ['aliment', 'ajrash', 'farzand', 'bola', 'ota', 'ona', 'nikoh', 'mol-mulk', 'meros'],
    code: 'Oila kodeksi',
    answer: (q) => `O‘zbekiston Respublikasi Oila kodeksi normalariga binoan huquqiy tushuntirish:\n\n` +
      `1. <b>Aliment undirish tartibi:</b> Oila kodeksining 99-moddasiga binoan, voyaga yetmagan bolalar uchun aliment ota-onaning oylik maoshi va boshqa daromadlaridan: 1 nafar bola uchun — to‘rtdan bir qismi (25%), 2 nafar bola uchun — uchdan bir qismi (33%), 3 va undan ortiq bola uchun — yarmi (50%) miqdorida undiriladi.\n` +
      `2. <b>Bo‘yin tovlash oqibatlari:</b> Aliment to‘lamaslik Ma’muriy javobgarlik to‘g‘risidagi kodeksning 47-4-moddasiga binoan 15 sutkagacha ma’muriy qamoqqa, muntazam to‘lamaslik esa Jinoyat kodeksining 122-moddasi bilan jinoiy javobgarlikka sabab bo‘ladi.\n` +
      `3. <b>Amaliy qadam:</b> Fuqarolik ishlari bo‘yicha tumanlararo sudiga sud buyrug‘i chiqarish to‘g‘risida ariza bilan murojaat qilish lozim. Davlat boji to‘lanmaydi.`
  },
  {
    keywords: ['qarz', 'tilxat', 'shartnoma', 'mulk', 'uy', 'kvartira', 'propiska', 'qoshni', 'yer'],
    code: 'Fuqarolik va Uy-joy kodeksi',
    answer: (q) => `Fuqarolik va Uy-joy qonunchiligi bo‘yicha huquqiy xulosa:\n\n` +
      `1. <b>Qarz va majburiyatlar:</b> Fuqarolik kodeksining 732–735-moddalariga ko‘ra, qarz shartnomasi yozma shaklda (tilxat yoki notarial tasdiqlangan) tuzilishi shart. Tilxat sud tartibida qarzni undirish uchun to‘liq yuridik kuchga ega.\n` +
      `2. <b>Mulkdor huquqlari:</b> Fuqarolik kodeksining 164-moddasiga muvofiq, mulkdor o‘z mol-mulkiga egalik qilish, undan foydalanish va tasarruf etish huquqiga ega. Noqonuniy to‘siqlar, qo‘shnilar tomonidan cheklashlar yoki nizolar yuzasidan Fuqarolik kodeksining 188-moddasi bo‘yicha da’vo arizasi kiritiladi.\n` +
      `3. <b>Amaliy harakat:</b> Huquqlaringiz buzilishi holati bo‘yicha dalillarni (tilxat, guvohnoma, fotosuratlar) to‘plagan holda sudga yoki partiyamiz yuristlariga murojaat qilishingiz tavsiya etiladi.`
  },
  {
    keywords: ['jarima', 'gai', 'yhx', 'kamera', 'ichki ishlar', 'IIB', 'xodim', 'haqorat'],
    code: 'Ma’muriy javobgarlik to‘g‘risidagi kodeks',
    answer: (q) => `Ma’muriy huquq bo‘yicha qonuniy tartib:\n\n` +
      `1. <b>Jarimalar ustidan shikoyat:</b> Ma’muriy javobgarlik to‘g‘risidagi kodeksning 315-moddasiga ko‘ra, chiqarilgan ma’muriy qaror ustidan qaror nusxasi olingan kundan boshlab 10 kun ichida yuqori turuvchi organga yoki ma’muriy sudga shikoyat qilish mumkin.\n` +
      `2. <b>Xodimning vakolati:</b> Ichki ishlar organi xodimi fuqaroni to‘xtatganda o‘zini tanishtirishi, xizmat guvohnomasini ko‘rsatishi va qonuniy sababni tushuntirishi shart.\n` +
      `3. <b>Tavsiya:</b> Asossiz qo‘llanilgan jarima yoki huquqbuzarlik bo‘yicha prokuraturaga yoki sudga shikoyat arizasi tayyorlanadi.`
  },
  {
    keywords: ['tadbirkor', 'soliq', 'tekshirish', 'biznes', 'litsenziya', 'kredit', 'bank'],
    code: 'Soliq kodeksi va Tadbirkorlik faoliyati kafolatlari',
    answer: (q) => `Tadbirkorlik va iqtisodiy faoliyat kafolatlari:\n\n` +
      `1. <b>Tekshiruvlar qonuniyligi:</b> "Tadbirkorlik faoliyati erkinligining kafolatlari to‘g‘risida"gi Qonunga binoan, nazorat qiluvchi organlar tomonidan o‘tkaziladigan barcha tekshiruvlar Tadbirkorlarning huquqlarini himoya qilish bo‘yicha vakil (Biznes-ombudsman) bilan kelishilgan bo‘lishi shart.\n` +
      `2. <b>Soliq imtiyozlari:</b> Qonunchilikka asosan yangi tashkil etilgan kichik biznes subyektlari va o‘zini o‘zi band qilgan shaxslar uchun qator soliq yengilliklari belgilangan.\n` +
      `3. <b>Himoya mexanizmi:</b> Huquqlaringiz buzilgan taqdirda Biznes-ombudsmanga yoki "Adolat" SDP fraksiyasiga murojaat qilishingiz mumkin.`
  }
];

function generateLegalAIResponse(questionText) {
  const qLower = (questionText || '').toLowerCase();

  // Find best match in knowledge base
  for (const item of legalKnowledgeBase) {
    const match = item.keywords.some(kw => qLower.includes(kw));
    if (match) {
      return {
        success: true,
        code: item.code,
        answer: item.answer(questionText),
        generatedBy: 'Adolat Yuridik Sun’iy Intellekti (AI)'
      };
    }
  }

  // Comprehensive Legal Framework Response for general questions
  return {
    success: true,
    code: 'O‘zbekiston Respublikasi Qonunchiligi',
    answer: `Hurmatli fuqaro! Siz yo‘llagan masala bo‘yicha quyidagi huquqiy xulosani taqdim etamiz:\n\n` +
      `1. <b>Konstitutsiyaviy kafolat:</b> Yangi tahrirdagi O‘zbekiston Respublikasi Konstitutsiyasining 15-moddasiga binoan, O‘zbekiston Respublikasida O‘zbekiston Respublikasi Konstitutsiyasi va qonunlarining ustunligi so‘zsiz tan olinadi. 55-moddaga muvofiq, har kim o‘z huquq va erkinliklarini qonunda taqiqlanmagan barcha usullar bilan himoya qilishga haqli.\n\n` +
      `2. <b>Huquqiy tahlil:</b> Siz bayon etgan holat yuzasidan O‘zbekiston qonunchiligida huquqiy himoya choralari mavjud. Har qanday shaxsning qonuniy manfaatlari cheklanishiga yo‘l qo‘yilmaydi.\n\n` +
      `3. <b>Amaliy qadamlar:</b>\n` +
      `• Vaziyat yuzasidan barcha yozma hujjatlar, dalillar va guvohlar ko‘rsatmalarini to‘plang;\n` +
      `• O‘zbekiston "Adolat" SDP raqamli portali orqali rasmiy murojaat qoldiring yoki partiya deputatiga murojaat qiling;\n` +
      `• Zarur hollarda tegishli davlat nazorati organi yoki fuqarolik/ma’muriy sudga da’vo arizasi kiritish lozim.\n\n` +
      `Partiyamiz huquqshunoslari sizga amaliy ko‘mak berishga doim tayyor.`,
    generatedBy: 'Adolat Yuridik Sun’iy Intellekti (AI)'
  };
}

module.exports = {
  generateLegalAIResponse
};
