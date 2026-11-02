const { NotFoundError, ValidationError } = require('../utils/errors');
const { Logger } = require('../utils/logger');
const { Validators } = require('../utils/validators');

class WebhookService {
  /**
   * Fetches all webhooks configured in the given guild.
   * @param {import('discord.js').Guild} guild
   * @returns {Promise<import('discord.js').Webhook[]>}
   */
  static async fetchGuildWebhooks(guild) {
    const webhooksCollection = await guild.fetchWebhooks();
    return Array.from(webhooksCollection.values()).sort(
      (a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)
    );
  }

  /**
   * Fetches a specific webhook by ID and ensures it belongs to the target guild.
   * @param {import('discord.js').Guild} guild
   * @param {string} webhookId
   * @returns {Promise<import('discord.js').Webhook>}
   */
  static async getWebhookById(guild, webhookId) {
    Validators.validateSnowflake(webhookId, 'Webhook ID');

    const webhooks = await this.fetchGuildWebhooks(guild);
    const webhook = webhooks.find((wh) => wh.id === webhookId);

    if (!webhook || webhook.guildId !== guild.id) {
      throw new NotFoundError(
        `ID'si \`${webhookId}\` olan webhook bulunamadı veya bu sunucuya ait değil.`
      );
    }

    return webhook;
  }

  /**
   * Creates a new webhook in the specified channel.
   * @param {import('discord.js').Guild} guild
   * @param {string} channelId
   * @param {{ name: string; avatarUrl?: string; reason?: string }} options
   * @param {string} userId
   * @returns {Promise<import('discord.js').Webhook>}
   */
  static async createWebhook(guild, channelId, options, userId) {
    Validators.validateSnowflake(channelId, 'Kanal ID');
    Validators.validateWebhookName(options.name);

    const channel = await guild.channels.fetch(channelId);
    if (!channel) {
      throw new NotFoundError('Hedef kanal bulunamadı.');
    }

    if (!Validators.isSupportedChannelType(channel.type)) {
      throw new ValidationError(
        'Seçilen kanal türü webhook oluşturmayı desteklemiyor. (Yalnızca Yazı, Duyuru, Forum ve Ses kanalları desteklenir).'
      );
    }

    if (typeof channel.createWebhook !== 'function') {
      throw new ValidationError('Bu kanal üzerinde webhook oluşturulamıyor.');
    }

    const createdWebhook = await channel.createWebhook({
      name: options.name,
      avatar: options.avatarUrl,
      reason: options.reason || `Webhook created by user ${userId}`
    });

    Logger.webhookAction('CREATE', createdWebhook.id, userId, guild.id);
    return createdWebhook;
  }

  /**
   * Modifies an existing webhook.
   * @param {import('discord.js').Guild} guild
   * @param {string} webhookId
   * @param {{ name?: string; avatarUrl?: string | null; channelId?: string; reason?: string }} data
   * @param {string} userId
   * @returns {Promise<import('discord.js').Webhook>}
   */
  static async editWebhook(guild, webhookId, data, userId) {
    const webhook = await this.getWebhookById(guild, webhookId);

    if (data.name !== undefined) {
      Validators.validateWebhookName(data.name);
    }

    if (data.channelId !== undefined) {
      Validators.validateSnowflake(data.channelId, 'Kanal ID');
      const newChannel = await guild.channels.fetch(data.channelId);
      if (!newChannel || !Validators.isSupportedChannelType(newChannel.type)) {
        throw new ValidationError('Taşınmak istenen hedef kanal webhookları desteklemiyor.');
      }
    }

    const updatedWebhook = await webhook.edit({
      name: data.name ?? webhook.name,
      avatar: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
      channel: data.channelId ?? webhook.channelId,
      reason: data.reason || `Webhook edited by user ${userId}`
    });

    Logger.webhookAction('EDIT', updatedWebhook.id, userId, guild.id);
    return updatedWebhook;
  }

  /**
   * Deletes a webhook from the guild.
   * @param {import('discord.js').Guild} guild
   * @param {string} webhookId
   * @param {string} userId
   * @param {string} [reason]
   * @returns {Promise<import('discord.js').Webhook>}
   */
  static async deleteWebhook(guild, webhookId, userId, reason) {
    const webhook = await this.getWebhookById(guild, webhookId);

    await webhook.delete(reason || `Webhook deleted by user ${userId}`);

    Logger.webhookAction('DELETE', webhook.id, userId, guild.id);
    return webhook;
  }

  /**
   * Safely retrieves the URL if token exists, returning null otherwise.
   * NOTE: The returned value must NEVER be logged or displayed publicly.
   * @param {import('discord.js').Webhook} webhook
   * @returns {string | null}
   */
  static getSafeWebhookUrl(webhook) {
    if (webhook.token) {
      return webhook.url;
    }
    return null;
  }
}

module.exports = { WebhookService };

