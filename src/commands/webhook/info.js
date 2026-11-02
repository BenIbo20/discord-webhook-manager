const { MessageFlags } = require('discord.js');
const { WebhookService } = require('../../services/WebhookService');
const { WebhookPanelBuilder } = require('../../builders/WebhookPanelBuilder');
const { PermissionService } = require('../../services/PermissionService');
const { PermissionError, ValidationError } = require('../../utils/errors');
const { Logger } = require('../../utils/logger');

const infoSubcommand = {
  /**
   * @param {import('discord.js').SlashCommandSubcommandBuilder} subcommand
   */
  data: (subcommand) =>
    subcommand
      .setName('bilgi')
      .setDescription('Seçilen webhookun ayrıntılı yapılandırmasını ve durumunu gösterir.')
      .addStringOption((option) =>
        option
          .setName('webhook_id')
          .setDescription('Bilgileri görüntülenecek webhookun ID\'si')
          .setRequired(true)
          .setAutocomplete(true)
      ),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.guild) {
      throw new PermissionError('Bu komut yalnızca bir Discord sunucusunda kullanılabilir.');
    }

    const member = interaction.member;
    PermissionService.assertAllPermissions(member, interaction.guild);

    const webhookId = interaction.options.getString('webhook_id', true).trim();
    if (!webhookId) {
      throw new ValidationError('Lütfen geçerli bir webhook ID girin.');
    }

    Logger.command(`webhook bilgi ${webhookId}`, interaction.user.id, interaction.guild.id);

    const webhook = await WebhookService.getWebhookById(interaction.guild, webhookId);
    const container = WebhookPanelBuilder.buildInfoPanel(webhook, interaction.user.id);

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

module.exports = { infoSubcommand };

