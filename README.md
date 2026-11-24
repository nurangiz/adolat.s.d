# O‘zbekiston "Adolat" Sotsial-Demokratik Partiyasi Raqamli Portali

Ushbu platforma O‘zbekiston "Adolat" SDP faoliyatini to‘liq raqamlashtirish, fuqarolar bilan shaffof ikki tomonlama aloqa o‘rnatish, murojaatlarni tezkor ko‘rib chiqish va huquqiy konsultatsiyalar berish uchun yaratilgan mukammal full-stack tizimdir.

---

## 🏛 Asosiy Imkoniyatlar

1. **Fuqarolar Murojaati Portali**:
   - Fuqarolar partiyaga to‘g‘ridan-to‘g‘ri ariza, shikoyat yoki taklif yo‘llay oladi.
   - Aloqa ma’lumotlari, ishonch telefoni (+998 71 233-12-88), qabulxona manzili to‘liq ko‘rsatilgan.
   - Har bir murojaat avtomatik tarzda **Admin panelga** va **Telegram botga** kelib tushadi.

2. **Telegram Bot Integratsiyasi (`@AdolatSD_bot`)**:
   - **Bot Token**: `9086471023:AAHc8zx8SIcKwzsbdYN-e3m8OZl-5OGsnww`
   - **Admin Telegram ID**: `9086471023`
   - Fuqarolar bot orqali ham ro‘yxatdan o‘tib, murojaat yo‘llashi mumkin.
   - Murojaatga javob berilganda, bot orqali fuqaroga to‘g‘ridan-to‘g‘ri rasmiy xabar boradi.
   - Adminlar Telegram bot orqali kelgan murojaat ostidagi "✍️ Javob qaytarish" tugmasi yoki `/javob <id> <matn>` orqali tezkor javob yo‘llay oladi.

3. **Shaffof Huquqiy Savol-Javoblar (Kodekslar bo‘yicha Q&A)**:
   - Fuqaro ro‘yxatdan o‘tgan bo‘lsa-da, ushbu bo‘limda uning shaxsi barchaga **sir tutiladi** (`Fuqaro #ID`).
   - Fuqaroning yozgan savoli kardi ichida **qizil rangda** ajralib turadi.
   - Admin javob berganda, uning akkuntidan o‘sha savol kartasiga javob sifatida **yashil rangda** rasmiy xulosa kiritiladi.
   - Barcha savollar kodekslarga (Mehnat kodeksi, Fuqarolik kodeksi, Oila kodeksi, Jinoyat kodeksi, Ma’muriy javobgarlik, Uy-joy va b.) qarab saralanadi.

4. **Ro‘yxatdan O‘tish va Avtorizatsiya (Auth)**:
   - Ro‘yxatdan o‘tishda 2 ta toifa: **Fuqaro** va **Admin**.
   - Admin bo‘lib ro‘yxatdan o‘tish uchun maxsus rasmiy adminlik kodi kiritilishi shart: **`080910`**.
   - Tizim ro‘yxatdan o‘tgan har bir foydalanuvchini, uning qurilmasini, bergan savollari va murojaatlarini xotirada mustahkam eslab qoladi.
   - Boshqa qurilmadan kirganda ham fuqaro o‘z nomi va paroli bilan bemalol kirib keta oladi.

5. **Rasmiy Admin Boshqaruv Markazi (`/admin.html`)**:
   - Tizim statistikasi (murojaatlar, fuqarolar, savollar, like'lar).
   - Ro‘yxatdan o‘tgan barcha fuqarolar reyestri.
   - Murojaatlarni ko‘rib chiqish va to‘g‘ridan-to‘g‘ri fuqaroning kabinetiga va botiga rasmiy javob yuborish.
   - Shaffof savollarga yashil javob yozish va e’lon qilish.
   - Saytga yangiliklar, bayonotlar va maqolalar joylashtirish.
   - Yangiliklarga bosilgan Like'lar haqida real-vaqtda bildirishnoma olish.

6. **"Server Uhlab Qolmasin" (Never-Sleep Monitor)**:
   - Avtomatik Keep-Alive o‘z-o‘zini monitoring qilish (har 5 daqiqada ichki ping).
   - Uncaught Exception va Unhandled Rejection'lar uchun xavfsiz himoya.
   - Telegram bot uzluksiz long-polling va avto-qayta ulanish tizimi.

---

## 🚀 Ishga Tushirish

```bash
# Dependencylarni o'rnatish
npm install

# Serverni ishga tushirish (Port: 3000)
npm start
```

- Veb-sayt bosh sahifasi: `http://localhost:3000`
- Fuqaro murojaati: `http://localhost:3000/murojaat.html`
- Shaffof savol-javoblar: `http://localhost:3000/savol-javob.html`
- Shaxsiy kabinet: `http://localhost:3000/cabinet.html`
- Admin boshqaruv markazi: `http://localhost:3000/admin.html`
- Telegram bot: `@AdolatSD_bot`

---

## 🔑 Dastlabki Tizim Kirish Ma'lumotlari:

- **Bosh Admin logini**: `admin`
- **Bosh Admin paroli**: `admin123`
- **Adminlik maxfiy kodi**: `080910`
