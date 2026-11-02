const { ActivityType } = require('discord.js');
const { Logger } = require('../utils/logger');

/**
 * Handles client ready event.
 * @param {import('discord.js').Client<true>} client
 */
function handleReady(client) {
  // Activity message strictly set as requested: github.com/BenIbo20
  client.user.setPresence({
    activities: [
      {
        name: 'github.com/BenIbo20',
        type: ActivityType.Custom,
        state: 'github.com/BenIbo20'
      }
    ],
    status: 'online'
  });

  Logger.info(
    'Başlangıç',
    `Bot ${client.user.tag} (ID: ${client.user.id}) olarak başarıyla giriş yaptı. Hizmet verilen sunucu sayısı: ${client.guilds.cache.size}.`
  );
}

module.exports = { handleReady };

