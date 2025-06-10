const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Robot, ScheduledPost } = require('../../models');
const RobotEmbedBuilder = require('../../utils/embedBuilder');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('robot-status')
    .setDescription('Check the status of all robots or a specific robot')
    .addIntegerOption(option =>
      option.setName('robot')
        .setDescription('Robot number (1-7)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(7)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const robotId = interaction.options.getInteger('robot');

      if (robotId) {
        // Show specific robot status
        const robot = await Robot.findByPk(robotId);
        const activePosts = await ScheduledPost.count({
          where: { robotId, isActive: true }
        });

        const embedBuilder = new RobotEmbedBuilder(robotId);
        const embed = embedBuilder.createInfoEmbed(
          `Robot :${robotId}::robot: Status`,
          robot ? 'Robot configuration details' : 'Robot not found in database'
        );

        if (robot) {
          embed.addFields([
            { 
              name: '🤖 Status', 
              value: robot.isActive ? '🟢 Active' : '🔴 Inactive', 
              inline: true 
            },
            { 
              name: '🪝 Webhook', 
              value: robot.webhookId ? '✅ Configured' : '❌ Not configured', 
              inline: true 
            },
            { 
              name: '📅 Active Posts', 
              value: activePosts.toString(), 
              inline: true 
            },
            {
              name: '🆔 Webhook ID',
              value: robot.webhookId ? `\`${robot.webhookId}\`` : 'Not available',
              inline: false
            },
            {
              name: '📅 Created',
              value: `<t:${Math.floor(new Date(robot.createdAt).getTime() / 1000)}:F>`,
              inline: true
            },
            {
              name: '🔄 Updated',
              value: `<t:${Math.floor(new Date(robot.updatedAt).getTime() / 1000)}:R>`,
              inline: true
            }
          ]);

          if (robot.avatarUrl) {
            embed.setThumbnail(robot.avatarUrl);
          }
        } else {
          embed.addFields({
            name: '⚠️ Not Initialized',
            value: `Robot :${robotId}::robot: has not been initialized yet.\nUse \`/init-robot robot:${robotId}\` to set it up.`,
            inline: false
          });
        }

        await interaction.editReply({ embeds: [embed] });

      } else {
        // Show all robots status
        const robots = await Robot.findAll({
          order: [['id', 'ASC']]
        });

        const embed = new EmbedBuilder()
          .setTitle('🤖 Robot Team Status Overview')
          .setColor(0x0099FF)
          .setTimestamp()
          .setFooter({ text: 'Robot Team Management System' });

        let description = '';
        let totalActivePosts = 0;
        let activeRobots = 0;
        let configuredWebhooks = 0;

        for (let i = 1; i <= 7; i++) {
          const robot = robots.find(r => r.id === i);
          const activePosts = await ScheduledPost.count({
            where: { robotId: i, isActive: true }
          });

          totalActivePosts += activePosts;

          const status = robot?.isActive ? '🟢' : '🔴';
          const webhook = robot?.webhookId ? '✅' : '❌';
          
          if (robot?.isActive) activeRobots++;
          if (robot?.webhookId) configuredWebhooks++;
          
          description += `:${i}::robot: ${status} Webhook: ${webhook} Posts: ${activePosts}\n`;
        }

        embed.setDescription(description);

        embed.addFields([
          {
            name: '📊 Summary',
            value: 
              `**Active Robots:** ${activeRobots}/7\n` +
              `**Configured Webhooks:** ${configuredWebhooks}/7\n` +
              `**Total Active Posts:** ${totalActivePosts}\n` +
              `**System Jobs:** ${interaction.client.schedulerService.getJobCount()}`,
            inline: false
          },
          {
            name: '💡 Quick Actions',
            value: 
              '• `/init-robot` - Initialize a robot\n' +
              '• `/robot-post` - Send immediate post\n' +
              '• `/schedule` - Schedule a post\n' +
              '• `/schedule-list` - View scheduled posts',
            inline: false
          }
        ]);

        // Add warning if not all robots are configured
        if (configuredWebhooks < 7) {
          embed.addFields({
            name: '⚠️ Setup Required',
            value: `${7 - configuredWebhooks} robot(s) need initialization. Use \`/init-robot\` for each robot (1-7).`,
            inline: false
          });
        }

        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error checking robot status:', error);
      
      const embedBuilder = new RobotEmbedBuilder(1);
      const errorEmbed = embedBuilder.createErrorEmbed(
        error,
        'Failed to retrieve robot status information.'
      );
      
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
