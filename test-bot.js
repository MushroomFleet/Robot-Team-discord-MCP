require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Test script to validate bot setup
async function testBot() {
  console.log('🧪 Testing Robot Team Bot Configuration...\n');
  
  // Check environment variables
  console.log('📋 Checking environment variables:');
  const requiredVars = ['DISCORD_TOKEN', 'CLIENT_ID', 'GUILD_ID'];
  let missingVars = [];
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`);
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.log(`\n❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.log('💡 Create a .env file based on .env.example');
    process.exit(1);
  }
  
  // Test Discord connection
  console.log('\n🤖 Testing Discord connection...');
  
  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });
  
  try {
    await client.login(process.env.DISCORD_TOKEN);
    console.log(`   ✅ Bot login successful: ${client.user.tag}`);
    
    // Test guild access
    console.log('\n🏠 Testing guild access...');
    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    console.log(`   ✅ Guild found: ${guild.name} (${guild.memberCount} members)`);
    
    // Test permissions
    console.log('\n🔐 Testing bot permissions...');
    const botMember = await guild.members.fetch(client.user.id);
    const permissions = botMember.permissions;
    
    const requiredPermissions = [
      { name: 'Send Messages', check: permissions.has('SendMessages') },
      { name: 'Use Slash Commands', check: permissions.has('UseApplicationCommands') },
      { name: 'Embed Links', check: permissions.has('EmbedLinks') },
      { name: 'Manage Webhooks', check: permissions.has('ManageWebhooks') }
    ];
    
    let missingPermissions = [];
    for (const perm of requiredPermissions) {
      if (perm.check) {
        console.log(`   ✅ ${perm.name}`);
      } else {
        console.log(`   ❌ ${perm.name}`);
        missingPermissions.push(perm.name);
      }
    }
    
    // Test channels
    console.log('\n📺 Testing channel access...');
    const channels = await guild.channels.fetch();
    const textChannels = channels.filter(c => c.type === 0);
    console.log(`   ✅ Found ${textChannels.size} text channels`);
    
    if (textChannels.size === 0) {
      console.log('   ⚠️  No text channels found. Bot needs access to at least one text channel.');
    }
    
    // Test database
    console.log('\n🗄️  Testing database connection...');
    try {
      const { sequelize } = require('./src/models');
      await sequelize.authenticate();
      console.log('   ✅ Database connection successful');
      await sequelize.close();
    } catch (dbError) {
      console.log('   ❌ Database connection failed:', dbError.message);
    }
    
    client.destroy();
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   🤖 Bot Status: Online`);
    console.log(`   🏠 Guild Access: ✅`);
    console.log(`   🔐 Permissions: ${missingPermissions.length === 0 ? '✅' : '⚠️ ' + missingPermissions.length + ' missing'}`);
    console.log(`   📺 Channels: ${textChannels.size} accessible`);
    
    if (missingPermissions.length > 0) {
      console.log('\n⚠️  Warning: Missing permissions detected:');
      missingPermissions.forEach(perm => console.log(`   • ${perm}`));
      console.log('\n💡 To fix permissions:');
      console.log('   1. Go to your Discord server settings');
      console.log('   2. Navigate to Roles');
      console.log('   3. Find the Robot-Team bot role');
      console.log('   4. Enable the missing permissions');
    }
    
    console.log('\n🎉 Bot test completed!');
    console.log('💡 If all tests passed, you can now run: npm run deploy');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.code === 'TOKEN_INVALID') {
      console.error('💡 Invalid bot token. Check your DISCORD_TOKEN in .env file.');
    } else if (error.code === 50001) {
      console.error('💡 Bot missing access to guild. Make sure bot is invited to server.');
    } else if (error.code === 10004) {
      console.error('💡 Invalid guild ID. Check your GUILD_ID in .env file.');
    }
    
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
  process.exit(1);
});

// Run test
testBot();
