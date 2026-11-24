require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'adolat_sdp_secret_key_2026_raqamlashtirish',
  ADMIN_SECRET_CODE: '080910',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '9086471023:AAHc8zx8SIcKwzsbdYN-e3m8OZl-5OGsnww',
  TELEGRAM_ADMIN_CHAT_ID: process.env.TELEGRAM_ADMIN_CHAT_ID || '9086471023',
  PARTY_NAME: 'O‘zbekiston "Adolat" sotsial-demokratik partiyasi',
  PARTY_SLOGAN: 'Kuch — adolatda!',
};
