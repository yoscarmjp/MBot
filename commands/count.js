const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { 
  countReportsByGuild, 
  countReportsByAdmin,
  getReportsByAdmin,
  getReportsByGuild 
} = require('../utils/db/reportOperations');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('count')
    .setDescription('Ver estadisticas de reportes')
    .addSubcommand(subcommand =>
      subcommand
        .setName('servidor')
        .setDescription('Ver total de reportes del servidor actual')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('admin')
        .setDescription('Ver reportes de un admin especifico')
        .addUserOption(option =>
          option
            .setName('usuario')
            .setDescription('El admin a consultar (por defecto: tu)')
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'servidor') {
        const totalReports = await countReportsByGuild(interaction.guildId);
        const reports = await getReportsByGuild(interaction.guildId, 10);

        const embed = new EmbedBuilder()
          .setTitle(`Estadisticas de Reportes - ${interaction.guild.name}`)
          .setColor(10070359)
          .addFields(
            { 
              name: 'Total de Reportes', 
              value: `${totalReports} reportes registrados`, 
              inline: false 
            },
            { 
              name: 'Ultimos 10 Reportes', 
              value: reports.length > 0 
                ? reports.map((r, i) => `${i + 1}. Reporte #${r.id} - <@${r.adminId}>`).join('\n')
                : 'No hay reportes aun',
              inline: false 
            }
          )
          .setFooter({ text: `Servidor: ${interaction.guildId}` })
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        console.log(`[LOG] Estadisticas del servidor consultadas por ${interaction.user.tag}`);
        return;
      }

      if (subcommand === 'admin') {
        const targetUser = interaction.options.getUser('usuario') || interaction.user;
        const totalReports = await countReportsByAdmin(targetUser.id, interaction.guildId);
        const reports = await getReportsByAdmin(targetUser.id, interaction.guildId, 10);

        const embed = new EmbedBuilder()
          .setTitle(`Reportes de ${targetUser.tag}`)
          .setColor(6618983)
          .setThumbnail(targetUser.displayAvatarURL())
          .addFields(
            { 
              name: 'Usuario', 
              value: `${targetUser} (${targetUser.id})`, 
              inline: true 
            },
            { 
              name: 'Total de Reportes', 
              value: `${totalReports} reportes`, 
              inline: true 
            },
            { 
              name: 'Ultimos 10 Reportes', 
              value: reports.length > 0 
                ? reports.map((r, i) => `${i + 1}. #${r.id} - ${new Date(r.createdAt).toLocaleDateString('es-ES')}`).join('\n')
                : 'Sin reportes',
              inline: false 
            }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        console.log(`[LOG] Estadisticas de ${targetUser.tag} consultadas por ${interaction.user.tag}`);
      }
    } catch (error) {
      console.error('[ERROR] Error en comando /count:', error);
      await interaction.editReply('Ocurrio un error al obtener las estadisticas.');
    }
  },
};