const { MessageFlags } = require('discord.js');
const { WebhookService } = require('../../services/WebhookService');
const { WebhookPanelBuilder } = require('../../builders/WebhookPanelBuilder');
const { PermissionService } = require('../../services/PermissionService');
const { PermissionError } = require('../../utils/errors');
const { Logger } = require('../../utils/logger');

const listSubcommand = {
  /**
   * @param {import('discord.js').SlashCommandSubcommandBuilder} subcommand
   */
  data: (subcommand) =>
    subcommand
      .setName('liste')
      .setDescription('Sunucudaki bütün webhookları Components V2 paneli ile listeler.'),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.guild) {
      throw new PermissionError('Bu komut yalnızca bir Discord sunucusunda kullanılabilir.');
    }

    const member = interaction.member;
    PermissionService.assertAllPermissions(member, interaction.guild);

    Logger.command('webhook liste', interaction.user.id, interaction.guild.id);

    const webhooks = await WebhookService.fetchGuildWebhooks(interaction.guild);
    const container = WebhookPanelBuilder.buildListPanel(webhooks, 1, interaction.user.id);

    await interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2
    });
  }
};

module.exports = { listSubcommand };

