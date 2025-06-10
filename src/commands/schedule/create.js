const { SlashCommandBuilder } = require('discord.js');
const { ScheduledPost } = require('../../models');
const RobotEmbedBuilder = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Schedule a post for a robot')
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
      option.setName('when')
        .setDescription('When to post (e.g., "2024-12-25 15:30" or "0 15 * * *" for cron)')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('recurring')
        .setDescription('Is this a recurring post?')
        .setRequired(false)
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
    await interaction.deferReply();

    try {
      const robotId = interaction.options.getInteger('robot');
      const content = interaction.options.getString('content');
      const when = interaction.options.getString('when');
      const recurring = interaction.options.getBoolean('recurring') || false;
      const title = interaction.options.getString('title');
      const image = interaction.options.getString('image');
      const thumbnail = interaction.options.getString('thumbnail');

      // Check if robot exists and is active
      const { Robot } = require('../../models');
      const robot = await Robot.findByPk(robotId);
      
      if (!robot || !robot.webhookId || !robot.isActive) {
        const embedBuilder = new RobotEmbedBuilder(robotId);
        const errorEmbed = embedBuilder.createErrorEmbed(
          new Error(`Robot :${robotId}::robot: is not configured or inactive. Use /init-robot first.`),
          'Schedule Post'
        );
        return await interaction.editReply({ embeds: [errorEmbed] });
      }

      let scheduledFor = null;
      let cronExpression = null;

      if (recurring) {
        // Validate cron expression
        const cron = require('node-cron');
        if (!cron.validate(when)) {
          const embedBuilder = new RobotEmbedBuilder(robotId);
          const errorEmbed = embedBuilder.createErrorEmbed(
            new Error('Invalid cron expression. Use format: `0 15 * * *` (minute hour day month weekday)'),
            'Cron Validation'
          );
          errorEmbed.addFields({
            name: 'Cron Examples',
            value: '`0 9 * * *` - Daily at 9:00 AM\n`0 */6 * * *` - Every 6 hours\n`0 0 * * MON` - Every Monday at midnight',
            inline: false
          });
          return await interaction.editReply({ embeds: [errorEmbed] });
        }
        cronExpression = when;
      } else {
        // Parse date/time
        scheduledFor = new Date(when);
        if (isNaN(scheduledFor.getTime())) {
          const embedBuilder = new RobotEmbedBuilder(robotId);
          const errorEmbed = embedBuilder.createErrorEmbed(
            new Error('Invalid date format. Use: `YYYY-MM-DD HH:MM` or `MM/DD/YYYY HH:MM`'),
            'Date Validation'
          );
          errorEmbed.addFields({
            name: 'Date Examples',
            value: '`2024-12-25 15:30`\n`12/25/2024 3:30 PM`\n`Dec 25 2024 15:30`',
            inline: false
          });
          return await interaction.editReply({ embeds: [errorEmbed] });
        }
        if (scheduledFor <= new Date()) {
          const embedBuilder = new RobotEmbedBuilder(robotId);
          const errorEmbed = embedBuilder.createErrorEmbed(
            new Error('Scheduled time must be in the future'),
            'Date Validation'
          );
          return await interaction.editReply({ embeds: [errorEmbed] });
        }
      }

      // Create embed data if title or image/thumbnail provided
      let embedData = null;
      if (title || image || thumbnail) {
        embedData = {
          title,
          description: title ? content : undefined,
          image,
          thumbnail
        };
      }

      // Create scheduled post
      const scheduledPost = await interaction.client.schedulerService.addScheduledPost({
        robotId,
        channelId: interaction.channel.id,
        content: embedData ? undefined : content,
        embedData,
        scheduledFor,
        cronExpression,
        isRecurring: recurring,
        createdBy: interaction.user.id
      });

      // Create confirmation embed
      const embedBuilder = new RobotEmbedBuilder(robotId);
      const confirmEmbed = embedBuilder.createSuccessEmbed(
        'Post Scheduled Successfully',
        `Robot :${robotId}::robot: will post your message`
      );

      confirmEmbed.addFields([
        {
          name: '📝 Content Preview',
          value: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          inline: false
        },
        {
          name: '⏰ Schedule',
          value: recurring 
            ? `🔄 **Recurring:** \`${cronExpression}\``
            : `⏱️ **One-time:** <t:${Math.floor(scheduledFor.getTime() / 1000)}:F>`,
          inline: false
        },
        {
          name: '🆔 Post ID',
          value: `\`${scheduledPost.id}\``,
          inline: true
        },
        {
          name: '📍 Channel',
          value: `${interaction.channel}`,
          inline: true
        }
      ]);

      if (title) {
        confirmEmbed.addFields({
          name: '🏷️ Embed Title',
          value: title,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Error scheduling post:', error);
      
      const embedBuilder = new RobotEmbedBuilder(1);
      const errorEmbed = embedBuilder.createErrorEmbed(
        error,
        'Failed to schedule post. Please check your inputs and try again.'
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
