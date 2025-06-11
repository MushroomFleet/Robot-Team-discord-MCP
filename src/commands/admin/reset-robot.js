const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const RobotEmbedBuilder = require('../../utils/embedBuilder');
const { getRobotName } = require('../../utils/robotNames');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reset-robot')
    .setDescription('Reset a robot by deleting its webhook and clearing configuration (Admin only)')
    .addIntegerOption(option =>
      option.setName('robot')
        .setDescription('Robot number (1-7)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(7)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const robotId = interaction.options.getInteger('robot');
      const embedBuilder = new RobotEmbedBuilder(robotId);

      // Check if robot exists
      const { Robot } = require('../../models');
      const robot = await Robot.findByPk(robotId);
      
      if (!robot || !robot.webhookId) {
        const infoEmbed = embedBuilder.createInfoEmbed(
          'Robot Not Found',
          `Robot ${getRobotName(robotId)} is not initialized or doesn't have a webhook.`
        );
        return await interaction.editReply({ embeds: [infoEmbed] });
      }

      // Delete webhook using the webhook service
      try {
        await interaction.client.webhookService.deleteWebhook(robotId);
        
        const successEmbed = embedBuilder.createSuccessEmbed(
          'Robot Reset Successfully',
          `Robot ${getRobotName(robotId)} has been reset!\n\n` +
          `✅ Webhook deleted\n` +
          `✅ Configuration cleared\n\n` +
          `You can now use \`/init-robot robot:${robotId}\` to reinitialize with proper settings.`
        );

        await interaction.editReply({ embeds: [successEmbed] });

      } catch (webhookError) {
        console.warn(`Warning: Could not delete webhook for robot ${robotId}:`, webhookError.message);
        
        // Even if webhook deletion fails, clear the database
        await Robot.update(
          { 
            webhookId: null, 
            webhookToken: null, 
            avatarUrl: null,
            isActive: false 
          },
          { where: { id: robotId } }
        );

        const warningEmbed = embedBuilder.createInfoEmbed(
          'Robot Reset (Partial)',
          `Robot ${getRobotName(robotId)} configuration has been cleared from database.\n\n` +
          `⚠️ Note: The Discord webhook may still exist (possibly already deleted).\n` +
          `✅ Database cleared\n\n` +
          `You can now use \`/init-robot robot:${robotId}\` to reinitialize.`
        );

        await interaction.editReply({ embeds: [warningEmbed] });
      }

    } catch (error) {
      console.error('Error resetting robot:', error);
      
      const embedBuilder = new RobotEmbedBuilder(1);
      const errorEmbed = embedBuilder.createErrorEmbed(
        error,
        'Failed to reset robot. Please check permissions and try again.'
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
