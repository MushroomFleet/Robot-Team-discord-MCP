const { EmbedBuilder } = require('discord.js');

class RobotEmbedBuilder {
  constructor(robotId) {
    this.robotId = robotId;
    this.colors = {
      1: 0xFF0000, // Red
      2: 0x00FF00, // Green  
      3: 0x0099FF, // Blue
      4: 0xFFFF00, // Yellow
      5: 0xFF00FF, // Magenta
      6: 0x00FFFF, // Cyan
      7: 0xFFA500  // Orange
    };
    this.robotNames = {
      1: ':one::robot:',
      2: ':two::robot:',
      3: ':three::robot:',
      4: ':four::robot:',
      5: ':five::robot:',
      6: ':six::robot:',
      7: ':seven::robot:'
    };
  }

  getRobotName(robotId) {
    return this.robotNames[robotId] || `:${robotId}::robot:`;
  }

  createStandardEmbed(options = {}) {
    const embed = new EmbedBuilder()
      .setColor(this.colors[this.robotId] || 0x0099FF)
      .setTimestamp()
      .setFooter({ 
        text: `Robot ${this.robotId}`, 
        iconURL: options.robotAvatarUrl 
      });

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    if (options.url) embed.setURL(options.url);
    
    if (options.author) {
      embed.setAuthor({
        name: options.author.name,
        iconURL: options.author.iconURL,
        url: options.author.url
      });
    }

    if (options.fields && Array.isArray(options.fields)) {
      embed.addFields(options.fields);
    }

    return embed;
  }

  createAnnouncementEmbed(title, description, options = {}) {
    return this.createStandardEmbed({
      title: `📢 ${title}`,
      description,
      thumbnail: options.thumbnail,
      ...options
    });
  }

  createScheduledPostEmbed(content, scheduledFor) {
    return this.createStandardEmbed({
      title: '⏰ Scheduled Post',
      description: content,
      fields: [
        {
          name: 'Scheduled For',
          value: `<t:${Math.floor(scheduledFor.getTime() / 1000)}:F>`,
          inline: true
        },
        {
          name: 'Robot',
          value: this.getRobotName(this.robotId),
          inline: true
        }
      ]
    });
  }

  createErrorEmbed(error, context = '') {
    return this.createStandardEmbed({
      title: '❌ Error',
      description: `**Context:** ${context}\n**Error:** ${error.message}`,
      color: 0xFF0000
    });
  }

  createSuccessEmbed(title, description) {
    return this.createStandardEmbed({
      title: `✅ ${title}`,
      description,
      color: 0x00FF00
    });
  }

  createInfoEmbed(title, description) {
    return this.createStandardEmbed({
      title: `ℹ️ ${title}`,
      description,
      color: 0x0099FF
    });
  }
}

module.exports = RobotEmbedBuilder;
