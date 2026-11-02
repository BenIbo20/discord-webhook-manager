const { Events } = require('discord.js');
const { handleReady } = require('../events/ready');
const { handleInteractionCreate } = require('../events/interactionCreate');
const { Logger } = require('../utils/logger');

class EventHandler {
  /**
   * Registers all core client event listeners.
   * @param {import('discord.js').Client} client
   */
  static registerEvents(client) {
    client.once(Events.ClientReady, (readyClient) => {
      handleReady(readyClient);
    });

    client.on(Events.InteractionCreate, async (interaction) => {
      await handleInteractionCreate(interaction);
    });

    client.on(Events.Error, (error) => {
      Logger.error('İstemciHatası', 'Discord istemcisinde dahili bir hata meydana geldi', error);
    });

    client.on(Events.Warn, (info) => {
      Logger.warn('İstemciUyarısı', info);
    });

    Logger.info('OlayYöneticisi', 'Temel istemci olay dinleyicileri başarıyla kaydedildi.');
  }
}

module.exports = { EventHandler };

