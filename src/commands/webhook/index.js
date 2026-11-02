const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');
const { listSubcommand } = require('./list');
const { infoSubcommand } = require('./info');
const { createSubcommand } = require('./create');
const { deleteSubcommand } = require('./delete');
const { editSubcommand } = require('./edit');
const { handleInteractionError, NotFoundError } = require('../../utils/errors');

const webhookCommandBuilder = new SlashCommandBuilder()
  .setName('webhook')
  .setDescription('Discord sunucusundaki webhookları merkezi olarak yönetir.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks)
  .setDMPermission(false)
  .addSubcommand(listSubcommand.data)
  .addSubcommand(infoSubcommand.data)
  .addSubcommand(createSubcommand.data)
  .addSubcommand(deleteSubcommand.data)
  .addSubcommand(editSubcommand.data);

const subcommands = {
  liste: listSubcommand,
  bilgi: infoSubcommand,
  olustur: createSubcommand,
  sil: deleteSubcommand,
  duzenle: editSubcommand
};

const webhookCommand = {
  data: webhookCommandBuilder,

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const subcommandName = interaction.options.getSubcommand();
    const handler = subcommands[subcommandName];

    if (!handler) {
      throw new NotFoundError(`'${subcommandName}' alt komutu bulunamadı.`);
    }

    try {
      await handler.execute(interaction);
    } catch (error) {
      await handleInteractionError(interaction, error);
    }
  },

  /**
   * @param {import('discord.js').AutocompleteInteraction} interaction
   */
  async autocomplete(interaction) {
    const subcommandName = interaction.options.getSubcommand();
    const handler = subcommands[subcommandName];

    if (handler && typeof handler.autocomplete === 'function') {
      await handler.autocomplete(interaction);
    }
  }
};

module.exports = { webhookCommand };

