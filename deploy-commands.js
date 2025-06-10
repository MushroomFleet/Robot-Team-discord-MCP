const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Validate required environment variables
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ DISCORD_TOKEN is required in .env file');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('❌ CLIENT_ID is required in .env file');
  console.error('💡 Get your CLIENT_ID from the Discord Developer Portal > Your Application > General Information');
  process.exit(1);
}

if (!process.env.GUILD_ID) {
  console.error('❌ GUILD_ID is required in .env file');
  process.exit(1);
}

const commands = [];

// Grab all command files
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
        commands.push(command.data.toJSON());
        console.log(`📝 Loaded command: ${command.data.name}`);
      } else {
        console.log(`⚠️  Command at ${filePath} is missing required "data" or "execute" property.`);
      }
    }
  }
} catch (error) {
  console.error('❌ Error loading commands:', error);
  process.exit(1);
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

    let data;
    
    if (process.env.NODE_ENV === 'production') {
      // Global commands for production (slower to update, but available everywhere)
      console.log('🌐 Deploying commands globally...');
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands },
      );
    } else {
      // Guild-based commands for development (faster updates)
      console.log(`🏠 Deploying commands to guild: ${process.env.GUILD_ID}`);
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands },
      );
    }

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
    
    // List deployed commands
    console.log('\n📋 Deployed commands:');
    data.forEach(cmd => {
      console.log(`   • /${cmd.name} - ${cmd.description}`);
    });
    
    console.log('\n🎉 Command deployment complete!');
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('💡 Commands are deployed to your guild and should be available immediately.');
    } else {
      console.log('💡 Global commands may take up to 1 hour to propagate across all Discord servers.');
    }

  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    
    if (error.code === 50001) {
      console.error('💡 This error usually means the bot is missing access to the guild.');
      console.error('   Make sure the bot is invited to your server with the "applications.commands" scope.');
    } else if (error.code === 10002) {
      console.error('💡 Unknown application - check your CLIENT_ID in the .env file.');
    } else if (error.status === 401) {
      console.error('💡 Invalid bot token - check your DISCORD_TOKEN in the .env file.');
    }
    
    process.exit(1);
  }
})();
