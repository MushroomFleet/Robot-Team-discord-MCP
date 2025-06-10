const { SlashCommandBuilder } = require('discord.js');
const RobotEmbedBuilder = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robot-post')
    .setDescription('Send an immediate post as a robot')
    .addIntegerOption(option =>
      option.setName('robot')
        .setDescription('Robot number (1-7)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(7)
    )
    .addStringOption(option =>
      option.setName('content')
        .setDescription('Message content')
        .setRequired(true)
        .setMaxLength(2000)
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Embed title (optional)')
        .setRequired(false)
        .setMaxLength(256)
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('Image URL for embed (optional)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('thumbnail')
        .setDescription('Thumbnail URL for embed (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const robotId = interaction.options.getInteger('robot');
      const content = interaction.options.getString('content');
      const title = interaction.options.getString('title');
      const image = interaction.options.getString('image');
      const thumbnail = interaction.options.getString('thumbnail');

      // Check if robot has a webhook
      const { Robot } = require('../../models');
      const robot = await Robot.findByPk(robotId);
      
      if (!robot || !robot.webhookId || !robot.isActive) {
        const embedBuilder = new RobotEmbedBuilder(robotId);
        const errorEmbed = embedBuilder.createErrorEmbed(
          new Error(`Robot :${robotId}::robot: is not configured or inactive. Use /init-robot first.`),
          'Robot Post'
        );
        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      const embedBuilder = new RobotEmbedBuilder(robotId);
      let embeds = [];

      // Create embed if title or image/thumbnail provided
      if (title || image || thumbnail) {
        embeds.push(embedBuilder.createStandardEmbed({
          title,
          description: title ? content : undefined,
          image,
          thumbnail
        }));
      }

      // Send message via webhook
      await interaction.client.webhookService.sendMessage(robotId, {
        content: (title || image || thumbnail) ? undefined : content,
        embeds: embeds.length > 0 ? embeds : undefined
      });

      // Send confirmation
      const confirmEmbed = embedBuilder.createSuccessEmbed(
        'Message Posted',
        `Robot :${robotId}::robot: has posted your message!`
      );

      await interaction.editReply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Error posting message:', error);
      
      const embedBuilder = new RobotEmbedBuilder(1);
      const errorEmbed = embedBuilder.createErrorEmbed(
        error,
        'Failed to post message. Check robot configuration and permissions.'
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
