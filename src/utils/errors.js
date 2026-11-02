const {
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  Colors,
  DiscordAPIError
} = require('discord.js');
const { Logger } = require('./logger');

class AppError extends Error {
  constructor(userMessage, internalLogMessage) {
    super(internalLogMessage || userMessage);
    this.name = 'AppError';
    this.userMessage = userMessage;
    this.isOperational = true;
  }
}

class PermissionError extends AppError {
  constructor(message = 'Bu işlemi gerçekleştirmek için yetkiniz bulunmuyor.') {
    super(message);
    this.name = 'PermissionError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Belirtilen webhook veya kaynak bulunamadı.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

function buildErrorContainer(title, description) {
  return new ContainerBuilder()
    .setAccentColor(Colors.Red)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(`# ❌ ${title}\n${description}`)
    );
}

async function handleInteractionError(interaction, error) {
  let title = 'Bir Hata Oluştu';
  let userMessage = 'İşlem gerçekleştirilirken beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.';

  if (error instanceof AppError) {
    title = error instanceof PermissionError ? 'Yetki Hatası' : 'İşlem Reddedildi';
    userMessage = error.userMessage;
    Logger.warn('HataYöneticisi', `İşlemsel hata [${error.name}]: ${error.message}`);
  } else if (error instanceof DiscordAPIError) {
    title = 'Discord API Hatası';
    userMessage = `Discord API yanıt vermedi veya isteği reddetti (Kod: ${error.code}).`;
    Logger.error('HataYöneticisi', `DiscordAPIError [Kod: ${error.code}]: ${error.message}`, error);
  } else {
    Logger.error('HataYöneticisi', 'Beklenmeyen sistem hatası', error);
  }

  const container = buildErrorContainer(title, userMessage);

  try {
    const replyOptions = {
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(replyOptions);
    } else {
      await interaction.reply(replyOptions);
    }
  } catch (replyError) {
    Logger.error('HataYöneticisi', 'Hata yanıtı etkileşime iletilemedi', replyError);
  }
}

module.exports = {
  AppError,
  PermissionError,
  NotFoundError,
  ValidationError,
  buildErrorContainer,
  handleInteractionError
};

