require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const { CommandHandler } = require('./handlers/commandHandler');
const { EventHandler } = require('./handlers/eventHandler');
const { Logger } = require('./utils/logger');

// Ortam değişkenlerini doğrula
const token = process.env.DISCORD_TOKEN;
if (!token) {
  Logger.error('Başlangıç', 'DISCORD_TOKEN çevre değişkeni eksik. Lütfen .env dosyanızı kontrol edin.');
  process.exit(1);
}

// Yalnızca gerekli Guilds intenti kullanılır - gereksiz yetkili intent istenmez
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

// Komut ve Olay yöneticilerini başlat
CommandHandler.init();
EventHandler.registerEvents(client);

// Merkezi süreç düzeyi istisna dinleyicileri
process.on('unhandledRejection', (reason) => {
  Logger.error('Süreç', 'İşlenmemiş Promise Reddi (Unhandled Rejection)', reason);
});

process.on('uncaughtException', (error) => {
  Logger.error('Süreç', 'Yakalanmamış İstisna (Uncaught Exception)', error);
  process.exit(1);
});

// Güvenli kapatma yönetimi
const handleShutdown = (signal) => {
  Logger.info('Kapatma', `${signal} sinyali alındı. İstemci oturumu güvenli bir şekilde kapatılıyor...`);
  client.destroy();
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Discord Gateway'e bağlan
client.login(token).catch((error) => {
  Logger.error('Giriş', 'Discord Gateway ile kimlik doğrulaması başarısız oldu', error);
  process.exit(1);
});

