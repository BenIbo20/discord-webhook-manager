const { CommandHandler } = require('../handlers/commandHandler');
const { InteractionHandler } = require('../handlers/interactionHandler');
const { Logger } = require('../utils/logger');

/**
 * Centrally routes all gateway interactions.
 * @param {import('discord.js').Interaction} interaction
 */
async function handleInteractionCreate(interaction) {
  try {
    if (interaction.isChatInputCommand()) {
      await CommandHandler.handleChatInput(interaction);
    } else if (interaction.isAutocomplete()) {
      await CommandHandler.handleAutocomplete(interaction);
    } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
      await InteractionHandler.handleComponentInteraction(interaction);
    }
  } catch (error) {
    Logger.error('Etkileşim', 'Etkileşim işlenirken beklenmeyen bir hata oluştu', error);
  }
}

module.exports = { handleInteractionCreate };

