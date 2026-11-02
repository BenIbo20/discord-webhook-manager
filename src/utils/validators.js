const { ChannelType } = require('discord.js');
const { ValidationError } = require('./errors');

class Validators {
  static SUPPORTED_CHANNEL_TYPES = [
    ChannelType.GuildText,
    ChannelType.GuildAnnouncement,
    ChannelType.GuildForum,
    ChannelType.GuildVoice,
    ChannelType.GuildStageVoice
  ];

  static DISCORD_RESERVED_NAMES = ['clyde', 'discord'];
  static ALLOWED_IMAGE_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif'
  ];
  static MAX_AVATAR_BYTES = 8 * 1024 * 1024; // 8 MB

  /**
   * Validates a Discord webhook name.
   * @param {string} name
   */
  static validateWebhookName(name) {
    if (typeof name !== 'string') {
      throw new ValidationError('Webhook adı metin olmalıdır.');
    }

    const trimmed = name.trim();

    if (!trimmed || trimmed.length < 1 || trimmed.length > 80) {
      throw new ValidationError('Webhook adı 1 ile 80 karakter arasında olmalıdır.');
    }

    const lower = trimmed.toLowerCase();
    for (const reserved of this.DISCORD_RESERVED_NAMES) {
      if (lower.includes(reserved)) {
        throw new ValidationError(`Webhook adı Discord politikası gereği "${reserved}" kelimesini içeremez.`);
      }
    }

    if (lower === '@everyone' || lower === '@here') {
      throw new ValidationError('Webhook adı "@everyone" veya "@here" olamaz.');
    }
  }

  /**
   * Validates an uploaded avatar attachment.
   * @param {import('discord.js').Attachment} attachment
   */
  static validateAvatarAttachment(attachment) {
    if (!attachment || typeof attachment !== 'object') {
      throw new ValidationError('Geçersiz görsel eklentisi.');
    }

    if (attachment.size > this.MAX_AVATAR_BYTES) {
      throw new ValidationError('Yüklenen avatar görseli en fazla 8 MB boyutunda olabilir.');
    }

    const contentType = attachment.contentType?.toLowerCase();
    if (!contentType || !this.ALLOWED_IMAGE_MIME_TYPES.includes(contentType)) {
      throw new ValidationError('Geçersiz görsel formatı. Yalnızca PNG, JPEG, WEBP veya GIF formatları desteklenir.');
    }
  }

  /**
   * Validates that a string is a valid Discord Snowflake ID.
   * @param {string} id
   * @param {string} entityName
   */
  static validateSnowflake(id, entityName = 'ID') {
    if (typeof id !== 'string' || !/^\d{17,20}$/.test(id)) {
      throw new ValidationError(`Geçersiz ${entityName}: Snowflake ID 17-20 haneli rakamlardan oluşmalıdır.`);
    }
  }

  /**
   * Checks whether a channel type supports webhook creation.
   * @param {number} channelType
   * @returns {boolean}
   */
  static isSupportedChannelType(channelType) {
    return this.SUPPORTED_CHANNEL_TYPES.includes(channelType);
  }
}

module.exports = { Validators };

