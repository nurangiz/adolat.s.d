const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Store {
  constructor(filename, initialData = []) {
    this.filePath = path.join(DATA_DIR, filename);
    this.data = initialData;
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(content || '[]');
      } else {
        this.save();
      }
    } catch (err) {
      console.error(`Error loading ${this.filePath}:`, err.message);
      this.data = [];
    }
  }

  save() {
    try {
      const tempPath = this.filePath + '.tmp';
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      console.error(`Error saving ${this.filePath}:`, err.message);
    }
  }

  getAll() {
    return this.data;
  }

  findById(id) {
    return this.data.find(item => String(item.id) === String(id));
  }

  findOne(predicate) {
    return this.data.find(predicate);
  }

  filter(predicate) {
    return this.data.filter(predicate);
  }

  insert(item) {
    if (!item.id) {
      item.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    item.createdAt = item.createdAt || new Date().toISOString();
    this.data.unshift(item);
    this.save();
    return item;
  }

  update(id, updates) {
    const index = this.data.findIndex(item => String(item.id) === String(id));
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data[index];
    }
    return null;
  }

  delete(id) {
    const index = this.data.findIndex(item => String(item.id) === String(id));
    if (index !== -1) {
      const removed = this.data.splice(index, 1)[0];
      this.save();
      return removed;
    }
    return null;
  }
}

// Initial Data seeds for News
const initialNews = [
  {
    id: 'news-1',
    title: 'Adolat SDP: Jamiyatda qonun ustuvorligi va ijtimoiy adolat bosh mezondir',
    category: 'Huquq va Qonunchilik',
    summary: 'Partiya fuqarolarning huquqiy manfaatlarini himoya qilish, qonun ustuvorligini ta’minlash hamda ijtimoiy adolat prinsiplarini qaror toptirish borasidagi tashabbuslarni ilgari surmoqda.',
    content: 'O‘zbekiston "Adolat" sotsial-demokratik partiyasi mamlakatimizda adolatli jamiyat barpo etish, qonun ustuvorligini ta’minlash va inson sha’ni hamda qadr-qimmatini yuksaltirish yo‘lida qator islohotlarni amalga oshirmoqda. Yangi raqamli platforma fuqarolar va partiya o‘rtasida to‘g‘ridan-to‘g‘ri shaffof ko‘prik vazifasini bajaradi.',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
    date: '2026-11-20',
    likesCount: 14,
    likedUsers: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'news-2',
    title: 'Mehnat kodeksida xodimlar huquqlarining kafolatlari kuchaytirildi',
    category: 'Mehnat Kodeksi',
    summary: 'Mehnat munosabatlarida adolat va qonuniylikni ta’minlash yuzasidan yangi qonun loyihalari ishlab chiqildi.',
    content: 'Partiyamiz fraksiyasi tomonidan mehnatkashlarning mehnat sharoitlarini yaxshilash, ortiqcha ish soatlariga haq to‘lash va asossiz ishdan bo‘shatish holatlariga barham berish borasida aniq huquqiy mexanizmlar taklif etildi.',
    imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1200&q=80',
    date: '2026-11-22',
    likesCount: 28,
    likedUsers: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'news-3',
    title: 'Aholiga bepul huquqiy yordam ko‘rsatish bo‘yicha "Adolat qabulxonasi" dasturi kengaytirilmoqda',
    category: 'Ijtimoiy himoya',
    summary: 'Raqamli platforma va bot orqali har bir fuqaro o‘zini qiynayotgan masalalar bo‘yicha partiya yuristlaridan to‘g‘ridan-to‘g‘ri bepul javob oladi.',
    content: 'Endilikda har bir fuqaro partiyaning hududiy kengashlariga kelib o‘tirmasdan, onlayn tarzda murojaat qoldirishi yoki huquqiy kodekslar bo‘yicha shaffof savol-javoblar tizimidan foydalanishi mumkin.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    date: '2026-11-24',
    likesCount: 42,
    likedUsers: [],
    createdAt: new Date().toISOString()
  }
];

// Initial Seed Questions (Shaffof savol-javoblar, qizil savol va yashil admin javoblari bilan)
const initialQuestions = [
  {
    id: 'q-1',
    category: 'Mehnat kodeksi',
    citizenLabel: 'Fuqaro #1042',
    questionText: 'Ish beruvchi sinov muddatida ish haqini to‘liq to‘lamaslikka yoki 50% to‘lashga haqlimi?',
    status: 'answered',
    answerText: 'Yo‘q, mutlaqo haqli emas! O‘zbekiston Respublikasi Mehnat kodeksining 131-moddasiga binoan, dastlabki sinov davrida xodimga qonunchilikda va mehnat shartnomasida belgilangan barcha mehnat huquqlari to‘liq tatbiq etiladi hamda ish haqi to‘liq hajmda to‘lanishi shart.',
    answeredBy: 'Partiya bosh huquqshunosi (Admin)',
    answeredAt: '2026-11-23T14:20:00.000Z',
    createdAt: '2026-11-23T10:15:00.000Z'
  },
  {
    id: 'q-2',
    category: 'Fuqarolik kodeksi',
    citizenLabel: 'Fuqaro #1089',
    questionText: 'Qo‘shnim ruxsatsiz umumiy yo‘lga to‘siq qurib oldi, buni bartaraf etish uchun qanday huquqiy choralar ko‘rish mumkin?',
    status: 'answered',
    answerText: 'Fuqarolik kodeksining 164 va 188-moddalariga muvofiq, mulkdor o‘z huquqlarining har qanday buzilishini bartaraf etishni talab qilishi mumkin. Siz dastlab mahalla fuqarolar yig‘iniga va tuman hokimligining yer nazorati bo‘limiga murojaat qilasiz, agar bartaraf etilmasa sudga nizo bo‘yicha da’vo arizasi kiritiladi.',
    answeredBy: 'Adolat SDP Yuridik Markazi (Admin)',
    answeredAt: '2026-11-24T09:10:00.000Z',
    createdAt: '2026-11-24T08:00:00.000Z'
  },
  {
    id: 'q-3',
    category: 'Oila kodeksi',
    citizenLabel: 'Fuqaro #1105',
    questionText: 'Aliment to‘lashdan qasddan bo‘yin tovlagan shaxslarga nisbatan qanday javobgarlik choralari ko‘riladi?',
    status: 'answered',
    answerText: 'O‘zbekiston Respublikasi Ma’muriy javobgarlik to‘g‘risidagi kodeksning 47-4-moddasiga asosan 15 sutkagacha ma’muriy qamoq, shuningdek O‘zbekiston Respublikasidan chetga chiqish huquqini vaqtincha cheklash qo‘llaniladi. Moddiy ta’minlashdan muntazam bo‘yin tovlash esa Jinoyat kodeksining 122-moddasiga ko‘ra jinoiy javobgarlikka sabab bo‘ladi.',
    answeredBy: 'Partiya yuristi (Admin)',
    answeredAt: '2026-11-24T16:45:00.000Z',
    createdAt: '2026-11-24T12:30:00.000Z'
  }
];

const initialAdmin = [
  {
    id: 'admin-master-1',
    username: 'admin',
    fullName: 'Partiya Bosh Administratori',
    phone: '+998 71 233 12 88',
    role: 'admin',
    passwordHash: '$2b$10$n54uKLfBNy60zEncMK6KXeb09bpZOfDqx7ujmBFhBsLK6usDdJWKy', // admin123
    deviceInfo: 'Tizim Boshqaruvi',
    createdAt: new Date().toISOString()
  }
];

const usersStore = new Store('users.json', initialAdmin);
const appealsStore = new Store('appeals.json', []);
const questionsStore = new Store('questions.json', initialQuestions);
const newsStore = new Store('news.json', initialNews);
const notificationsStore = new Store('notifications.json', []);
const botSessionsStore = new Store('bot_sessions.json', []);

module.exports = {
  usersStore,
  appealsStore,
  questionsStore,
  newsStore,
  notificationsStore,
  botSessionsStore
};
