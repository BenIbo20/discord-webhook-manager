const { Collection } = require('discord.js');
const { webhookCommand } = require('../commands/webhook');
const { handleInteractionError, NotFoundError } = require('../utils/errors');
const { Logger } = require('../utils/logger');

class CommandHandler {
  /** @type {Collection<string, any>} */
  static commands = new Collection();

  /**
   * Initializes and registers all slash commands into memory.
   */
  static init() {
    this.commands.clear();
    this.registerCommand(webhookCommand);
    Logger.info('KomutYöneticisi', `Toplam ${this.commands.size} komut belleğe başarıyla yüklendi.`);
  }

  static registerCommand(command) {
    this.commands.set(command.data.name, command);
  }

  static getCommands() {
    return this.commands;
  }

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  static async handleChatInput(interaction) {
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      Logger.warn('KomutYöneticisi', `Komut bulunamadı: /${interaction.commandName}`);
      await handleInteractionError(interaction, new NotFoundError('Komut bulunamadı.'));
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      await handleInteractionError(interaction, error);
    }
  }

  /**
   * @param {import('discord.js').AutocompleteInteraction} interaction
   */
  static async handleAutocomplete(interaction) {
    const command = this.commands.get(interaction.commandName);
    if (!command || typeof command.autocomplete !== 'function') return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      Logger.error('KomutYöneticisi', `/${interaction.commandName} komutunda otomatik tamamlama hatası`, error);
    }
  }
}

module.exports = { CommandHandler };

