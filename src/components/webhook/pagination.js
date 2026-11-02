const { MessageFlags } = require('discord.js');
const { WebhookService } = require('../../services/WebhookService');
const { WebhookPanelBuilder } = require('../../builders/WebhookPanelBuilder');
const { PermissionService } = require('../../services/PermissionService');
const { PermissionError } = require('../../utils/errors');

/**
 * Handles pagination and refresh button clicks.
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {'page' | 'ref'} _action
 * @param {string[]} args
 */
async function handlePaginationInteraction(interaction, _action, args) {
  const [ownerUserId, targetPageStr] = args;

  if (interaction.user.id !== ownerUserId) {
    throw new PermissionError('Yalnızca bu paneli oluşturan kullanıcı butonları kullanabilir.');
  }

  if (!interaction.guild) {
    throw new PermissionError('Bu işlem yalnızca bir sunucu içerisinde gerçekleştirilebilir.');
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  PermissionService.assertAllPermissions(member, interaction.guild);

  const targetPage = targetPageStr ? parseInt(targetPageStr, 10) || 1 : 1;
  const webhooks = await WebhookService.fetchGuildWebhooks(interaction.guild);

  const container = WebhookPanelBuilder.buildListPanel(
    webhooks,
    targetPage,
    interaction.user.id
  );

  await interaction.update({
    components: [container],
    flags: MessageFlags.IsComponentsV2
  });
}

module.exports = { handlePaginationInteraction };

