const { MessageFlags } = require('discord.js');
const { WebhookService } = require('../../services/WebhookService');
const { WebhookPanelBuilder } = require('../../builders/WebhookPanelBuilder');
const { PermissionService } = require('../../services/PermissionService');
const { PermissionError, NotFoundError } = require('../../utils/errors');

/**
 * Handles action button clicks (reveal URL, open delete prompt).
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {'url' | 'del_prompt'} action
 * @param {string[]} args
 */
async function handleActionInteraction(interaction, action, args) {
  const [ownerUserId, webhookId] = args;

  if (interaction.user.id !== ownerUserId) {
    throw new PermissionError('Yalnızca bu komutu çalıştıran kullanıcı bu işlemi yapabilir.');
  }

  if (!interaction.guild) {
    throw new PermissionError('Bu işlem yalnızca bir sunucu içerisinde gerçekleştirilebilir.');
  }

  if (!webhookId) {
    throw new NotFoundError('Geçersiz webhook tanımlayıcısı.');
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  PermissionService.assertAllPermissions(member, interaction.guild);

  const webhook = await WebhookService.getWebhookById(interaction.guild, webhookId);

  if (action === 'url') {
    if (!webhook.token) {
      throw new PermissionError('Bu webhookun erişim tokenı mevcut değil veya API tarafından döndürülmedi.');
    }

    const container = WebhookPanelBuilder.buildUrlDisplayPanel(webhook);

    // Ephemeral response ensures URL is strictly private to the requesting user
    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
    });
  } else if (action === 'del_prompt') {
    const confirmationContainer = WebhookPanelBuilder.buildDeleteConfirmationPanel(
      webhook,
      interaction.user.id
    );

    await interaction.update({
      components: [confirmationContainer],
      flags: MessageFlags.IsComponentsV2
    });
  }
}

module.exports = { handleActionInteraction };

