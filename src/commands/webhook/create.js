const { MessageFlags, ChannelType } = require('discord.js');
const { WebhookService } = require('../../services/WebhookService');
const { WebhookPanelBuilder } = require('../../builders/WebhookPanelBuilder');
const { PermissionService } = require('../../services/PermissionService');
const { Validators } = require('../../utils/validators');
const { PermissionError, ValidationError } = require('../../utils/errors');
const { Logger } = require('../../utils/logger');

const createSubcommand = {
  /**
   * @param {import('discord.js').SlashCommandSubcommandBuilder} subcommand
   */
  data: (subcommand) =>
    subcommand
      .setName('olustur')
      .setDescription('Seçilen kanalda yeni bir Discord webhooku oluşturur.')
      .addChannelOption((option) =>
        option
          .setName('kanal')
          .setDescription('Webhookun oluşturulacağı kanal')
          .setRequired(true)
          .addChannelTypes(
            ChannelType.GuildText,
            ChannelType.GuildAnnouncement,
            ChannelType.GuildForum,
            ChannelType.GuildVoice,
            ChannelType.GuildStageVoice
          )
      )
      .addStringOption((option) =>
        option
          .setName('isim')
          .setDescription('Oluşturulacak webhookun adı (1-80 karakter)')
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(80)
      )
      .addAttachmentOption((option) =>
        option
          .setName('avatar')
          .setDescription('Webhook için isteğe bağlı profil görseli (PNG, JPEG, WEBP, GIF)')
          .setRequired(false)
      ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.guild) {
      throw new PermissionError('Bu komut yalnızca bir Discord sunucusunda kullanılabilir.');
    }

    const channel = interaction.options.getChannel('kanal', true);
    const name = interaction.options.getString('isim', true).trim();
    const avatarAttachment = interaction.options.getAttachment('avatar');

    Validators.validateWebhookName(name);

    if (!Validators.isSupportedChannelType(channel.type)) {
      throw new ValidationError(
        'Seçilen kanal türü webhook oluşturmayı desteklemiyor. Lütfen Yazı, Duyuru veya Forum kanalı seçin.'
      );
    }

    let avatarUrl;
    if (avatarAttachment) {
      Validators.validateAvatarAttachment(avatarAttachment);
      avatarUrl = avatarAttachment.url;
    }

    const member = interaction.member;
    PermissionService.assertAllPermissions(member, interaction.guild, channel);

    Logger.command(`webhook olustur "${name}" in #${channel.name}`, interaction.user.id, interaction.guild.id);

    const createdWebhook = await WebhookService.createWebhook(
      interaction.guild,
      channel.id,
      {
        name,
        avatarUrl,
        reason: `Webhook created by ${interaction.user.tag} (${interaction.user.id})`
      },
      interaction.user.id
    );

    const container = WebhookPanelBuilder.buildCreatedPanel(createdWebhook);

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};

module.exports = { createSubcommand };

