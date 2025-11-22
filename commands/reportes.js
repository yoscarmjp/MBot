const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getReportById } = require('../utils/db/reportOperations');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verreporte')
    .setDescription('Ver los detalles de un informe de actividad')
    .addNumberOption(option =>
      option
        .setName('id')
        .setDescription('ID del informe a consultar')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const reportId = interaction.options.getNumber('id');
      const report = await getReportById(reportId);

      if (!report) {
        return interaction.editReply('El informe especificado no existe o ha sido eliminado.');
      }

      // Verificar permisos - solo admins o el creador pueden ver
      if (interaction.user.id !== report.adminId && !interaction.member.permissions.has('ManageGuild')) {
        return interaction.editReply('No tienes permisos para ver este informe.');
      }

      const embed = new EmbedBuilder()
        .setTitle(`Informe de Actividad #${report.id}`)
        .setDescription(report.description)
        .setAuthor({ name: report.adminTag })
        .setColor('#2ecc71')
        .addFields(
          { name: 'Admin ID', value: `<@${report.adminId}>`, inline: true },
          { name: 'ID Reporte', value: `${report.id}`, inline: true },
          { name: 'Fecha de Creación', value: `<t:${Math.floor(new Date(report.createdAt).getTime() / 1000)}:f>`, inline: false }
        )
        .setImage(report.photo1Url)
        .setThumbnail(report.photo2Url)
        .setFooter({ text: `Servidor: ${report.guildId}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando /verreporte:', error);
      await interaction.editReply('Ocurrió un error al obtener el informe.');
    }
  },
};