const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ScheduledPost, Robot } = require('../../models');
const RobotEmbedBuilder = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('schedule-list')
    .setDescription('List all scheduled posts')
    .addIntegerOption(option =>
      option.setName('robot')
        .setDescription('Filter by robot number (1-7)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(7)
    )
    .addBooleanOption(option =>
      option.setName('show-inactive')
        .setDescription('Include inactive/completed posts')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const robotFilter = interaction.options.getInteger('robot');
      const showInactive = interaction.options.getBoolean('show-inactive') || false;
      
      const whereClause = {};
      if (!showInactive) whereClause.isActive = true;
      if (robotFilter) whereClause.robotId = robotFilter;

      const scheduledPosts = await ScheduledPost.findAll({
        where: whereClause,
        include: [Robot],
        order: [['scheduledFor', 'ASC'], ['createdAt', 'ASC']],
        limit: 15
      });

      if (scheduledPosts.length === 0) {
        const embedBuilder = new RobotEmbedBuilder(robotFilter || 1);
        const embed = embedBuilder.createInfoEmbed(
          'No Scheduled Posts',
          robotFilter 
            ? `No scheduled posts found for Robot :${robotFilter}::robot:`
            : 'No scheduled posts found. Use `/schedule` to create one!'
        );
        
        embed.addFields({
          name: '💡 Get Started',
          value: '• `/schedule robot:1 content:"Hello World!" when:"2024-12-25 15:30"`\n• `/robot-post` for immediate posts',
          inline: false
        });
        
        return await interaction.editReply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setTitle('📅 Scheduled Posts')
        .setColor(0x0099FF)
        .setTimestamp()
        .setFooter({ text: `Showing ${scheduledPosts.length} post(s)` });

      if (robotFilter) {
        embed.setDescription(`Filtered by Robot :${robotFilter}::robot:`);
      }

      let description = '';
      const fields = [];

      for (const post of scheduledPosts) {
        const preview = post.content 
          ? post.content.substring(0, 80) + (post.content.length > 80 ? '...' : '')
          : post.embedData?.title || 'Rich embed content';
        
        const schedule = post.isRecurring 
          ? `🔄 \`${post.cronExpression}\``
          : `⏰ <t:${Math.floor(new Date(post.scheduledFor).getTime() / 1000)}:R>`;

        const status = post.isActive ? '🟢' : '🔴';
        const robotEmoji = `:${post.robotId}::robot:`;

        fields.push({
          name: `${status} ${robotEmoji} - ${preview}`,
          value: 
            `${schedule}\n` +
            `**ID:** \`${post.id}\`\n` +
            `**Created:** <t:${Math.floor(new Date(post.createdAt).getTime() / 1000)}:R>` +
            (post.lastExecuted ? `\n**Last Run:** <t:${Math.floor(new Date(post.lastExecuted).getTime() / 1000)}:R>` : ''),
          inline: false
        });
      }

      // Add fields in chunks to avoid embed limit
      const maxFields = 10;
      if (fields.length <= maxFields) {
        embed.addFields(fields);
      } else {
        embed.addFields(fields.slice(0, maxFields));
        embed.addFields({
          name: '📄 More Results',
          value: `Showing first ${maxFields} of ${fields.length} results. Use robot filter or show-inactive options to narrow down.`,
          inline: false
        });
      }

      // Add summary information
      const totalActive = scheduledPosts.filter(p => p.isActive).length;
      const totalRecurring = scheduledPosts.filter(p => p.isRecurring).length;
      
      embed.addFields({
        name: '📊 Summary',
        value: 
          `**Active Posts:** ${totalActive}\n` +
          `**Recurring Posts:** ${totalRecurring}\n` +
          `**One-time Posts:** ${scheduledPosts.length - totalRecurring}`,
        inline: true
      });

      embed.addFields({
        name: '🛠️ Management',
        value: 
          '• `/schedule-cancel` - Cancel a post\n' +
          '• `/robot-status` - Check robot status\n' +
          '• `/schedule` - Create new post',
        inline: true
      });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error listing scheduled posts:', error);
      
      const embedBuilder = new RobotEmbedBuilder(1);
      const errorEmbed = embedBuilder.createErrorEmbed(
        error,
        'Failed to retrieve scheduled posts.'
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
