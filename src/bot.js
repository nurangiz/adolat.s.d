const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { appealsStore, usersStore, questionsStore, notificationsStore } = require('./db');

const BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;
const ADMIN_CHATS_FILE = path.join(__dirname, '..', 'data', 'admin_chats.json');

// Manage persistent Admin Chat IDs
function loadAdminChats() {
  try {
    if (fs.existsSync(ADMIN_CHATS_FILE)) {
      const content = fs.readFileSync(ADMIN_CHATS_FILE, 'utf8');
      const list = JSON.parse(content || '[]');
      return new Set(list.map(String));
    }
  } catch (e) {
    console.error('Error loading admin chats:', e.message);
  }
  return new Set();
}

function saveAdminChats(chatIdsSet) {
  try {
    const list = Array.from(chatIdsSet);
    fs.writeFileSync(ADMIN_CHATS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving admin chats:', e.message);
  }
}

const adminChatIds = loadAdminChats();

// Helper: Make Telegram HTTPS Request
function callTelegram(method, body = {}) {
  return new Promise((resolve) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${BOT_TOKEN}/${method}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 25000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ ok: false, error: 'JSON parse error' });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Request timeout' });
    });

    req.write(payload);
    req.end();
  });
}

// Send Message
async function sendMessage(chatId, text, extra = {}) {
  // Never send to bot's own ID
  if (String(chatId) === '9086471023') return { ok: false, description: 'Cannot send to bot itself' };
  
  return await callTelegram('sendMessage', {
    chat_id: chatId,
    text: text,
    parse_mode: 'HTML',
    ...extra
  });
}

// Add Admin Chat ID explicitly
function addAdminChatId(chatId) {
  const cid = String(chatId).trim();
  if (!cid || cid === '9086471023') return false;
  adminChatIds.add(cid);
  saveAdminChats(adminChatIds);
  console.log(`[Telegram]: Admin ID qo'shildi: ${cid}`);
  sendMessage(cid, `🏛 <b>Siz "Adolat" SDP tizimiga muvaffaqiyatli ulandingiz!</b>\n\nSizning Telegram ID: <code>${cid}</code>.\nEndi fuqarolar saytdan yo‘llagan barcha arizalar va savollar sizga yuboriladi.`);
  return true;
}

// Notify all admins about new appeal
async function notifyAdminsNewAppeal(appeal) {
  console.log(`[Telegram]: Fuqaro arizasi haqida adminga xabar tayyorlanmoqda... (Adminlar: ${adminChatIds.size})`);
  const message = `🚨 <b>YANGI FUQARO MUROJAATI KELIB TUSHDI!</b>\n\n` +
    `🆔 <b>Murojaat raqami:</b> #${appeal.id}\n` +
    `👤 <b>Fuqaro:</b> ${escapeHtml(appeal.fullName)}\n` +
    `📞 <b>Aloqa:</b> ${escapeHtml(appeal.phone)}\n` +
    `📌 <b>Mavzu:</b> ${escapeHtml(appeal.subject || 'Umumiy')}\n` +
    `💬 <b>Murojaat matni:</b>\n<i>${escapeHtml(appeal.message)}</i>\n\n` +
    `🌐 <b>Manba:</b> ${appeal.source === 'telegram' ? 'Telegram Bot' : 'Rasmiy Veb-Sayt'}\n` +
    `📅 <b>Vaqt:</b> ${new Date(appeal.createdAt).toLocaleString('uz-UZ')}`;

  const keyboard = {
    inline_keyboard: [
      [{ text: '✍️ Javob qaytarish', callback_data: `reply_appeal_${appeal.id}` }]
    ]
  };

  for (const adminId of adminChatIds) {
    await sendMessage(adminId, message, { reply_markup: keyboard });
  }
}

// Notify admins about new question
async function notifyAdminsNewQuestion(question) {
  console.log(`[Telegram]: Yangi savol haqida adminga xabar jo'natilmoqda... (Adminlar: ${adminChatIds.size})`);
  const message = `⚖️ <b>YANGI HUQUQIY SAVOL (KODEKSLAR)!</b>\n\n` +
    `🏷 <b>Soha / Kodeks:</b> ${escapeHtml(question.category)}\n` +
    `👤 <b>Kimdan:</b> ${question.citizenLabel} (Shaxs sir tutiladi)\n` +
    `❓ <b>Savol:</b> <i>${escapeHtml(question.questionText)}</i>\n\n` +
    `Ushbu savolga saytning Admin panelidan yoki bot orqali rasmiy yashil javob berishingiz mumkin.`;

  for (const adminId of adminChatIds) {
    await sendMessage(adminId, message);
  }
}

// Notify admins when citizen likes news
async function notifyAdminsNewsLike(newsItem, user) {
  const userName = user ? (user.fullName || user.username) : 'Anonim fuqaro';
  const message = `❤️ <b>YANGILIKKA LIKE BOSILDI!</b>\n\n` +
    `👤 <b>Fuqaro:</b> ${escapeHtml(userName)}\n` +
    `📰 <b>Yangilik:</b> "${escapeHtml(newsItem.title)}"\n` +
    `👍 <b>Jami like'lar:</b> ${newsItem.likesCount} ta\n` +
    `📅 <b>Vaqt:</b> ${new Date().toLocaleTimeString('uz-UZ')}`;

  for (const adminId of adminChatIds) {
    await sendMessage(adminId, message);
  }
}

// Send reply to citizen via Telegram
async function sendReplyToCitizenTelegram(chatId, appeal, replyText) {
  try {
    const msg = `🏛 <b>"Adolat" SDP - Murojaatingizga rasmiy javob:</b>\n\n` +
      `Hurmatli ${escapeHtml(appeal.fullName)},\n` +
      `Sizning #${appeal.id} raqamli ("<i>${escapeHtml(appeal.subject || 'Umumiy')}</i>") murojaatingiz partiya mas’ul vakillari tomonidan atroflicha o‘rganib chiqildi.\n\n` +
      `🟢 <b>Rasmiy javob:</b>\n${escapeHtml(replyText)}\n\n` +
      `Adolat va qonun ustuvorligi yo‘lida birgamiz!`;
    await sendMessage(chatId, msg);
  } catch (err) {
    console.error('Failed to notify citizen via Telegram:', err.message);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const userStates = {};
let notifyWeb = null;

async function handleTelegramMessage(msg) {
  if (!msg || !msg.chat) return;

  const chatId = String(msg.chat.id);
  const text = msg.text ? msg.text.trim() : '';
  const name = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ') || msg.from.username || 'Foydalanuvchi';

  // Automatically register any person who texts bot as potential admin or user!
  // If user enters 080910 or /admin 080910, confirm as admin
  if (text === config.ADMIN_SECRET_CODE || text === `/admin ${config.ADMIN_SECRET_CODE}` || text === '/admin') {
    addAdminChatId(chatId);
    return;
  }

  // Auto-track admin if they initiate chat or type /start
  if (!adminChatIds.has(chatId)) {
    // Add to admin chats automatically so they receive notifications!
    addAdminChatId(chatId);
  }

  // /start
  if (text === '/start') {
    userStates[chatId] = { step: 'IDLE' };

    const welcomeMsg = `Assalomu alaykum, muhtaram <b>${escapeHtml(name)}</b>!\n\n` +
      `🏛 <b>O‘zbekiston "Adolat" sotsial-demokratik partiyasining rasmiy raqamli muloqot botiga xush kelibsiz!</b>\n\n` +
      `🎯 <b>Maqsadimiz:</b> Jamiyatda ijtimoiy adolat va qonun ustuvorligini ta’minlash, fuqarolarimizning har bir murojaati va huquqiy savoliga shaffof hamda tezkor yechim topish.\n\n` +
      `Sizning Telegram ID: <code>${chatId}</code> (Tizimga ulandi ✅)\n\n` +
      `<i>Quyidagi menyu orqali kerakli xizmatni tanlang:</i>`;

    const keyboard = {
      keyboard: [
        [{ text: '✍️ Partiyaga murojaat yo‘llash' }, { text: '⚖️ Kodekslar bo‘yicha savol berish' }],
        [{ text: '📂 Mening murojaatlarim' }, { text: '👑 Admin boshqaruv holati' }],
        [{ text: 'ℹ️ Partiya haqida va Aloqa' }]
      ],
      resize_keyboard: true
    };

    await sendMessage(chatId, welcomeMsg, { reply_markup: keyboard });
    return;
  }

  // Admin status
  if (text === '👑 Admin boshqaruv holati') {
    const totalAppeals = appealsStore.getAll().length;
    const pendingAppeals = appealsStore.filter(a => a.status === 'new').length;
    const totalUsers = usersStore.getAll().length;
    const totalQuestions = questionsStore.getAll().length;
    await sendMessage(chatId, `📊 <b>Adolat SDP - Tizim statistikasi:</b>\n\n` +
      `👥 Jami ro‘yxatdan o‘tgan fuqarolar: ${totalUsers} nafar\n` +
      `📩 Jami kelib tushgan murojaatlar: ${totalAppeals} ta\n` +
      `⏳ Ko‘rib chiqilishi kutilayotgan murojaatlar: ${pendingAppeals} ta\n` +
      `⚖️ Huquqiy Q&A savollari: ${totalQuestions} ta\n\n` +
      `Barcha murojaatlarni veb admin panelda ham to‘liq nazorat qilishingiz mumkin.`);
    return;
  }

  // Partiya haqida
  if (text === 'ℹ️ Partiya haqida va Aloqa') {
    const info = `🏛 <b>O‘zbekiston "Adolat" sotsial-demokratik partiyasi</b>\n\n` +
      `🔹 <b>Shior:</b> "Kuch — adolatda!"\n` +
      `🔹 <b>Asosiy maqsad:</b> Huquqiy demokratik davlat, kuchli fuqarolik jamiyati va ijtimoiy adolatni qaror toptirish.\n\n` +
      `📞 <b>Ishonch telefoni:</b> +998 (71) 233-12-88\n` +
      `📧 <b>Elektron pochta:</b> info@adolat.uz\n` +
      `📍 <b>Manzil:</b> Toshkent sh., Chilonzor tumani, Bunyodkor ko'chasi 42-uy`;
    await sendMessage(chatId, info);
    return;
  }

  // Mening murojaatlarim
  if (text === '📂 Mening murojaatlarim') {
    const userAppeals = appealsStore.filter(a => String(a.telegramChatId) === chatId);
    if (userAppeals.length === 0) {
      await sendMessage(chatId, 'Sizda hozircha bot orqali yuborilgan murojaatlar mavjud emas.');
      return;
    }

    let responseText = `📑 <b>Sizning murojaatlaringiz ro‘yxati (${userAppeals.length} ta):</b>\n\n`;
    userAppeals.forEach((a, i) => {
      const statusIcon = a.status === 'answered' ? '🟢 Javob berilgan' : (a.status === 'in_progress' ? '🟡 Ko‘rib chiqilmoqda' : '🔴 Yangi');
      responseText += `<b>${i + 1}. Murojaat ID: #${a.id}</b>\n` +
        `📌 Mavzu: ${escapeHtml(a.subject || 'Belgilanmagan')}\n` +
        `📊 Holat: ${statusIcon}\n` +
        `📅 Sana: ${new Date(a.createdAt).toLocaleString('uz-UZ')}\n`;
      if (a.adminReply) {
        responseText += `\n💬 <b>Partiya rasmiy javobi:</b>\n<i>${escapeHtml(a.adminReply)}</i>\n`;
      }
      responseText += `───────────────────\n`;
    });

    await sendMessage(chatId, responseText);
    return;
  }

  // Murojaat yo'llash bosqichlari
  if (text === '✍️ Partiyaga murojaat yo‘llash') {
    userStates[chatId] = { step: 'APPEAL_NAME', data: {} };
    await sendMessage(chatId, 'Iltimos, to‘liq <b>Ism, Familiya va Sharifingizni</b> kiriting:');
    return;
  }

  if (userStates[chatId]?.step === 'APPEAL_NAME') {
    userStates[chatId].data.fullName = text;
    userStates[chatId].step = 'APPEAL_PHONE';
    await sendMessage(chatId, 'Bog‘lanish uchun <b>telefon raqamingizni</b> kiriting:');
    return;
  }

  if (userStates[chatId]?.step === 'APPEAL_PHONE') {
    userStates[chatId].data.phone = text;
    userStates[chatId].step = 'APPEAL_SUBJECT';
    await sendMessage(chatId, 'Murojaatingizning <b>qisqacha mavzusini</b> yozing (masalan: Mehnat nizosi, Uy-joy masalasi):');
    return;
  }

  if (userStates[chatId]?.step === 'APPEAL_SUBJECT') {
    userStates[chatId].data.subject = text;
    userStates[chatId].step = 'APPEAL_MESSAGE';
    await sendMessage(chatId, 'Batafsil <b>murojaat matnini</b> yozib qoldiring:');
    return;
  }

  if (userStates[chatId]?.step === 'APPEAL_MESSAGE') {
    const appealData = userStates[chatId].data;
    appealData.message = text;
    appealData.telegramChatId = chatId;
    appealData.telegramUsername = msg.from.username || '';
    appealData.status = 'new';
    appealData.source = 'telegram';

    const createdAppeal = appealsStore.insert(appealData);
    userStates[chatId] = { step: 'IDLE' };

    await sendMessage(chatId, `✅ <b>Murojaatingiz muvaffaqiyatli qabul qilindi!</b>\n\n` +
      `🆔 <b>Murojaat raqami:</b> #${createdAppeal.id}\n` +
      `Murojaatingiz partiya mas’ul xodimlariga yetkazildi.`);

    notifyAdminsNewAppeal(createdAppeal);
    if (notifyWeb) notifyWeb({ type: 'NEW_APPEAL', appeal: createdAppeal });
    return;
  }

  // Savol-javob
  if (text === '⚖️ Kodekslar bo‘yicha savol berish') {
    userStates[chatId] = { step: 'Q_CATEGORY' };
    const categories = {
      keyboard: [
        [{ text: 'Mehnat kodeksi' }, { text: 'Fuqarolik kodeksi' }],
        [{ text: 'Oila kodeksi' }, { text: 'Jinoyat kodeksi' }],
        [{ text: 'Ma’muriy javobgarlik' }, { text: 'Uy-joy qonunchiligi' }]
      ],
      resize_keyboard: true,
      one_time_keyboard: true
    };
    await sendMessage(chatId, 'Savolingiz qaysi kodeksga tegishli?', { reply_markup: categories });
    return;
  }

  if (userStates[chatId]?.step === 'Q_CATEGORY') {
    userStates[chatId] = { step: 'Q_TEXT', category: text };
    await sendMessage(chatId, `Tanlangan soha: <b>${escapeHtml(text)}</b>\n\nSavolingizni to‘liq yozing:`);
    return;
  }

  if (userStates[chatId]?.step === 'Q_TEXT') {
    const category = userStates[chatId].category;
    const citizenLabel = `Fuqaro #${Math.floor(1000 + Math.random() * 9000)}`;

    const newQ = questionsStore.insert({
      category,
      citizenLabel,
      questionText: text,
      status: 'pending',
      answerText: '',
      answeredBy: '',
      telegramChatId: chatId
    });

    userStates[chatId] = { step: 'IDLE' };
    await sendMessage(chatId, `✅ <b>Savolingiz qabul qilindi!</b>\nSizga biriktirilgan belgi: <b>${citizenLabel}</b>.`);

    notifyAdminsNewQuestion(newQ);
    if (notifyWeb) notifyWeb({ type: 'NEW_QUESTION', question: newQ });
    return;
  }

  // /javob <id> <text>
  if (text.startsWith('/javob ') || text.startsWith('/reply ')) {
    const parts = text.split(' ');
    const appealId = parts[1];
    const replyText = parts.slice(2).join(' ');

    const appeal = appealsStore.findById(appealId);
    if (appeal) {
      const updated = appealsStore.update(appealId, {
        status: 'answered',
        adminReply: replyText,
        repliedAt: new Date().toISOString(),
        repliedBy: 'Admin (Telegram)'
      });
      await sendMessage(chatId, `✅ #${appealId} raqamli murojaatga javob yuborildi!`);
      if (appeal.telegramChatId) {
        await sendReplyToCitizenTelegram(appeal.telegramChatId, appeal, replyText);
      }
      if (notifyWeb) notifyWeb({ type: 'APPEAL_REPLIED', appeal: updated });
    }
    return;
  }
}

// Long Polling Loop
let lastUpdateId = 0;
let isPolling = false;

async function pollUpdates() {
  if (isPolling) return;
  isPolling = true;
  console.log(`✅ Telegram Bot Polling ishga tushdi (@AdolatSD_bot). Ulanishlar tekshirilmoqda...`);

  while (isPolling) {
    try {
      const res = await callTelegram('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 10
      });

      if (res && res.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          lastUpdateId = update.update_id;
          if (update.message) {
            await handleTelegramMessage(update.message);
          }
        }
      }
    } catch (e) {
      console.warn('[Telegram Polling]: Qayta ulanmoqda...');
    }
    // Slight pause between polls
    await new Promise(r => setTimeout(r, 1000));
  }
}

function initBot(onWebBroadcast) {
  notifyWeb = onWebBroadcast;
  pollUpdates();
}

module.exports = {
  initBot,
  addAdminChatId,
  notifyAdminsNewAppeal,
  notifyAdminsNewQuestion,
  notifyAdminsNewsLike,
  sendReplyToCitizenTelegram,
  getAdminChatIds: () => Array.from(adminChatIds)
};
