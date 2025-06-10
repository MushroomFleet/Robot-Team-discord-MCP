const { SlashCommandBuilder } = require('discord.js');
const { ScheduledPost } = require('../../models');
const RobotEmbedBuilder = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule-cancel')
    .setDescription('Cancel a scheduled post')
    .addStringOption(option =>
      option.setName('post-id')
        .setDescription('The ID of the scheduled post to cancel')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const postId = interaction.options.getString('post-id');

      const scheduledPost = await ScheduledPost.findByPk(postId);
      if (!scheduledPost) {
        const embedBuilder = new RobotEmbedBuilder(1);
        const errorEmbed = embedBuilder.createErrorEmbed(
          new Error('Scheduled post not found. Please check the post ID.'),
          'Cancel Scheduled Post'
        );
        errorEmbed.addFields({
          name: '💡 How to find Post IDs',
          value: 'Use `/schedule-list` to see all scheduled posts and their IDs.',
          inline: false
        });
        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      if (!scheduledPost.isActive) {
        const embedBuilder = new RobotEmbedBuilder(scheduledPost.robotId);
        const errorEmbed = embedBuilder.createErrorEmbed(
          new Error('This post is already inactive or has been cancelled.'),
          'Cancel Scheduled Post'
        );
        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      // Cancel the job in scheduler
      const cancelled = interaction.client.schedulerService.cancelJob(postId);
      
      // Deactivate in database
      await scheduledPost.update({ isActive: false });

      const embedBuilder = new RobotEmbedBuilder(scheduledPost.robotId);
      const successEmbed = embedBuilder.createSuccessEmbed(
        'Scheduled Post Cancelled',
        `Successfully cancelled scheduled post for Robot :${scheduledPost.robotId}::robot:`
      );

      const preview = scheduledPost.content 
        ? scheduledPost.content.substring(0, 100) + (scheduledPost.content.length > 100 ? '...' : '')
        : scheduledPost.embedData?.title || 'Rich embed content';

      successEmbed.addFields([
        {
          name: '📝 Content Preview',
          value: preview,
          inline: false
        },
        {
          name: '🗓️ Was Scheduled',
          value: scheduledPost.isRecurring 
            ? `🔄 Recurring: \`${scheduledPost.cronExpression}\``
            : `⏰ One-time: <t:${Math.floor(new Date(scheduledPost.scheduledFor).getTime() / 1000)}:F>`,
          inline: false
        },
        {
          name: '🆔 Post ID',
          value: `\`${postId}\``,
          inline: true
        },
        {
          name: '🤖 Robot',
          value: `:${scheduledPost.robotId}::robot:`,
          inline: true
        },
        {
          name: '📊 Status',
          value: cancelled ? '✅ Job cancelled from scheduler' : '⚠️ Job was not active in scheduler',
          inline: false
        }
      ]);

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      
      const embedBuilder = new RobotEmbedBuilder(1);
      const errorEmbed = embedBuilder.createErrorEmbed(
        error,
        'Failed to cancel scheduled post. Please try again.'
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
