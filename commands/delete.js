const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getReportById, deleteReport, getReportMessageInfo } = require('../utils/db/reportOperations');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('eliminar')
    .setDescription('Eliminar un informe de actividad')
    .addNumberOption(option =>
      option
        .setName('id')
        .setDescription('ID del informe a eliminar')
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const reportId = interaction.options.getNumber('id');
      const report = await getReportById(reportId);

      if (!report) {
        return interaction.editReply('El informe no existe o ya ha sido eliminado.');
      }

      if (interaction.user.id !== report.adminId && !interaction.member.permissions.has('ManageGuild')) {
        return interaction.editReply('No tienes permisos para eliminar este reporte.');
      }

      const messageInfo = await getReportMessageInfo(reportId);
      if (messageInfo && messageInfo.messageId && messageInfo.channelId) {
        try {
          const channel = await interaction.guild.channels.fetch(messageInfo.channelId);
          const message = await channel.messages.fetch(messageInfo.messageId);
          await message.delete();
          console.log(`[LOG] Mensaje del reporte #${reportId} eliminado de Discord`);
        } catch (error) {
          console.error('[ERROR] Error eliminando mensaje de Discord:', error);
        }
      }

      await deleteReport(reportId);

      const embed = new EmbedBuilder()
        .setTitle('Reporte Eliminado')
        .setDescription(`El informe #${reportId} ha sido eliminado correctamente.`)
        .setColor(15158332)
        .addFields(
          { name: 'ID del Reporte', value: `${reportId}`, inline: true },
          { name: 'Admin Original', value: `<@${report.adminId}>`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      console.log(`[LOG] Reporte #${reportId} eliminado por ${interaction.user.tag}`);
    } catch (error) {
      console.error('[ERROR] Error en comando /eliminar:', error);
      await interaction.editReply('Ocurrio un error al eliminar el reporte.');
    }
  },
};