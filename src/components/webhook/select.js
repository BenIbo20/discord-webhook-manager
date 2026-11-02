const { MessageFlags } = require('discord.js');
const { WebhookService } = require('../../services/WebhookService');
const { WebhookPanelBuilder } = require('../../builders/WebhookPanelBuilder');
const { PermissionService } = require('../../services/PermissionService');
const { PermissionError, NotFoundError } = require('../../utils/errors');

/**
 * Handles select menu interaction to view a webhook's private URL.
 * @param {import('discord.js').StringSelectMenuInteraction} interaction
 * @param {string[]} args
 */
async function handleSelectInteraction(interaction, args) {
  const [ownerUserId] = args;

  if (interaction.user.id !== ownerUserId) {
    throw new PermissionError('Yalnızca bu paneli açan kullanıcı seçim menüsünü kullanabilir.');
  }

  if (!interaction.guild) {
    throw new PermissionError('Bu işlem yalnızca bir sunucu içerisinde gerçekleştirilebilir.');
  }

  const selectedWebhookId = interaction.values[0];
  if (!selectedWebhookId) {
    throw new NotFoundError('Herhangi bir webhook seçilmedi.');
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  PermissionService.assertAllPermissions(member, interaction.guild);

  const webhook = await WebhookService.getWebhookById(interaction.guild, selectedWebhookId);

  if (!webhook.token) {
    throw new PermissionError('Bu webhookun URL tokenı bulunmuyor veya Discord API tarafından sağlanmadı.');
  }

  const container = WebhookPanelBuilder.buildUrlDisplayPanel(webhook);

  await interaction.reply({
    components: [container],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
  });
}

module.exports = { handleSelectInteraction };

