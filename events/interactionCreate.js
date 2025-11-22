module.exports = {
  name: 'interactionCreate',
  
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`[ERROR] Comando no encontrado: ${interaction.commandName}`);
      return;
    }

    try {
      console.log(`[COMANDO] /${interaction.commandName} ejecutado por ${interaction.user.tag} en ${interaction.guild.name}`);
      await command.execute(interaction);
    } catch (error) {
      console.error(`[ERROR] Error ejecutando comando /${interaction.commandName}:`, error);
      
      const reply = {
        content: 'Hubo un error al ejecutar este comando.',
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },
};