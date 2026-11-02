const { MessageFlags } = require('discord.js');
const { WebhookService } = require('../../services/WebhookService');
const { WebhookPanelBuilder } = require('../../builders/WebhookPanelBuilder');
const { PermissionService } = require('../../services/PermissionService');
const { Validators } = require('../../utils/validators');
const { PermissionError, ValidationError } = require('../../utils/errors');
const { Logger } = require('../../utils/logger');

const editSubcommand = {
  /**
   * @param {import('discord.js').SlashCommandSubcommandBuilder} subcommand
   */
  data: (subcommand) =>
    subcommand
      .setName('duzenle')
      .setDescription('Mevcut bir webhookun adını veya avatarını günceller.')
      .addStringOption((option) =>
        option
          .setName('webhook_id')
          .setDescription('Düzenlenecek webhookun ID\'si')
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addStringOption((option) =>
        option
          .setName('yeni_isim')
          .setDescription('Webhook için yeni isim (1-80 karakter)')
          .setRequired(false)
          .setMinLength(1)
          .setMaxLength(80)
      )
      .addAttachmentOption((option) =>
        option
          .setName('yeni_avatar')
          .setDescription('Webhook için yeni avatar görseli')
          .setRequired(false)
      ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.guild) {
      throw new PermissionError('Bu komut yalnızca bir Discord sunucusunda kullanılabilir.');
    }

    const webhookId = interaction.options.getString('webhook_id', true).trim();
    const newName = interaction.options.getString('yeni_isim')?.trim();
    const newAvatarAttachment = interaction.options.getAttachment('yeni_avatar');

    if (!newName && !newAvatarAttachment) {
      throw new ValidationError(
        'En az bir düzenleme parametresi belirtilmelidir: Lütfen yeni bir isim veya yeni bir avatar görseli sağlayın.'
      );
    }

    if (newName) {
      Validators.validateWebhookName(newName);
    }

    let avatarUrl;
    if (newAvatarAttachment) {
      Validators.validateAvatarAttachment(newAvatarAttachment);
      avatarUrl = newAvatarAttachment.url;
    }

    const member = interaction.member;
    PermissionService.assertAllPermissions(member, interaction.guild);

    Logger.command(`webhook duzenle ${webhookId}`, interaction.user.id, interaction.guild.id);

    const updatedWebhook = await WebhookService.editWebhook(
      interaction.guild,
      webhookId,
      {
        name: newName,
        avatarUrl,
        reason: `Webhook edited by ${interaction.user.tag} (${interaction.user.id})`
      },
      interaction.user.id
    );

    const container = WebhookPanelBuilder.buildEditedPanel(updatedWebhook);

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  },

  /**
   * @param {import('discord.js').AutocompleteInteraction} interaction
   */
  async autocomplete(interaction) {
    if (!interaction.guild) {
      await interaction.respond([]);
      return;
    }

    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      const webhooks = await WebhookService.fetchGuildWebhooks(interaction.guild);

      const filtered = webhooks
        .filter(
          (wh) =>
            wh.name.toLowerCase().includes(focusedValue) ||
            wh.id.includes(focusedValue)
        )
        .slice(0, 25);

      await interaction.respond(
        filtered.map((wh) => ({
          name: `${wh.name.slice(0, 50)} (${wh.id})`,
          value: wh.id
        }))
      );
    } catch {
      await interaction.respond([]);
    }
  }
};

module.exports = { editSubcommand };

