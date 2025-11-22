const { ActivityType } = require('discord.js');
const { initializeDatabase } = require('../utils/db/connection');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    console.log(`Bot conectado como: ${client.user.tag}`);
    
    try {
      await initializeDatabase();
      console.log('Base de datos inicializada correctamente');
    } catch (error) {
      console.error('[ERROR] Error al inicializar la base de datos:', error);
    }

    client.user.setActivity('Moderando', { type: ActivityType.Watching });
  },
};