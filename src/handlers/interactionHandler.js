const { handlePaginationInteraction } = require('../components/webhook/pagination');
const { handleActionInteraction } = require('../components/webhook/actions');
const { handleSelectInteraction } = require('../components/webhook/select');
const { handleConfirmationInteraction } = require('../components/webhook/confirmation');
const { handleInteractionError, NotFoundError } = require('../utils/errors');
const { Logger } = require('../utils/logger');

class InteractionHandler {
  /**
   * Centrally dispatches all component interactions (Buttons and Select Menus).
   * @param {import('discord.js').ButtonInteraction | import('discord.js').StringSelectMenuInteraction} interaction
   */
  static async handleComponentInteraction(interaction) {
    const customId = interaction.customId;

    if (!customId.startsWith('wh:')) {
      return;
    }

    try {
      const parts = customId.split(':');
      // parts[0] === 'wh'
      const action = parts[1];
      const args = parts.slice(2);

      switch (action) {
        case 'page':
        case 'ref':
          if (interaction.isButton()) {
            await handlePaginationInteraction(interaction, action, args);
          }
          break;

        case 'url':
        case 'del_prompt':
          if (interaction.isButton()) {
            await handleActionInteraction(interaction, action, args);
          }
          break;

        case 'url_sel':
          if (interaction.isStringSelectMenu()) {
            await handleSelectInteraction(interaction, args);
          }
          break;

        case 'del_ok':
        case 'del_no':
          if (interaction.isButton()) {
            await handleConfirmationInteraction(interaction, action, args);
          }
          break;

        default:
          Logger.warn('EtkileşimYöneticisi', `Bilinmeyen webhook bileşen eylemi: ${action}`);
          throw new NotFoundError('Tanımlanamayan component etkileşimi.');
      }
    } catch (error) {
      await handleInteractionError(interaction, error);
    }
  }
}

module.exports = { InteractionHandler };

