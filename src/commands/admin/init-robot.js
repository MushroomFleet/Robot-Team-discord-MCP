const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const RobotEmbedBuilder = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('init-robot')
    .setDescription('Initialize a robot with webhook (Admin only)')
    .addIntegerOption(option =>
      option.setName('robot')
        .setDescription('Robot number (1-7)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(7)
    )
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to create webhook in (defaults to current)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const robotId = interaction.options.getInteger('robot');
      const channel = interaction.options.getChannel('channel') || interaction.channel;

      // Check if robot already has a webhook
      const { Robot } = require('../../models');
      const existingRobot = await Robot.findByPk(robotId);
      
      if (existingRobot && existingRobot.webhookId) {
        const embedBuilder = new RobotEmbedBuilder(robotId);
        const errorEmbed = embedBuilder.createErrorEmbed(
          new Error(`Robot :${robotId}::robot: already has a webhook configured.`),
          'Robot Initialization'
        );
        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Create webhook
      const webhook = await interaction.client.webhookService.createWebhookForRobot(
        interaction.client,
        channel.id,
        robotId
      );

      const embedBuilder = new RobotEmbedBuilder(robotId);
      const successEmbed = embedBuilder.createSuccessEmbed(
        'Robot Initialized',
        `Successfully initialized Robot :${robotId}::robot:!\n\n` +
        `📍 **Webhook created in:** ${channel}\n` +
        `🆔 **Webhook ID:** \`${webhook.id}\`\n` +
        `🤖 **Status:** Active and ready to post`
      );

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error initializing robot:', error);
      
      const embedBuilder = new RobotEmbedBuilder(1);
      const errorEmbed = embedBuilder.createErrorEmbed(
        error,
        'Make sure I have "Manage Webhooks" permission in this channel.'
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
