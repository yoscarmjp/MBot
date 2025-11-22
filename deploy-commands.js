const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error('Faltan variables de entorno: DISCORD_TOKEN o DISCORD_CLIENT_ID');
  process.exit(1);
}

// Recopilar comandos
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

console.log('[CARGA] Recopilando comandos...');

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`Comando recopilado: /${command.data.name}`);
  }
}

console.log(`\n[TOTAL] ${commands.length} comandos listos para registrar\n`);

// Registrar comandos
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('[REGISTRO] Enviando comandos a Discord...');
    
    // Si hay GUILD_ID, registrar solo en ese servidor (más rápido para testing)
    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands },
      );
      console.log(`Comandos registrados en el servidor: ${GUILD_ID}`);
    } else {
      // Registrar globalmente (tarda 1 hora en propagarse)
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands },
      );
      console.log('Comandos registrados globalmente');
      console.log('Nota: Los comandos pueden tardar hasta 1 hora en aparecer');
    }

    console.log('\n¡Comandos registrados exitosamente!');
  } catch (error) {
    console.error('Error registrando comandos:', error);
    process.exit(1);
  }
})();