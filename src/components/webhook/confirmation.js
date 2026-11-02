const { MessageFlags, Colors } = require('discord.js');
const { WebhookService } = require('../../services/WebhookService');
const { WebhookPanelBuilder } = require('../../builders/WebhookPanelBuilder');
const { PermissionService } = require('../../services/PermissionService');
const { PermissionError, NotFoundError } = require('../../utils/errors');

/**
 * Handles delete confirmation dialogue buttons (Confirm / Cancel).
 * @param {import('discord.js').ButtonInteraction} interaction
 * @param {'del_ok' | 'del_no'} action
 * @param {string[]} args
 */
async function handleConfirmationInteraction(interaction, action, args) {
  const [ownerUserId, webhookId] = args;

  if (interaction.user.id !== ownerUserId) {
    throw new PermissionError('Yalnızca bu silme talebini başlatan kullanıcı onay verebilir.');
  }

  if (!interaction.guild) {
    throw new PermissionError('Bu işlem yalnızca bir sunucu içerisinde gerçekleştirilebilir.');
  }

  if (!webhookId) {
    throw new NotFoundError('Geçersiz webhook tanımlayıcısı.');
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  PermissionService.assertAllPermissions(member, interaction.guild);

  if (action === 'del_no') {
    const cancelContainer = WebhookPanelBuilder.buildSimplePanel(
      'İşlem İptal Edildi',
      'Webhook silme işlemi kullanıcı tarafından iptal edildi. Webhooka herhangi bir müdahalede bulunulmadı.',
      Colors.Grey
    );

    await interaction.update({
      components: [cancelContainer],
      flags: MessageFlags.IsComponentsV2
    });
    return;
  }

  // Deletion confirmed
  const deletedWebhook = await WebhookService.deleteWebhook(
    interaction.guild,
    webhookId,
    interaction.user.id,
    `Deleted via Discord Webhook Manager by ${interaction.user.tag}`
  );

  const successContainer = WebhookPanelBuilder.buildSimplePanel(
    '🗑️ Webhook Başarıyla Silindi',
    `\`${deletedWebhook.name}\` (\`${deletedWebhook.id}\`) adlı webhook kalıcı olarak silindi.`,
    Colors.Green
  );

  await interaction.update({
    components: [successContainer],
    flags: MessageFlags.IsComponentsV2
  });
}

module.exports = { handleConfirmationInteraction };

