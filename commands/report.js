const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { createReport, updateReportMessageInfo } = require('../utils/db/reportOperations');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reportar')
    .setDescription('Crear un nuevo informe de actividad')
    .addStringOption(option =>
      option
        .setName('descripcion')
        .setDescription('Descripcion detallada de la actividad realizada')
        .setRequired(true)
        .setMaxLength(500)
    )
    .addAttachmentOption(option =>
      option
        .setName('foto1')
        .setDescription('Primera foto de la actividad')
        .setRequired(true)
    )
    .addAttachmentOption(option =>
      option
        .setName('foto2')
        .setDescription('Segunda foto de la actividad')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const description = interaction.options.getString('descripcion');
      const photo1 = interaction.options.getAttachment('foto1');
      const photo2 = interaction.options.getAttachment('foto2');

      if (!description || description.trim() === '') {
        return interaction.editReply('La descripcion es requerida y no puede estar vacia.');
      }

      if (!photo1) {
        return interaction.editReply('La primera foto es requerida.');
      }

      if (!photo2) {
        return interaction.editReply('La segunda foto es requerida.');
      }

      if (!photo1.contentType?.startsWith('image/')) {
        return interaction.editReply('El archivo de foto1 debe ser una imagen valida.');
      }

      if (!photo2.contentType?.startsWith('image/')) {
        return interaction.editReply('El archivo de foto2 debe ser una imagen valida.');
      }

      const reportData = {
        guildId: interaction.guildId,
        adminId: interaction.user.id,
        adminTag: interaction.user.tag,
        description: description.trim(),
        photo1Url: photo1.url,
        photo2Url: photo2.url,
      };

      const reportId = await createReport(reportData);

      const reportChannel = interaction.guild.channels.cache.find(
        ch => ch.name === 'reportes-actividad' && ch.type === ChannelType.GuildText
      );

      let messageId = null;
      let channelId = null;

      if (reportChannel) {
        const embed = new EmbedBuilder()
          .setTitle(`Informe de Actividad #${reportId}`)
          .setDescription(description.trim())
          .setAuthor({ 
            name: interaction.user.tag, 
            iconURL: interaction.user.displayAvatarURL() 
          })
          .setColor(5814783)
          .addFields(
            { name: 'Admin', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'ID Reporte', value: `${reportId}`, inline: true }
          )
          .setImage(photo1.url)
          .setThumbnail(photo2.url)
          .setFooter({ text: `Servidor: ${interaction.guild.name}` })
          .setTimestamp();

        const message = await reportChannel.send({ embeds: [embed] });
        messageId = message.id;
        channelId = reportChannel.id;

        await updateReportMessageInfo(reportId, messageId, channelId);
      }

      const response = channelId 
        ? `Informe #${reportId} creado exitosamente en <#${channelId}>`
        : `Informe #${reportId} creado exitosamente.`;

      await interaction.editReply(response);
      console.log(`[LOG] Reporte #${reportId} creado por ${interaction.user.tag}`);
    } catch (error) {
      console.error('[ERROR] Error en comando /reportar:', error);
      await interaction.editReply('Hubo un error al crear el informe. Intenta nuevamente.');
    }
  },
};