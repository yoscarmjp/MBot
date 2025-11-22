const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getReportById, updateReport, getReportMessageInfo } = require('../utils/db/reportOperations');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editar')
    .setDescription('Editar un informe de actividad existente')
    .addNumberOption(option =>
      option
        .setName('id')
        .setDescription('ID del informe a editar')
        .setRequired(true)
        .setMinValue(1)
    )
    .addStringOption(option =>
      option
        .setName('descripcion')
        .setDescription('Nueva descripcion del reporte')
        .setRequired(false)
        .setMaxLength(500)
    )
    .addAttachmentOption(option =>
      option
        .setName('foto1')
        .setDescription('Nueva primera foto')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName('foto2')
        .setDescription('Nueva segunda foto')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const reportId = interaction.options.getNumber('id');
      const newDescription = interaction.options.getString('descripcion');
      const newPhoto1 = interaction.options.getAttachment('foto1');
      const newPhoto2 = interaction.options.getAttachment('foto2');

      const report = await getReportById(reportId);

      if (!report) {
        return interaction.editReply('El informe no existe o ha sido eliminado.');
      }

      if (interaction.user.id !== report.adminId && !interaction.member.permissions.has('ManageGuild')) {
        return interaction.editReply('No tienes permisos para editar este reporte.');
      }

      if (!newDescription && !newPhoto1 && !newPhoto2) {
        return interaction.editReply('Debes proporcionar al menos un campo a editar.');
      }

      if (newPhoto1 && !newPhoto1.contentType?.startsWith('image/')) {
        return interaction.editReply('El archivo de foto1 debe ser una imagen valida.');
      }

      if (newPhoto2 && !newPhoto2.contentType?.startsWith('image/')) {
        return interaction.editReply('El archivo de foto2 debe ser una imagen valida.');
      }

      const updateData = {};
      if (newDescription) updateData.description = newDescription;
      if (newPhoto1) updateData.photo1Url = newPhoto1.url;
      if (newPhoto2) updateData.photo2Url = newPhoto2.url;

      await updateReport(reportId, updateData);

      const messageInfo = await getReportMessageInfo(reportId);
      if (messageInfo && messageInfo.messageId && messageInfo.channelId) {
        try {
          const channel = await interaction.guild.channels.fetch(messageInfo.channelId);
          const message = await channel.messages.fetch(messageInfo.messageId);

          const updatedReport = await getReportById(reportId);
          const embed = new EmbedBuilder()
            .setTitle(`Informe de Actividad #${updatedReport.id}`)
            .setDescription(updatedReport.description)
            .setAuthor({ 
              name: updatedReport.adminTag, 
              iconURL: interaction.user.displayAvatarURL() 
            })
            .setColor(5814783)
            .addFields(
              { name: 'Admin', value: `<@${updatedReport.adminId}>`, inline: true },
              { name: 'ID Reporte', value: `${updatedReport.id}`, inline: true }
            )
            .setImage(updatedReport.photo1Url)
            .setThumbnail(updatedReport.photo2Url)
            .setFooter({ text: `Servidor: ${interaction.guild.name}` })
            .setTimestamp();

          await message.edit({ embeds: [embed] });
        } catch (error) {
          console.error('[ERROR] Error actualizando mensaje en Discord:', error);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(`Reporte #${reportId} Actualizado`)
        .setColor(2597015)
        .setDescription('Los cambios han sido aplicados exitosamente.')
        .addFields(
          { 
            name: 'Cambios Realizados', 
            value: [
              newDescription ? '- Descripcion actualizada' : '',
              newPhoto1 ? '- Foto 1 actualizada' : '',
              newPhoto2 ? '- Foto 2 actualizada' : ''
            ].filter(Boolean).join('\n'), 
            inline: false 
          }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      console.log(`[LOG] Reporte #${reportId} editado por ${interaction.user.tag}`);
    } catch (error) {
      console.error('[ERROR] Error en comando /editar:', error);
      await interaction.editReply('Ocurrio un error al editar el reporte.');
    }
  },
};