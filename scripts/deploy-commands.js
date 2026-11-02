require('dotenv').config();

const { REST, Routes } = require('discord.js');
const { webhookCommand } = require('../src/commands/webhook');
const { Logger } = require('../src/utils/logger');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  Logger.error(
    'KomutYükleyici',
    'Çevre değişkenlerinde DISCORD_TOKEN veya CLIENT_ID eksik. Komut yükleme işlemi iptal edildi.'
  );
  process.exit(1);
}

const commands = [webhookCommand.data.toJSON()];
const rest = new REST({ version: '10' }).setToken(token);

async function deploy() {
  try {
    Logger.info(
      'KomutYükleyici',
      `Toplam ${commands.length} adet uygulama (/) komutu yenilenmeye başlandı...`
    );

    if (guildId) {
      Logger.info('KomutYükleyici', `${guildId} ID'li sunucu için özel komutlar kaydediliyor...`);
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      Logger.info('KomutYükleyici', `${guildId} ID'li sunucu için komutlar başarıyla kaydedildi.`);
    } else {
      Logger.info('KomutYükleyici', 'Uygulama komutları global (tüm sunucular için) kaydediliyor...');
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      Logger.info('KomutYükleyici', 'Uygulama komutları global olarak başarıyla kaydedildi.');
    }
  } catch (error) {
    Logger.error('KomutYükleyici', 'Slash komutları Discord API\'ye yüklenirken hata oluştu', error);
    process.exit(1);
  }
}

deploy();

