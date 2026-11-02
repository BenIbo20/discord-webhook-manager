// ANSI Renk Kodları
const COLOR = {
  RESET: '\x1b[0m',
  GRAY: '\x1b[90m',
  BRIGHT_WHITE: '\x1b[1;97m',
  WHITE: '\x1b[97m',
  RED: '\x1b[1;31m',
  MESSAGE_RED: '\x1b[31m',
  YELLOW: '\x1b[1;33m',
  MESSAGE_YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m'
};

class Logger {
  static TOKEN_PATTERN = /(?:https?:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/)[a-zA-Z0-9_-]+/gi;
  static GENERIC_TOKEN_PATTERN = /([A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,38})/g;

  /**
   * Tarih ve saati gün.ay.yıl saat:dakika:saniye formatında üretir.
   * @param {Date} [date]
   * @returns {string}
   */
  static getFormattedTimestamp(date = new Date()) {
    const pad = (n) => String(n).padStart(2, '0');
    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Webhook tokenları ve bot tokenları gibi hassas verileri loglardan maskeler.
   * @param {string} message
   * @returns {string}
   */
  static sanitize(message) {
    if (typeof message !== 'string') {
      message = String(message);
    }
    return message
      .replace(this.TOKEN_PATTERN, (match) => {
        const parts = match.split('/');
        const id = parts[parts.length - 2];
        return `https://discord.com/api/webhooks/${id}/[REDACTED_TOKEN]`;
      })
      .replace(this.GENERIC_TOKEN_PATTERN, '[REDACTED_DISCORD_TOKEN]');
  }

  /**
   * Log mesajını renk ve etiketlerle biçimlendirir.
   * - Saat/Tarih: Gri
   * - [BİLGİ] Etiketi: Parlayan Beyaz
   * - [HATA] Etiketi: Parlayan Kırmızı, Hata Mesajı: Kırmızı
   * - Normal Mesajlar: Beyaz
   * @param {'INFO' | 'WARN' | 'ERROR' | 'DEBUG'} level
   * @param {string} context
   * @param {string} message
   * @returns {string}
   */
  static formatMessage(level, context, message) {
    const timeStr = `${COLOR.GRAY}[${this.getFormattedTimestamp()}]${COLOR.RESET}`;
    const contextStr = `${COLOR.CYAN}[${context}]${COLOR.RESET}`;
    const sanitized = this.sanitize(message);

    let levelTag = '';
    let coloredMessage = '';

    switch (level) {
      case 'INFO':
        levelTag = `${COLOR.BRIGHT_WHITE}[BİLGİ]${COLOR.RESET}`;
        coloredMessage = `${COLOR.WHITE}${sanitized}${COLOR.RESET}`;
        break;

      case 'WARN':
        levelTag = `${COLOR.YELLOW}[UYARI]${COLOR.RESET}`;
        coloredMessage = `${COLOR.MESSAGE_YELLOW}${sanitized}${COLOR.RESET}`;
        break;

      case 'ERROR':
        levelTag = `${COLOR.RED}[HATA]${COLOR.RESET}`;
        coloredMessage = `${COLOR.MESSAGE_RED}${sanitized}${COLOR.RESET}`;
        break;

      case 'DEBUG':
        levelTag = `${COLOR.CYAN}[HATA AYIKLAMA]${COLOR.RESET}`;
        coloredMessage = `${COLOR.WHITE}${sanitized}${COLOR.RESET}`;
        break;

      default:
        levelTag = `${COLOR.BRIGHT_WHITE}[BİLGİ]${COLOR.RESET}`;
        coloredMessage = `${COLOR.WHITE}${sanitized}${COLOR.RESET}`;
        break;
    }

    return `${timeStr} ${levelTag} ${contextStr} ${coloredMessage}`;
  }

  static info(context, message) {
    console.log(this.formatMessage('INFO', context, message));
  }

  static warn(context, message) {
    console.warn(this.formatMessage('WARN', context, message));
  }

  static error(context, message, error) {
    console.error(this.formatMessage('ERROR', context, message));
    if (error instanceof Error) {
      const sanitizedStack = error.stack ? this.sanitize(error.stack) : error.message;
      console.error(`${COLOR.MESSAGE_RED}[Hata Ayrıntısı] ${sanitizedStack}${COLOR.RESET}`);
    } else if (error) {
      console.error(`${COLOR.MESSAGE_RED}[Hata Nesnesi] ${this.sanitize(String(error))}${COLOR.RESET}`);
    }
  }

  static debug(context, message) {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', context, message));
    }
  }

  static command(commandName, userId, guildId) {
    const guildLabel = guildId ? `Sunucu: <${guildId}>` : 'Özel Mesaj (DM)';
    this.info('Komut', `<${userId}> kullanıcısı '/${commandName}' komutunu çalıştırdı. (${guildLabel})`);
  }

  static webhookAction(action, webhookId, userId, guildId) {
    const actionTranslations = {
      CREATE: 'OLUŞTURULDU',
      DELETE: 'SİLİNDİ',
      EDIT: 'DÜZENLENDİ',
      VIEW: 'GÖRÜNTÜLENDİ'
    };
    const actionTr = actionTranslations[action] || action;
    this.info('WebhookServisi', `Eylem: ${actionTr} | Webhook ID: ${webhookId} | Kullanıcı: <${userId}> | Sunucu: <${guildId}>`);
  }

  static authDenied(userId, requiredPermission, guildId, channelId) {
    const guildLabel = guildId ? `<${guildId}>` : 'Yok';
    const channelLabel = channelId ? `<${channelId}>` : 'Yok';
    this.warn('Yetkilendirme', `<${userId}> kullanıcısının işlemi yetki yetersizliği nedeniyle reddedildi. (Gerekli Yetki: ${requiredPermission} | Sunucu: ${guildLabel} | Kanal: ${channelLabel})`);
  }
}

module.exports = { Logger };
