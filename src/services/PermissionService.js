const { PermissionFlagsBits } = require('discord.js');
const { PermissionError } = require('../utils/errors');
const { Logger } = require('../utils/logger');

class PermissionService {
  /**
   * Asserts that the executing member has the ManageWebhooks permission.
   * @param {import('discord.js').GuildMember | null} member
   * @param {import('discord.js').NonThreadGuildBasedChannel | null} [channel]
   */
  static assertUserPermission(member, channel) {
    if (!member) {
      throw new PermissionError('Kullanıcı sunucu üyesi olarak doğrulanamadı.');
    }

    if (channel) {
      const channelPermissions = channel.permissionsFor(member);
      if (!channelPermissions || !channelPermissions.has(PermissionFlagsBits.ManageWebhooks)) {
        Logger.authDenied(member.id, 'ManageWebhooks', member.guild?.id, channel.id);
        throw new PermissionError(
          `<#${channel.id}> kanalında webhook yönetmek için **Webhookları Yönet (Manage Webhooks)** yetkisine sahip olmalısınız.`
        );
      }
    } else {
      if (!member.permissions || !member.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        Logger.authDenied(member.id, 'ManageWebhooks', member.guild?.id);
        throw new PermissionError(
          'Bu işlemi gerçekleştirmek için sunucu genelinde **Webhookları Yönet (Manage Webhooks)** yetkisine sahip olmalısınız.'
        );
      }
    }
  }

  /**
   * Asserts that the bot itself has the ManageWebhooks permission.
   * @param {import('discord.js').Guild} guild
   * @param {import('discord.js').NonThreadGuildBasedChannel | null} [channel]
   */
  static assertBotPermission(guild, channel) {
    const botMember = guild.members.me;
    if (!botMember) {
      throw new PermissionError('Bot sunucuda üye nesnesine erişemedi.');
    }

    if (channel) {
      const botChannelPermissions = channel.permissionsFor(botMember);
      if (!botChannelPermissions || !botChannelPermissions.has(PermissionFlagsBits.ManageWebhooks)) {
        Logger.authDenied(botMember.id, 'Bot ManageWebhooks', guild.id, channel.id);
        throw new PermissionError(
          `Botun <#${channel.id}> kanalında webhook oluşturmak veya yönetmek için **Webhookları Yönet (Manage Webhooks)** yetkisi bulunmuyor.`
        );
      }
    } else {
      if (!botMember.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
        Logger.authDenied(botMember.id, 'Bot ManageWebhooks', guild.id);
        throw new PermissionError(
          'Botun bu sunucuda webhookları yönetebilmesi için **Webhookları Yönet (Manage Webhooks)** yetkisine ihtiyacı vardır.'
        );
      }
    }
  }

  /**
   * Helper that checks both user and bot permissions at once.
   * @param {import('discord.js').GuildMember | null} member
   * @param {import('discord.js').Guild} guild
   * @param {import('discord.js').NonThreadGuildBasedChannel | null} [channel]
   */
  static assertAllPermissions(member, guild, channel) {
    this.assertUserPermission(member, channel);
    this.assertBotPermission(guild, channel);
  }
}

module.exports = { PermissionService };

