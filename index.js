const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const { sequelize } = require('./src/models');
const WebhookService = require('./src/services/webhooks');
const SchedulerService = require('./src/services/scheduler');
const ApiServer = require('./src/api/server');

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is required in .env file');
  process.exit(1);
}

if (!process.env.GUILD_ID) {
  console.error('❌ GUILD_ID is required in .env file');
  process.exit(1);
}

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
client.apiServer = new ApiServer(client.webhookService, client.schedulerService);

// Commands collection
client.commands = new Collection();

// Load commands
const foldersPath = path.join(__dirname, 'src/commands');
try {
  const commandFolders = fs.readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    if (!fs.statSync(commandsPath).isDirectory()) continue;
    
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`📝 Loaded command: ${command.data.name}`);
      } else {
        console.log(`⚠️  Command at ${filePath} is missing required "data" or "execute" property.`);
      }
    }
  }
} catch (error) {
  console.error('❌ Error loading commands:', error);
}

// Load events
const eventsPath = path.join(__dirname, 'src/events');
if (fs.existsSync(eventsPath)) {
  try {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
      const filePath = path.join(eventsPath, file);
      const event = require(filePath);
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      console.log(`📅 Loaded event: ${event.name}`);
    }
  } catch (error) {
    console.error('❌ Error loading events:', error);
  }
}

// Ready event
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🤖 Robot Team Bot ready! Logged in as ${readyClient.user.tag}`);
  
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
    
    // Start API server
    const apiPort = process.env.API_PORT || 9000;
    await client.apiServer.start(apiPort);
    console.log('✅ API Server initialized');
    
    // Set bot status
    readyClient.user.setActivity('🤖 Managing Robot Team', { type: 'WATCHING' });
    
    console.log('\n🚀 Robot Team System Online!');
    console.log(`📊 Commands loaded: ${client.commands.size}`);
    console.log(`📡 Webhooks active: ${client.webhookService.getWebhookCount()}`);
    console.log(`⏰ Scheduled jobs: ${client.schedulerService.getJobCount()}`);
    console.log(`🌐 Connected to guild: ${process.env.GUILD_ID}`);
    console.log(`🔌 API Server: http://localhost:${apiPort}`);
    
  } catch (error) {
    console.error('❌ Initialization error:', error);
    process.exit(1);
  }
});

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`❌ No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    console.log(`🔧 Executing command: ${interaction.commandName} by ${interaction.user.tag}`);
    await command.execute(interaction);
    console.log(`✅ Command executed successfully: ${interaction.commandName}`);
  } catch (error) {
    console.error(`❌ Error executing ${interaction.commandName}:`, error);
    
    const errorMessage = { 
      content: '❌ There was an error while executing this command! Please try again or contact an administrator.', 
      ephemeral: true 
    };
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    } catch (followUpError) {
      console.error('❌ Failed to send error message:', followUpError);
    }
  }
});

// Error handling
client.on(Events.Error, error => {
  console.error('❌ Discord client error:', error);
});

client.on(Events.Warn, warning => {
  console.warn('⚠️  Discord client warning:', warning);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  
  try {
    // Cancel all scheduled jobs
    if (client.schedulerService) {
      console.log('⏰ Cancelling scheduled jobs...');
      // The scheduler service should handle cleanup
    }
    
    // Close database connection
    if (sequelize) {
      console.log('🗄️  Closing database connection...');
      await sequelize.close();
    }
    
    // Destroy Discord client
    if (client) {
      console.log('🤖 Destroying Discord client...');
      client.destroy();
    }
    
    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Login
console.log('🚀 Starting Robot Team Bot...');
client.login(process.env.DISCORD_TOKEN)
  .catch(error => {
    console.error('❌ Failed to login:', error);
    process.exit(1);
  });
