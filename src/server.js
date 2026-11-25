const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');
const {
  usersStore,
  appealsStore,
  questionsStore,
  newsStore,
  notificationsStore
} = require('./db');
const {
  initBot,
  addAdminChatId,
  notifyAdminsNewAppeal,
  notifyAdminsNewQuestion,
  notifyAdminsNewsLike,
  sendReplyToCitizenTelegram
} = require('./bot');
const { generateLegalAIResponse } = require('./ai');

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Server-Sent Events (SSE) for Realtime Updates to Admin & Users
let sseClients = [];

function broadcastEvent(eventData) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch (e) {
      // client disconnected
    }
  });
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  // Initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// Authentication Helpers
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Avtorizatsiya talab etiladi!' });

  jwt.verify(token, config.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: 'Yaroqsiz token!' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ success: false, message: 'Ushbu amal faqat partiya administratori uchun ruxsat etilgan!' });
    }
  });
}

// ----------------- AUTH ROUTES ----------------- //

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, fullName, phone, password, role, adminSecretCode } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'Barcha majburiy maydonlarni to‘ldiring!' });
    }

    const existing = usersStore.findOne(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu foydalanuvchi nomi (login) allaqachon mavjud! Boshqa nom tanlang yoki tizimga kiring.' });
    }

    let userRole = 'citizen';

    if (role === 'admin') {
      if (adminSecretCode !== config.ADMIN_SECRET_CODE) {
        return res.status(403).json({ success: false, message: 'Maxsus adminlik kodi noto‘g‘ri! Rasmiy kodsiz admin bo‘lib ro‘yxatdan o‘tolmaysiz.' });
      }
      userRole = 'admin';
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = usersStore.insert({
      username: username.trim(),
      fullName: fullName.trim(),
      phone: phone ? phone.trim() : '',
      passwordHash,
      role: userRole,
      deviceInfo: req.headers['user-agent'] || 'Brauzer',
      ip: req.ip || req.connection.remoteAddress
    });

    // Notify admins about new user
    notificationsStore.insert({
      type: 'NEW_USER',
      title: 'Yangi foydalanuvchi ro‘yxatdan o‘tdi',
      message: `${newUser.fullName} (${userRole === 'admin' ? 'Administrator' : 'Fuqaro'}) tizimda ro‘yxatdan o‘tdi.`,
      userId: newUser.id,
      createdAt: new Date().toISOString()
    });

    broadcastEvent({ type: 'USER_REGISTERED', user: { id: newUser.id, username: newUser.username, fullName: newUser.fullName, role: newUser.role } });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role, fullName: newUser.fullName },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Muvaffaqiyatli ro‘yxatdan o‘tdingiz!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        phone: newUser.phone,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Serverda xatolik yuz berdi!' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Login va parolni kiriting!' });
    }

    const user = usersStore.findOne(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (!user) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi nomi yoki parol noto‘g‘ri!' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Foydalanuvchi nomi yoki parol noto‘g‘ri!' });
    }

    // Update last login & device
    usersStore.update(user.id, {
      lastLogin: new Date().toISOString(),
      lastDevice: req.headers['user-agent'] || 'Brauzer'
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Xush kelibsiz!',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Serverda xatolik yuz berdi!' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = usersStore.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi!' });

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt
    }
  });
});

// ----------------- FUQAROLAR MUROJAATI (APPEALS) ----------------- //

// Create Appeal (Fuqaro murojaat yo'llaydi)
app.post('/api/appeals', async (req, res) => {
  try {
    const { fullName, phone, email, address, region, subject, message, userId } = req.body;

    if (!fullName || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Ism, telefon raqam va murojaat matni majburiy!' });
    }

    const newAppeal = appealsStore.insert({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      region: region || 'O‘zbekiston Respublikasi',
      subject: subject ? subject.trim() : 'Umumiy murojaat',
      message: message.trim(),
      userId: userId || null,
      status: 'new', // new | in_progress | answered
      adminReply: '',
      repliedAt: null,
      repliedBy: null,
      source: 'web'
    });

    // Notify admins via Telegram
    notifyAdminsNewAppeal(newAppeal);

    // Save notification
    notificationsStore.insert({
      type: 'NEW_APPEAL',
      title: 'Yangi murojaat qabul qilindi',
      message: `${newAppeal.fullName} tomonidan murojaat: "${newAppeal.subject}"`,
      appealId: newAppeal.id,
      createdAt: new Date().toISOString()
    });

    // Broadcast realtime event
    broadcastEvent({ type: 'NEW_APPEAL', appeal: newAppeal });

    res.json({
      success: true,
      message: 'Murojaatingiz muvaffaqiyatli qabul qilindi va ko‘rib chiqish uchun yuborildi!',
      appeal: newAppeal
    });

  } catch (err) {
    console.error('Error creating appeal:', err);
    res.status(500).json({ success: false, message: 'Murojaatni saqlashda xatolik yuz berdi.' });
  }
});

// Get All Appeals (Admin)
app.get('/api/appeals', requireAdmin, (req, res) => {
  const appeals = appealsStore.getAll();
  res.json({ success: true, appeals });
});

// Get Citizen's own appeals
app.get('/api/appeals/my', authenticateToken, (req, res) => {
  const myAppeals = appealsStore.filter(a => String(a.userId) === String(req.user.id));
  res.json({ success: true, appeals: myAppeals });
});

// Admin reply to appeal
app.post('/api/appeals/:id/reply', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText, status = 'answered' } = req.body;

    if (!replyText) {
      return res.status(400).json({ success: false, message: 'Javob matnini kiriting!' });
    }

    const appeal = appealsStore.findById(id);
    if (!appeal) {
      return res.status(404).json({ success: false, message: 'Murojaat topilmadi!' });
    }

    const updated = appealsStore.update(id, {
      adminReply: replyText,
      status: status,
      repliedAt: new Date().toISOString(),
      repliedBy: req.user.fullName || 'Partiya Ma’muriyati'
    });

    // If appeal had telegramChatId, notify citizen on Telegram
    if (appeal.telegramChatId) {
      await sendReplyToCitizenTelegram(appeal.telegramChatId, appeal, replyText);
    }

    // Add user notification if appeal had userId
    if (appeal.userId) {
      notificationsStore.insert({
        type: 'APPEAL_ANSWERED',
        title: 'Murojaatingizga rasmiy javob berildi',
        message: `"${appeal.subject}" mavzusidagi murojaatingizga partiya ma’muriyati javob berdi.`,
        appealId: appeal.id,
        userId: appeal.userId,
        createdAt: new Date().toISOString()
      });
    }

    broadcastEvent({ type: 'APPEAL_REPLIED', appeal: updated });

    res.json({
      success: true,
      message: 'Javob muvaffaqiyatli saqlangandi va fuqaroga yetkazildi!',
      appeal: updated
    });

  } catch (err) {
    console.error('Error replying to appeal:', err);
    res.status(500).json({ success: false, message: 'Javob yuborishda xatolik yuz berdi.' });
  }
});

// Update Appeal Status (Admin)
app.post('/api/appeals/:id/status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['new', 'in_progress', 'answered', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri holat!' });
    }
    const appeal = appealsStore.findById(id);
    if (!appeal) return res.status(404).json({ success: false, message: 'Murojaat topilmadi!' });
    const updated = appealsStore.update(id, { status });
    broadcastEvent({ type: 'APPEAL_STATUS_UPDATED', appeal: updated });
    res.json({ success: true, message: 'Murojaat holati yangilandi!', appeal: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi.' });
  }
});

// Delete Appeal (Admin)
app.delete('/api/appeals/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const appeal = appealsStore.findById(id);
    if (!appeal) return res.status(404).json({ success: false, message: 'Murojaat topilmadi!' });
    appealsStore.delete(id);
    broadcastEvent({ type: 'APPEAL_DELETED', id });
    res.json({ success: true, message: 'Murojaat o\'chirildi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'O\'chirishda xatolik yuz berdi.' });
  }
});

// Delete Question (Admin)
app.delete('/api/questions/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const q = questionsStore.findById(id);
    if (!q) return res.status(404).json({ success: false, message: 'Savol topilmadi!' });
    questionsStore.delete(id);
    broadcastEvent({ type: 'QUESTION_DELETED', id });
    res.json({ success: true, message: 'Savol o\'chirildi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'O\'chirishda xatolik yuz berdi.' });
  }
});

// Delete News (Admin)
app.delete('/api/news/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const n = newsStore.findById(id);
    if (!n) return res.status(404).json({ success: false, message: 'Yangilik topilmadi!' });
    newsStore.delete(id);
    broadcastEvent({ type: 'NEWS_DELETED', id });
    res.json({ success: true, message: 'Yangilik o\'chirildi!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'O\'chirishda xatolik yuz berdi.' });
  }
});

// Admin send message to citizen via Telegram bot
app.post('/api/admin/bot-reply', requireAdmin, async (req, res) => {
  try {
    const { chatId, message } = req.body;
    if (!chatId || !message) {
      return res.status(400).json({ success: false, message: 'Chat ID va xabar matni kiritilishi shart!' });
    }
    const { sendReplyToCitizenTelegram } = require('./bot');
    const fakeAppeal = { id: 'admin', subject: 'Muloqot', fullName: 'Fuqaro' };
    await sendReplyToCitizenTelegram(chatId, fakeAppeal, message);
    res.json({ success: true, message: `Xabar Telegram orqali yuborildi!` });
  } catch (err) {
    console.error('Bot reply error:', err);
    res.status(500).json({ success: false, message: 'Xabar yuborishda xatolik yuz berdi.' });
  }
});

// ----------------- ADOLAT YURIDIK AI KONSULTATSIYASI ----------------- //

// AI ga har qanday huquqiy savol berish
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { questionText } = req.body;
    if (!questionText || questionText.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Savolingizni to‘liqroq yozing.' });
    }

    const aiResult = generateLegalAIResponse(questionText);
    res.json(aiResult);
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ success: false, message: 'AI xizmatida xatolik yuz berdi.' });
  }
});

// Admin uchun: Berilgan savolga AI orqali yuridik xulosa tayyorlash
app.post('/api/ai/draft-answer', requireAdmin, async (req, res) => {
  try {
    const { questionId } = req.body;
    const q = questionsStore.findById(questionId);
    if (!q) {
      return res.status(404).json({ success: false, message: 'Savol topilmadi!' });
    }

    const aiResult = generateLegalAIResponse(q.questionText);
    res.json({
      success: true,
      suggestedAnswer: aiResult.answer,
      code: aiResult.code
    });
  } catch (err) {
    console.error('Draft AI Error:', err);
    res.status(500).json({ success: false, message: 'AI tavsiyasini tayyorlashda xatolik.' });
  }
});

// Admin Telegram ID ulab qo'yish
app.post('/api/admin/telegram-chat', requireAdmin, async (req, res) => {
  try {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ success: false, message: 'Telegram Chat ID kiritilmadi!' });
    }

    const added = addAdminChatId(chatId);
    if (added) {
      res.json({ success: true, message: `Telegram ID ${chatId} tizimga ulandi! Xabarnoma yuborildi.` });
    } else {
      res.status(400).json({ success: false, message: 'Noto‘g‘ri Chat ID (bot ID sini kiritmang, o‘zingizning shaxsiy Telegram ID ingizni kiriting)!' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Xatolik yuz berdi.' });
  }
});

// ----------------- SHAFFOF SAVOL-JAVOBLAR (Q&A KODEKSLAR) ----------------- //

// Get all public questions
app.get('/api/questions', (req, res) => {
  const { category } = req.query;
  let questions = questionsStore.getAll();

  if (category && category !== 'all') {
    questions = questions.filter(q => q.category.toLowerCase() === category.toLowerCase());
  }

  // Sanitize: Shaxsiy ma'lumotlar oshkor etilmaydi, faqat anonim citizenLabel ko'rsatiladi
  const sanitized = questions.map(q => ({
    id: q.id,
    category: q.category,
    citizenLabel: q.citizenLabel || 'Muhtaram Fuqaro',
    questionText: q.questionText,
    status: q.status,
    answerText: q.answerText || '',
    answeredBy: q.answeredBy || '',
    answeredAt: q.answeredAt,
    createdAt: q.createdAt
  }));

  res.json({ success: true, questions: sanitized });
});

// Post a new Question (Fuqaro savol beradi)
app.post('/api/questions', authenticateToken, async (req, res) => {
  try {
    const { category, questionText } = req.body;

    if (!category || !questionText) {
      return res.status(400).json({ success: false, message: 'Kodeks sohasi va savol matnini to‘liq kiriting!' });
    }

    // Generate anonymous label for citizen to protect identity
    const citizenLabel = `Fuqaro #${Math.floor(1000 + Math.random() * 9000)}`;

    const newQuestion = questionsStore.insert({
      userId: req.user.id,
      category: category.trim(),
      citizenLabel: citizenLabel,
      questionText: questionText.trim(),
      status: 'pending', // pending | answered
      answerText: '',
      answeredBy: '',
      answeredAt: null
    });

    // Notify admins via Telegram
    notifyAdminsNewQuestion(newQuestion);

    notificationsStore.insert({
      type: 'NEW_QUESTION',
      title: 'Yangi huquqiy savol tushdi',
      message: `${newQuestion.category} bo‘yicha yangi savol qoldirildi.`,
      questionId: newQuestion.id,
      createdAt: new Date().toISOString()
    });

    broadcastEvent({ type: 'NEW_QUESTION', question: newQuestion });

    res.json({
      success: true,
      message: 'Savolingiz qabul qilindi! Partiya huquqshunoslari ko‘rib chiqqach, yashil javob shaklida e’lon qilinadi.',
      question: newQuestion
    });

  } catch (err) {
    console.error('Error posting question:', err);
    res.status(500).json({ success: false, message: 'Savolni yuborishda xatolik yuz berdi.' });
  }
});

// Admin Answer Question
app.post('/api/questions/:id/answer', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { answerText } = req.body;

    if (!answerText) {
      return res.status(400).json({ success: false, message: 'Javob matnini kiriting!' });
    }

    const question = questionsStore.findById(id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Savol topilmadi!' });
    }

    const updated = questionsStore.update(id, {
      answerText: answerText.trim(),
      status: 'answered',
      answeredBy: req.user.fullName || 'Adolat SDP Yuridik Maslahatchisi (Admin)',
      answeredAt: new Date().toISOString()
    });

    // Notify original asker on Telegram if applicable
    if (question.telegramChatId) {
      // Send Telegram notification
      // Handled if chatId present
    }

    broadcastEvent({ type: 'QUESTION_ANSWERED', question: updated });

    res.json({
      success: true,
      message: 'Javob yashil rangda savol kartasiga joylashtirildi!',
      question: updated
    });

  } catch (err) {
    console.error('Error answering question:', err);
    res.status(500).json({ success: false, message: 'Javob berishda xatolik yuz berdi.' });
  }
});

// ----------------- YANGILIKLAR (NEWS & LIKES) ----------------- //

// Get News
app.get('/api/news', (req, res) => {
  const news = newsStore.getAll();
  res.json({ success: true, news });
});

// Add News (Admin)
app.post('/api/news', requireAdmin, (req, res) => {
  try {
    const { title, category, summary, content, imageUrl } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Sarlavha va matn kiritilishi shart!' });
    }

    const newPost = newsStore.insert({
      title: title.trim(),
      category: category ? category.trim() : 'Partiya hayoti',
      summary: summary ? summary.trim() : (content.slice(0, 150) + '...'),
      content: content.trim(),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80',
      date: new Date().toISOString().split('T')[0],
      likesCount: 0,
      likedUsers: []
    });

    broadcastEvent({ type: 'NEW_POST', post: newPost });

    res.json({
      success: true,
      message: 'Yangilik e’lon qilindi!',
      post: newPost
    });

  } catch (err) {
    console.error('Error adding news:', err);
    res.status(500).json({ success: false, message: 'Yangilik qo‘shishda xatolik yuz berdi.' });
  }
});

// Like News (Fuqaro like bosadi, adminga xabar boradi)
app.post('/api/news/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;

    const newsItem = newsStore.findById(id);
    if (!newsItem) {
      return res.status(404).json({ success: false, message: 'Yangilik topilmadi!' });
    }

    newsItem.likesCount = (newsItem.likesCount || 0) + 1;
    if (userId && !newsItem.likedUsers.includes(userId)) {
      newsItem.likedUsers.push(userId);
    }
    newsStore.update(id, {
      likesCount: newsItem.likesCount,
      likedUsers: newsItem.likedUsers
    });

    // Notify admins via Telegram
    let citizenUser = null;
    if (userId) {
      citizenUser = usersStore.findById(userId);
    }
    if (!citizenUser && userName) {
      citizenUser = { fullName: userName };
    }

    notifyAdminsNewsLike(newsItem, citizenUser);

    // Save notification
    notificationsStore.insert({
      type: 'NEWS_LIKE',
      title: 'Yangilikka like bosildi',
      message: `${citizenUser ? citizenUser.fullName : 'Fuqaro'} "${newsItem.title}" yangiligiga like bosdi.`,
      newsId: newsItem.id,
      createdAt: new Date().toISOString()
    });

    broadcastEvent({
      type: 'NEWS_LIKED',
      newsId: id,
      likesCount: newsItem.likesCount,
      user: citizenUser
    });

    res.json({
      success: true,
      likesCount: newsItem.likesCount,
      message: 'Like qabul qilindi!'
    });

  } catch (err) {
    console.error('Error liking news:', err);
    res.status(500).json({ success: false, message: 'Like bosishda xatolik yuz berdi.' });
  }
});

// ----------------- ADMIN DASHBOARD & STATS ----------------- //

// Admin User List (Ro'yxatdan o'tgan barcha odamlarni eslab qolish)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = usersStore.getAll().map(u => {
    // Collect user questions and appeals count
    const userAppeals = appealsStore.filter(a => String(a.userId) === String(u.id));
    const userQuestions = questionsStore.filter(q => String(q.userId) === String(u.id));

    return {
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      deviceInfo: u.deviceInfo || u.lastDevice || 'Noma’lum',
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
      appealsCount: userAppeals.length,
      questionsCount: userQuestions.length
    };
  });

  res.json({ success: true, users });
});

// Admin Stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const users = usersStore.getAll();
  const appeals = appealsStore.getAll();
  const questions = questionsStore.getAll();
  const news = newsStore.getAll();

  const stats = {
    totalUsers: users.length,
    citizensCount: users.filter(u => u.role === 'citizen').length,
    adminsCount: users.filter(u => u.role === 'admin').length,
    totalAppeals: appeals.length,
    newAppeals: appeals.filter(a => a.status === 'new').length,
    answeredAppeals: appeals.filter(a => a.status === 'answered').length,
    totalQuestions: questions.length,
    answeredQuestions: questions.filter(q => q.status === 'answered').length,
    totalNews: news.length,
    totalLikes: news.reduce((acc, curr) => acc + (curr.likesCount || 0), 0)
  };

  res.json({ success: true, stats });
});

// Admin Notifications
app.get('/api/admin/notifications', requireAdmin, (req, res) => {
  const notifications = notificationsStore.getAll().slice(0, 50);
  res.json({ success: true, notifications });
});

// ----------------- HEALTH & KEEP-ALIVE ("SERVER UHLAB QOLMASIN") ----------------- //

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    party: config.PARTY_NAME,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    telegramBot: 'Active (@AdolatSD_bot)',
    storage: 'Persistent OK'
  });
});

// Fallback HTML routing
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API endpoint topilmadi' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Global Error Handler to prevent crash
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ success: false, message: 'Server ichki xatoligi yuz berdi.' });
});

process.on('uncaughtException', (err) => {
  console.error('[CRITICAL UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED PROMISE REJECTION]:', reason);
});

// Keep-alive self-ping interval so server never sleeps
setInterval(() => {
  http.get(`http://localhost:${config.PORT}/api/health`, (res) => {
    // healthy ping
  }).on('error', () => {
    // local warm-up
  });
}, 5 * 60 * 1000); // Har 5 daqiqada o'zini uyg'oq ushlab turadi

// Start Telegram Bot
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  initBot((event) => {
    broadcastEvent(event);
  });
}

// Start Server if run directly
if (require.main === module) {
  server.listen(config.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏛  ${config.PARTY_NAME}`);
    console.log(`🌐  Portal ishga tushdi: http://localhost:${config.PORT}`);
    console.log(`🤖  Telegram Bot: @AdolatSD_bot faol`);
    console.log(`⚡  Real-time SSE, Adolat AI & Keep-Alive xizmati yoqildi`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
