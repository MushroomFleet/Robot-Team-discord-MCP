# Robot Team Discord Bot System

## Overview

This guide provides step-by-step instructions for creating a Discord bot system that emulates a team of 7 robots (DJZ Clone 1 through DJZ Clone 7) capable of posting scheduled content with rich embeds and individual personas.

## System Architecture

### Core Components
- **Main Bot Application**: Central Discord.js bot managing all operations
- **Webhook System**: Individual webhooks for each robot persona
- **Scheduling Engine**: Cron-based job scheduler for automated posts
- **Database Layer**: SQLite database for storing scheduled posts and robot configurations
- **Command Handler**: Modular system for managing bot commands
- **Rich Embed System**: Consistent formatting for robot posts

### Technology Stack
- **Runtime**: Node.js (v16.7+)
- **Framework**: Discord.js (v14+)
- **Database**: SQLite with Sequelize ORM
- **Scheduling**: node-cron
- **Hosting**: Railway (recommended) or alternatives

## Prerequisites

### Required Software
- Node.js (v16.7 or higher)
- npm (comes with Node.js)
- Text editor (VS Code recommended)
- Git (for version control)

### Discord Requirements
- Discord Developer Account
- Server with Administrator permissions
- Bot application with proper permissions

## Step 1: Project Setup

### 1.1 Initialize Project Structure

```bash
mkdir robot-team-bot
cd robot-team-bot
npm init -y
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install discord.js sequelize sqlite3 node-cron dotenv

# Development dependencies
npm install --save-dev nodemon
```

### 1.3 Create Project Structure

```
robot-team-bot/
├── src/
│   ├── commands/
│   │   ├── schedule/
│   │   ├── robot/
│   │   └── admin/
│   ├── events/
│   ├── models/
│   ├── services/
│   │   ├── scheduler.js
│   │   ├── webhooks.js
│   │   └── database.js
│   ├── utils/
│   └── config/
├── data/
│   └── database.sqlite
├── package.json
├── .env
├── .gitignore
└── index.js
```

## Step 2: Discord Bot Setup

### 2.1 Create Discord Application

1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name your application "Robot Team"
4. Navigate to the "Bot" tab
5. Click "Add Bot"
6. Copy the bot token (keep it secure!)

### 2.2 Configure Bot Permissions

Required permissions:
- Send Messages
- Use Slash Commands
- Embed Links
- Attach Files
- Manage Webhooks
- Read Message History

### 2.3 Environment Configuration

Create `.env` file:

```env
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_server_id_here
DATABASE_URL=./data/database.sqlite
NODE_ENV=development
```

## Step 3: Database Schema Design

### 3.1 Database Models

Create `src/models/index.js`:

```javascript
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../data/database.sqlite'),
  logging: false
});

// Robot configuration model
const Robot = sequelize.define('Robot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    validate: { min: 1, max: 7 }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: function() {
      return `:${this.getDataValue('id')}::robot:`;
    }
  },
  webhookId: DataTypes.STRING,
  webhookToken: DataTypes.STRING,
  avatarUrl: DataTypes.STRING,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  config: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

// Scheduled posts model
const ScheduledPost = sequelize.define('ScheduledPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  robotId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Robot,
      key: 'id'
    }
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: DataTypes.TEXT,
  embedData: DataTypes.JSON,
  scheduledFor: DataTypes.DATE,
  cronExpression: DataTypes.STRING,
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: DataTypes.STRING,
  lastExecuted: DataTypes.DATE
});

// Post history model
const PostHistory = sequelize.define('PostHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  scheduledPostId: {
    type: DataTypes.UUID,
    references: {
      model: ScheduledPost,
      key: 'id'
    }
  },
  robotId: DataTypes.INTEGER,
  channelId: DataTypes.STRING,
  messageId: DataTypes.STRING,
  executedAt: DataTypes.DATE,
  success: DataTypes.BOOLEAN,
  errorMessage: DataTypes.TEXT
});

// Define associations
Robot.hasMany(ScheduledPost, { foreignKey: 'robotId' });
ScheduledPost.belongsTo(Robot, { foreignKey: 'robotId' });
ScheduledPost.hasMany(PostHistory, { foreignKey: 'scheduledPostId' });
PostHistory.belongsTo(ScheduledPost, { foreignKey: 'scheduledPostId' });

module.exports = {
  sequelize,
  Robot,
  ScheduledPost,
  PostHistory
};
```

## Step 4: Webhook Management System

### 4.1 Webhook Service

Create `src/services/webhooks.js`:

```javascript
const { WebhookClient } = require('discord.js');
const { Robot } = require('../models');

class WebhookService {
  constructor() {
    this.webhooks = new Map();
  }

  async initializeWebhooks() {
    const robots = await Robot.findAll();
    
    for (const robot of robots) {
      if (robot.webhookId && robot.webhookToken) {
        this.webhooks.set(robot.id, new WebhookClient({
          id: robot.webhookId,
          token: robot.webhookToken
        }));
      }
    }
  }

  async createWebhookForRobot(client, channelId, robotId) {
    try {
      const channel = await client.channels.fetch(channelId);
      const webhook = await channel.createWebhook({
        name: `:${robotId}::robot:`,
        avatar: `https://cdn.discordapp.com/emojis/robot_${robotId}.png`, // Custom robot avatars
        reason: `Robot ${robotId} webhook creation`
      });

      // Save webhook details to database
      await Robot.upsert({
        id: robotId,
        webhookId: webhook.id,
        webhookToken: webhook.token,
        avatarUrl: webhook.avatarURL(),
        isActive: true
      });

      // Add to memory cache
      this.webhooks.set(robotId, new WebhookClient({
        id: webhook.id,
        token: webhook.token
      }));

      return webhook;
    } catch (error) {
      console.error(`Failed to create webhook for robot ${robotId}:`, error);
      throw error;
    }
  }

  getWebhook(robotId) {
    return this.webhooks.get(robotId);
  }

  async sendMessage(robotId, options) {
    const webhook = this.getWebhook(robotId);
    if (!webhook) {
      throw new Error(`No webhook found for robot ${robotId}`);
    }

    try {
      const message = await webhook.send({
        username: `:${robotId}::robot:`,
        avatarURL: options.avatarURL,
        content: options.content,
        embeds: options.embeds,
        files: options.files
      });

      return message;
    } catch (error) {
      console.error(`Failed to send message via robot ${robotId}:`, error);
      throw error;
    }
  }
}

module.exports = WebhookService;
```

## Step 5: Rich Embed System

### 5.1 Embed Builder Utility

Create `src/utils/embedBuilder.js`:

```javascript
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
          value: `:${this.robotId}::robot:`,
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
}

module.exports = RobotEmbedBuilder;
```

## Step 6: Scheduling System

### 6.1 Scheduler Service

Create `src/services/scheduler.js`:

```javascript
const cron = require('node-cron');
const { ScheduledPost, PostHistory, Robot } = require('../models');
const RobotEmbedBuilder = require('../utils/embedBuilder');

class SchedulerService {
  constructor(webhookService) {
    this.webhookService = webhookService;
    this.jobs = new Map();
  }

  async initializeScheduledJobs() {
    const activePosts = await ScheduledPost.findAll({
      where: { isActive: true },
      include: [Robot]
    });

    for (const post of activePosts) {
      if (post.isRecurring && post.cronExpression) {
        this.scheduleRecurringPost(post);
      } else if (post.scheduledFor && post.scheduledFor > new Date()) {
        this.scheduleOneTimePost(post);
      }
    }

    console.log(`Initialized ${this.jobs.size} scheduled jobs`);
  }

  scheduleRecurringPost(scheduledPost) {
    if (!cron.validate(scheduledPost.cronExpression)) {
      console.error(`Invalid cron expression: ${scheduledPost.cronExpression}`);
      return;
    }

    const job = cron.schedule(
      scheduledPost.cronExpression,
      async () => {
        await this.executePost(scheduledPost);
      },
      {
        scheduled: true,
        timezone: 'UTC'
      }
    );

    this.jobs.set(scheduledPost.id, job);
    console.log(`Scheduled recurring post ${scheduledPost.id} with cron: ${scheduledPost.cronExpression}`);
  }

  scheduleOneTimePost(scheduledPost) {
    const now = new Date();
    const scheduledTime = new Date(scheduledPost.scheduledFor);
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.log(`Post ${scheduledPost.id} is past due, executing immediately`);
      this.executePost(scheduledPost);
      return;
    }

    const timeout = setTimeout(async () => {
      await this.executePost(scheduledPost);
      // Deactivate one-time posts after execution
      await scheduledPost.update({ isActive: false });
    }, delay);

    this.jobs.set(scheduledPost.id, { type: 'timeout', timeout });
    console.log(`Scheduled one-time post ${scheduledPost.id} for ${scheduledTime}`);
  }

  async executePost(scheduledPost) {
    const startTime = new Date();
    let success = false;
    let errorMessage = null;
    let messageId = null;

    try {
      console.log(`Executing post ${scheduledPost.id} for robot ${scheduledPost.robotId}`);

      const embedBuilder = new RobotEmbedBuilder(scheduledPost.robotId);
      let embeds = [];

      if (scheduledPost.embedData) {
        embeds.push(embedBuilder.createStandardEmbed(scheduledPost.embedData));
      }

      const message = await this.webhookService.sendMessage(scheduledPost.robotId, {
        content: scheduledPost.content,
        embeds: embeds.length > 0 ? embeds : undefined
      });

      messageId = message.id;
      success = true;

      // Update last executed time
      await scheduledPost.update({ lastExecuted: startTime });

    } catch (error) {
      console.error(`Failed to execute post ${scheduledPost.id}:`, error);
      errorMessage = error.message;
    }

    // Log execution history
    await PostHistory.create({
      scheduledPostId: scheduledPost.id,
      robotId: scheduledPost.robotId,
      channelId: scheduledPost.channelId,
      messageId,
      executedAt: startTime,
      success,
      errorMessage
    });
  }

  async addScheduledPost(postData) {
    const scheduledPost = await ScheduledPost.create(postData);

    if (postData.isRecurring && postData.cronExpression) {
      this.scheduleRecurringPost(scheduledPost);
    } else if (postData.scheduledFor) {
      this.scheduleOneTimePost(scheduledPost);
    }

    return scheduledPost;
  }

  cancelJob(postId) {
    const job = this.jobs.get(postId);
    if (job) {
      if (job.type === 'timeout') {
        clearTimeout(job.timeout);
      } else {
        job.destroy();
      }
      this.jobs.delete(postId);
      return true;
    }
    return false;
  }

  async reschedulePost(postId, newSchedule) {
    this.cancelJob(postId);
    
    const scheduledPost = await ScheduledPost.findByPk(postId);
    if (!scheduledPost) {
      throw new Error('Scheduled post not found');
    }

    await scheduledPost.update(newSchedule);

    if (newSchedule.isRecurring && newSchedule.cronExpression) {
      this.scheduleRecurringPost(scheduledPost);
    } else if (newSchedule.scheduledFor) {
      this.scheduleOneTimePost(scheduledPost);
    }
  }
}

module.exports = SchedulerService;
```

## Step 7: Command System

### 7.1 Base Command Structure

Create `src/commands/schedule/create.js`:

```javascript
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
        .setDescription('Embed title')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('image')
        .setDescription('Image URL for embed')
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

      let scheduledFor = null;
      let cronExpression = null;

      if (recurring) {
        // Validate cron expression
        const cron = require('node-cron');
        if (!cron.validate(when)) {
          return await interaction.editReply('❌ Invalid cron expression. Use format: `0 15 * * *`');
        }
        cronExpression = when;
      } else {
        // Parse date/time
        scheduledFor = new Date(when);
        if (isNaN(scheduledFor.getTime())) {
          return await interaction.editReply('❌ Invalid date format. Use: `YYYY-MM-DD HH:MM`');
        }
        if (scheduledFor <= new Date()) {
          return await interaction.editReply('❌ Scheduled time must be in the future');
        }
      }

      // Create embed data if title or image provided
      let embedData = null;
      if (title || image) {
        embedData = {
          title,
          image,
          description: title ? undefined : content
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
      const confirmEmbed = embedBuilder.createStandardEmbed({
        title: '✅ Post Scheduled Successfully',
        description: `Robot :${robotId}::robot: will post your message`,
        fields: [
          {
            name: 'Content Preview',
            value: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
            inline: false
          },
          {
            name: 'Schedule',
            value: recurring 
              ? `🔄 Recurring: \`${cronExpression}\``
              : `⏰ One-time: <t:${Math.floor(scheduledFor.getTime() / 1000)}:F>`,
            inline: false
          },
          {
            name: 'Post ID',
            value: scheduledPost.id,
            inline: true
          }
        ]
      });

      await interaction.editReply({ embeds: [confirmEmbed] });

    } catch (error) {
      console.error('Error scheduling post:', error);
      await interaction.editReply('❌ Failed to schedule post. Please try again.');
    }
  }
};
```

### 7.2 Quick Post Command

Create `src/commands/robot/post.js`:

```javascript
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
    )
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Embed title')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const robotId = interaction.options.getInteger('robot');
      const content = interaction.options.getString('content');
      const title = interaction.options.getString('title');

      const embedBuilder = new RobotEmbedBuilder(robotId);
      let embeds = [];

      if (title) {
        embeds.push(embedBuilder.createStandardEmbed({
          title,
          description: content
        }));
      }

      await interaction.client.webhookService.sendMessage(robotId, {
        content: title ? undefined : content,
        embeds: embeds.length > 0 ? embeds : undefined
      });

      await interaction.reply({
        content: `✅ Robot :${robotId}::robot: posted your message!`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error posting message:', error);
      await interaction.reply({
        content: '❌ Failed to post message. Make sure the robot is properly configured.',
        ephemeral: true
      });
    }
  }
};
```

## Step 8: Main Bot Application

### 8.1 Create Main Index File

Create `index.js`:

```javascript
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const { sequelize } = require('./src/models');
const WebhookService = require('./src/services/webhooks');
const SchedulerService = require('./src/services/scheduler');

// Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Initialize services
client.webhookService = new WebhookService();
client.schedulerService = new SchedulerService(client.webhookService);

// Commands collection
client.commands = new Collection();

// Load commands
const foldersPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] Command at ${filePath} is missing required "data" or "execute" property.`);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'src/events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Bot ready! Logged in as ${readyClient.user.tag}`);
  
  try {
    // Initialize database
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    // Initialize webhooks
    await client.webhookService.initializeWebhooks();
    console.log('✅ Webhooks initialized');
    
    // Initialize scheduler
    await client.schedulerService.initializeScheduledJobs();
    console.log('✅ Scheduler initialized');
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
});

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    const errorMessage = { 
      content: 'There was an error while executing this command!', 
      ephemeral: true 
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Login
client.login(process.env.DISCORD_TOKEN);
```

## Step 9: Command Deployment Script

### 9.1 Deploy Commands Script

Create `deploy-commands.js`:

```javascript
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

const commands = [];

// Grab all command files
const foldersPath = path.join(__dirname, 'src/commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] Command at ${filePath} is missing required "data" or "execute" property.`);
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // For guild-based commands (faster for development)
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
```

## Step 10: Additional Commands

### 10.1 List Scheduled Posts Command

Create `src/commands/schedule/list.js`:

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ScheduledPost, Robot } = require('../../models');

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
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const robotFilter = interaction.options.getInteger('robot');
      
      const whereClause = { isActive: true };
      if (robotFilter) whereClause.robotId = robotFilter;

      const scheduledPosts = await ScheduledPost.findAll({
        where: whereClause,
        include: [Robot],
        order: [['scheduledFor', 'ASC'], ['createdAt', 'ASC']],
        limit: 10
      });

      if (scheduledPosts.length === 0) {
        return await interaction.editReply('No scheduled posts found.');
      }

      const embed = new EmbedBuilder()
        .setTitle('📅 Scheduled Posts')
        .setColor(0x0099FF)
        .setTimestamp();

      let description = '';
      for (const post of scheduledPosts) {
        const preview = post.content 
          ? post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')
          : 'Rich embed content';
        
        const schedule = post.isRecurring 
          ? `🔄 ${post.cronExpression}`
          : `⏰ <t:${Math.floor(new Date(post.scheduledFor).getTime() / 1000)}:R>`;

        description += `**Robot :${post.robotId}::robot:** ${preview}\n${schedule}\n*ID: ${post.id}*\n\n`;
      }

      embed.setDescription(description);
      
      if (scheduledPosts.length === 10) {
        embed.setFooter({ text: 'Showing first 10 results. Use robot filter to narrow down.' });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error listing scheduled posts:', error);
      await interaction.editReply('❌ Failed to list scheduled posts.');
    }
  }
};
```

### 10.2 Cancel Scheduled Post Command

Create `src/commands/schedule/cancel.js`:

```javascript
const { SlashCommandBuilder } = require('discord.js');
const { ScheduledPost } = require('../../models');

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
        return await interaction.editReply('❌ Scheduled post not found.');
      }

      if (!scheduledPost.isActive) {
        return await interaction.editReply('❌ This post is already inactive.');
      }

      // Cancel the job in scheduler
      const cancelled = interaction.client.schedulerService.cancelJob(postId);
      
      // Deactivate in database
      await scheduledPost.update({ isActive: false });

      await interaction.editReply(
        `✅ Cancelled scheduled post for Robot :${scheduledPost.robotId}::robot:\n` +
        `*Post ID: ${postId}*`
      );

    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      await interaction.editReply('❌ Failed to cancel scheduled post.');
    }
  }
};
```

## Step 11: Robot Setup Commands

### 11.1 Robot Status Command

Create `src/commands/robot/status.js`:

```javascript
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Robot, ScheduledPost } = require('../../models');

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

        const embed = new EmbedBuilder()
          .setTitle(`🤖 Robot :${robotId}::robot: Status`)
          .setColor(robot?.isActive ? 0x00FF00 : 0xFF0000)
          .addFields(
            { name: 'Status', value: robot?.isActive ? '🟢 Active' : '🔴 Inactive', inline: true },
            { name: 'Webhook', value: robot?.webhookId ? '✅ Configured' : '❌ Not configured', inline: true },
            { name: 'Active Posts', value: activePosts.toString(), inline: true }
          )
          .setTimestamp();

        if (robot?.avatarUrl) {
          embed.setThumbnail(robot.avatarUrl);
        }

        await interaction.editReply({ embeds: [embed] });

      } else {
        // Show all robots status
        const robots = await Robot.findAll({
          order: [['id', 'ASC']]
        });

        const embed = new EmbedBuilder()
          .setTitle('🤖 Robot Team Status')
          .setColor(0x0099FF)
          .setTimestamp();

        let description = '';
        for (let i = 1; i <= 7; i++) {
          const robot = robots.find(r => r.id === i);
          const activePosts = await ScheduledPost.count({
            where: { robotId: i, isActive: true }
          });

          const status = robot?.isActive ? '🟢' : '🔴';
          const webhook = robot?.webhookId ? '✅' : '❌';
          
          description += `:${i}::robot: ${status} Webhook: ${webhook} Posts: ${activePosts}\n`;
        }

        embed.setDescription(description);
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error checking robot status:', error);
      await interaction.editReply('❌ Failed to check robot status.');
    }
  }
};
```

### 11.2 Initialize Robot Command

Create `src/commands/admin/init-robot.js`:

```javascript
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

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
        return await interaction.editReply(
          `❌ Robot :${robotId}::robot: already has a webhook configured.`
        );
      }

      // Create webhook
      const webhook = await interaction.client.webhookService.createWebhookForRobot(
        interaction.client,
        channel.id,
        robotId
      );

      await interaction.editReply(
        `✅ Successfully initialized Robot :${robotId}::robot:!\n` +
        `📍 Webhook created in ${channel}\n` +
        `🆔 Webhook ID: ${webhook.id}`
      );

    } catch (error) {
      console.error('Error initializing robot:', error);
      await interaction.editReply('❌ Failed to initialize robot. Make sure I have Manage Webhooks permission.');
    }
  }
};
```

## Step 12: Deployment and Hosting

### 12.1 Package.json Scripts

Update your `package.json`:

```json
{
  "name": "robot-team-bot",
  "version": "1.0.0",
  "description": "Discord bot system with 7 robot personas",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "deploy": "node deploy-commands.js",
    "db:reset": "rm -f data/database.sqlite && node -e \"require('./src/models').sequelize.sync({ force: true }).then(() => process.exit())\""
  },
  "dependencies": {
    "discord.js": "^14.14.1",
    "sequelize": "^6.35.2",
    "sqlite3": "^5.1.6",
    "node-cron": "^3.0.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

### 12.2 Railway Deployment

1. **Create Railway Account**: Visit [railway.app](https://railway.app)

2. **Create New Project**: Connect your GitHub repository

3. **Environment Variables**:
   ```
   DISCORD_TOKEN=your_bot_token
   CLIENT_ID=your_bot_client_id
   GUILD_ID=your_server_id
   NODE_ENV=production
   ```

4. **Deploy**: Railway will automatically build and deploy

### 12.3 Alternative Hosting Options

**Render.com:**
- Free tier with 750 hours/month
- Easy GitHub integration
- Auto-sleep after 15 minutes inactivity

**Fly.io:**
- 3 VMs free with 256MB RAM each
- Global deployment
- Docker-based deployment

## Step 13: Advanced Features

### 13.1 Webhook Health Monitoring

Create `src/services/monitoring.js`:

```javascript
const { PostHistory, Robot } = require('../models');

class MonitoringService {
  constructor(client) {
    this.client = client;
    this.healthCheckInterval = 5 * 60 * 1000; // 5 minutes
  }

  startHealthChecks() {
    setInterval(async () => {
      await this.checkWebhookHealth();
    }, this.healthCheckInterval);
  }

  async checkWebhookHealth() {
    try {
      const robots = await Robot.findAll({ where: { isActive: true } });
      
      for (const robot of robots) {
        const recentFailures = await PostHistory.count({
          where: {
            robotId: robot.id,
            success: false,
            executedAt: {
              [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        });

        if (recentFailures > 5) {
          console.warn(`Robot ${robot.id} has ${recentFailures} failures in the last 24 hours`);
          // Could send admin notification here
        }
      }
    } catch (error) {
      console.error('Health check error:', error);
    }
  }
}

module.exports = MonitoringService;
```

### 13.2 Bulk Operations

Create `src/commands/admin/bulk-schedule.js`:

```javascript
const { SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs/promises');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bulk-schedule')
    .setDescription('Schedule multiple posts from CSV file (Admin only)')
    .addAttachmentOption(option =>
      option.setName('csv-file')
        .setDescription('CSV file with columns: robot_id, content, scheduled_for, is_recurring, cron_expression')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const attachment = interaction.options.getAttachment('csv-file');
      
      if (!attachment.name.endsWith('.csv')) {
        return await interaction.editReply('❌ Please upload a CSV file.');
      }

      // Download and parse CSV
      const response = await fetch(attachment.url);
      const csvData = await response.text();
      
      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      const posts = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const post = {};
        
        headers.forEach((header, index) => {
          post[header.trim()] = values[index]?.trim();
        });

        if (post.robot_id && post.content) {
          posts.push({
            robotId: parseInt(post.robot_id),
            content: post.content,
            channelId: interaction.channel.id,
            scheduledFor: post.scheduled_for ? new Date(post.scheduled_for) : null,
            isRecurring: post.is_recurring === 'true',
            cronExpression: post.cron_expression || null,
            createdBy: interaction.user.id
          });
        }
      }

      let successful = 0;
      let failed = 0;

      for (const postData of posts) {
        try {
          await interaction.client.schedulerService.addScheduledPost(postData);
          successful++;
        } catch (error) {
          console.error('Failed to schedule post:', error);
          failed++;
        }
      }

      await interaction.editReply(
        `✅ Bulk scheduling complete!\n` +
        `📊 **Results:**\n` +
        `• Successfully scheduled: ${successful}\n` +
        `• Failed: ${failed}`
      );

    } catch (error) {
      console.error('Error processing bulk schedule:', error);
      await interaction.editReply('❌ Failed to process CSV file.');
    }
  }
};
```

## Step 14: Testing and Validation

### 14.1 Test Script

Create `test-bot.js`:

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function testBot() {
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log('✅ Bot login successful');
    
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    console.log(`✅ Guild found: ${guild.name}`);
    
    const channels = await guild.channels.fetch();
    const textChannels = channels.filter(c => c.type === 0);
    console.log(`✅ Found ${textChannels.size} text channels`);
    
    client.destroy();
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testBot();
```

### 14.2 Setup Checklist

- [ ] Discord bot created and token obtained
- [ ] Bot invited to server with proper permissions
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database initialized
- [ ] Commands deployed
- [ ] Webhooks created for each robot
- [ ] Test scheduled post created
- [ ] Bot successfully running

## Step 15: Usage Examples

### 15.1 Quick Setup Commands

```bash
# 1. Initialize all robots
/init-robot robot:1
/init-robot robot:2
/init-robot robot:3
/init-robot robot:4
/init-robot robot:5
/init-robot robot:6
/init-robot robot:7

# 2. Check status
/robot-status

# 3. Schedule a daily announcement
/schedule robot:1 content:"Good morning everyone!" when:"0 9 * * *" recurring:true

# 4. Send immediate post
/robot-post robot:2 content:"This is an immediate post!" title:"Breaking News"

# 5. List scheduled posts
/schedule-list robot:1
```

### 15.2 Cron Expression Examples

```
0 9 * * *        # Daily at 9:00 AM
0 */6 * * *      # Every 6 hours
0 0 * * MON      # Every Monday at midnight
0 12 * * 1-5     # Weekdays at noon
0 0 1 * *        # First day of every month
```

## Troubleshooting

### Common Issues

1. **Bot not responding**: Check token and intents
2. **Webhooks failing**: Verify "Manage Webhooks" permission
3. **Database errors**: Ensure SQLite file permissions
4. **Scheduling not working**: Check cron expressions and timezone
5. **Memory issues**: Monitor process and optimize queries

### Logs and Monitoring

- Enable detailed logging in production
- Monitor webhook health regularly
- Track failed post executions
- Set up alerts for critical failures

## Conclusion

This system provides a robust foundation for managing a team of 7 robot personas in Discord. The architecture supports:

- ✅ Individual robot personalities via webhooks
- ✅ Rich embed support for professional-looking posts
- ✅ Flexible scheduling system (one-time and recurring)
- ✅ Database persistence and history tracking
- ✅ Modular command system for easy expansion
- ✅ Production-ready deployment options

The system can be extended with additional features like:
- Custom robot avatars and personalities
- Advanced scheduling rules
- Integration with external APIs
- Analytics and reporting
- Web dashboard for management

Start with the basic setup and gradually add features as needed for your specific use case.
