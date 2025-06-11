# 🤖 Robot Team MCP Client Handbook

## Welcome AI Assistant Users!

This handbook will guide you through using Robot Team's Discord bots directly from your AI assistant through the Model Context Protocol (MCP). No more switching between applications - control Discord bots with natural language commands!

## 🌟 What You Get

Transform your AI assistant into a Discord bot controller with these powerful capabilities:

✅ **Send Discord Messages** - Post through any of 7 unique robot personas  
✅ **Schedule Messages** - Set up one-time or recurring posts with cron expressions  
✅ **Monitor Robot Health** - Check status and availability of all bots  
✅ **Manage Schedules** - View, update, and cancel scheduled posts  
✅ **Natural Language Control** - Use plain English commands with your AI  
✅ **Rich Message Support** - Embeds, titles, images, and color-coded robots

## 🎯 Perfect For

- **Discord Community Managers** - Automate announcements and reminders
- **Developer Teams** - Schedule standup reminders and status updates  
- **Content Creators** - Plan and automate social media posts
- **Event Organizers** - Send timely notifications and updates
- **Anyone** - Who wants to control Discord bots with AI assistance

## 🚀 Quick Start Guide

### Step 1: Check Prerequisites

**You Need:**
- ✅ An AI assistant that supports MCP (like Cline)
- ✅ Access to a Robot Team server (or admin to set one up)
- ✅ An API key from the Robot Team system

**Supported AI Assistants:**
- **Cline** ✅ (Full support with setup guide below)
- **Claude Desktop** ✅ (MCP compatible)
- **Other MCP Clients** ✅ (Use server configuration)

### Step 2: Get Your API Key

**Option A: Ask Your Admin**
If someone else manages the Robot Team server, request an API key with a message like:
> "Hi! Could I get an API key for the Robot Team MCP integration? I'd like to control the Discord bots from my AI assistant."

**Option B: Self-Service (If Available)**
Some Robot Team servers have web interfaces for API key generation. Check with your server administrator.

**Option C: Generate via AI (After Setup)**
Once configured, you can ask your AI assistant:
> "Generate a new Robot Team API key for me"

### Step 3: Configure Your AI Assistant

#### For Cline Users (Most Common)

1. **Open MCP Settings:**
   - In VS Code: `Ctrl+Shift+P` → "Cline: Open MCP Settings"
   - Or use the Command Palette to find MCP settings

2. **Add Robot Team Configuration:**
   
   If this is your **first MCP server**, copy this entire configuration:
   ```json
   {
     "mcpServers": {
       "robot-team": {
         "command": "node",
         "args": ["path/to/robot-team/MCP/robot-team-server/robot-team-server/build/index.js"],
         "env": {
           "ROBOT_TEAM_API_KEY": "your-api-key-here",
           "ROBOT_TEAM_API_URL": "http://localhost:9000"
         }
       }
     }
   }
   ```

   If you **already have other MCP servers**, add this to your existing configuration:
   ```json
   ,
   "robot-team": {
     "command": "node",
     "args": ["path/to/robot-team/MCP/robot-team-server/robot-team-server/build/index.js"],
     "env": {
       "ROBOT_TEAM_API_KEY": "your-api-key-here",
       "ROBOT_TEAM_API_URL": "http://localhost:9000"
     }
   }
   ```

3. **Update the Configuration:**
   - Replace `path/to/robot-team` with the actual path to your Robot Team installation
   - Replace `your-api-key-here` with your actual API key
   - Update the URL if your Robot Team server runs on a different address

4. **Save and Restart:**
   - Save the MCP settings file
   - Restart VS Code or reload the Cline extension

#### For Other MCP Clients

Use these settings in your MCP client configuration:

- **Server Command**: `node`
- **Arguments**: `["path/to/robot-team-server/build/index.js"]`
- **Environment Variables**:
  - `ROBOT_TEAM_API_KEY`: Your API key
  - `ROBOT_TEAM_API_URL`: Server URL (usually `http://localhost:9000`)

### Step 4: Test Your Setup

Once configured, test with these commands:

1. **"What's the status of all the robots?"**
2. **"Send a message through Robot 1 saying 'Hello from my AI assistant!'"**
3. **"List all scheduled messages"**

If these work, you're all set! 🎉

## 🛠️ Available Tools

Your AI assistant now has 6 powerful Robot Team tools:

### 1. 📤 Send Robot Message
**What it does**: Send immediate messages through any robot  
**Example commands**:
- *"Send a message through Robot 2 saying 'Server maintenance complete'"*
- *"Post an announcement via Robot 1 with the title 'Important Update' and content 'New features available!'"*
- *"Have Robot 3 share this image with a caption"*

### 2. 📅 Schedule Robot Message  
**What it does**: Schedule one-time or recurring messages  
**Example commands**:
- *"Schedule Robot 4 to remind about the meeting tomorrow at 2 PM"*
- *"Set up Robot 5 to post daily standup reminders at 9 AM on weekdays"*
- *"Have Robot 6 send weekly status updates every Friday at 5 PM"*

### 3. 📊 Get Robot Status
**What it does**: Check health and availability of robots  
**Example commands**:
- *"What's the status of all the robots?"*
- *"Is Robot 7 online and working?"*
- *"Show me which robots are active"*

### 4. 📋 List Scheduled Messages
**What it does**: View upcoming and recurring scheduled posts  
**Example commands**:
- *"Show me all scheduled messages"*
- *"What messages are scheduled for Robot 2?"*
- *"List the next 10 upcoming posts"*

### 5. ❌ Cancel Scheduled Message
**What it does**: Remove scheduled posts that are no longer needed  
**Example commands**:
- *"Cancel the scheduled message with ID abc-123"*
- *"Remove that weekly reminder I set up yesterday"*

### 6. 🔑 Generate API Key
**What it does**: Create new API keys (if you have admin access)  
**Example commands**:
- *"Generate a new API key for our team"*
- *"Create an API key that expires in 30 days"*

## 🎨 Robot Personalities

Each robot has a unique color and personality - choose the right one for your message:

| Robot | Color | Best For | Example Use |
|-------|-------|----------|-------------|
| 🤖 Robot 1 | ❤️ Red | Alerts & Urgent Messages | "System down", "Emergency meeting" |
| 🤖 Robot 2 | 💚 Green | Success & Positive Updates | "Deploy successful", "Goals achieved" |
| 🤖 Robot 3 | 💙 Blue | Information & Announcements | "New features", "General updates" |
| 🤖 Robot 4 | 💛 Yellow | Warnings & Cautions | "Maintenance window", "Be careful" |
| 🤖 Robot 5 | 💜 Magenta | Special Events | "Birthday wishes", "Celebrations" |
| 🤖 Robot 6 | 💗 Cyan | Tech & Development | "Code reviews", "Dev discussions" |
| 🤖 Robot 7 | 🧡 Orange | Social & Community | "Team building", "Casual chats" |

## 💬 Natural Language Examples

### Basic Messaging
- *"Send 'Good morning team!' through Robot 2"*
- *"Post a welcome message for new members via Robot 6"*
- *"Have Robot 1 announce that the server is back online"*

### Rich Messages with Embeds
- *"Send an announcement through Robot 3 with the title 'Weekly Update' and content 'All systems operational this week'"*
- *"Post a celebration message via Robot 5 with the title '🎉 Milestone Reached' and include a party image"*

### Scheduling Messages
- *"Schedule Robot 4 to remind everyone about the meeting tomorrow at 2 PM"*
- *"Set up a daily standup reminder through Robot 2 every weekday at 9 AM"*
- *"Have Robot 7 post a weekly social hour announcement every Friday at 4 PM"*

### Advanced Scheduling with Cron
- *"Schedule Robot 1 to send a monthly backup reminder on the first day of each month at 8 AM"*
- *"Set up Robot 3 to post deployment status every 6 hours"*

### Management Commands
- *"Show me the status of all robots"*
- *"List all messages scheduled for Robot 2"*
- *"Cancel the reminder I scheduled for tomorrow"*
- *"What's the health status of Robot 5?"*

## ⏰ Scheduling Guide

### Common Scheduling Patterns

**Daily Reminders**:
- *"Every day at 9 AM"* → `0 9 * * *`
- *"Daily at noon"* → `0 12 * * *`

**Weekly Patterns**:
- *"Every Monday at 10 AM"* → `0 10 * * MON`
- *"Fridays at 5 PM"* → `0 17 * * FRI`
- *"Weekdays at 9 AM"* → `0 9 * * 1-5`

**Monthly Patterns**:
- *"First day of every month"* → `0 0 1 * *`
- *"Last Friday of each month"* → Ask your AI to calculate

**Custom Intervals**:
- *"Every 6 hours"* → `0 */6 * * *`
- *"Every 15 minutes"* → `*/15 * * * *`

### Scheduling Best Practices

1. **Use specific times** - "9 AM" is clearer than "morning"
2. **Consider timezones** - Server uses UTC, so adjust accordingly  
3. **Test with one-time first** - Try a one-time message before setting up recurring
4. **Choose the right robot** - Match robot color/personality to message type
5. **Keep content concise** - Discord has message length limits

## 🔧 Troubleshooting

### Common Issues and Solutions

#### "No Robot Team tools available"
**Cause**: MCP server not properly configured  
**Solutions**:
- ✅ Check file path in MCP configuration is correct
- ✅ Restart your AI assistant completely  
- ✅ Verify the Robot Team server is running
- ✅ Check MCP settings file syntax is valid JSON

#### "Authentication failed" or "API key invalid"
**Cause**: API key issues  
**Solutions**:
- ✅ Verify API key is correctly copied (no extra spaces)
- ✅ Check if API key has expired
- ✅ Ensure Robot Team server URL is correct
- ✅ Ask admin to generate a new API key

#### "Robot not found" or "Robot offline"
**Cause**: Robot configuration issues  
**Solutions**:
- ✅ Check robot status: *"What's the status of Robot 1?"*
- ✅ Ask admin to initialize robots if needed
- ✅ Try a different robot (1-7)
- ✅ Verify Discord bot permissions

#### "Schedule failed" or "Invalid time"
**Cause**: Scheduling problems  
**Solutions**:
- ✅ Use clear time formats: "2024-12-25 15:30" or "tomorrow at 2 PM"
- ✅ Check timezone differences (server uses UTC)
- ✅ Test with a one-time message first
- ✅ Verify cron expression syntax if using advanced patterns

#### "Permission denied"
**Cause**: API key lacks necessary permissions  
**Solutions**:
- ✅ Ask admin for API key with proper permissions
- ✅ Check if you're trying to access restricted robots
- ✅ Verify admin functions require admin API key

### Getting Help

If you're still having issues:

1. **Check with your admin** - They can verify server status and API keys
2. **Try basic commands first** - Start with "What's the status of all robots?"
3. **Check the server logs** - Ask admin to check for error messages
4. **Restart everything** - Sometimes a fresh start fixes connection issues

## 🔐 Security Best Practices

### API Key Management
- 🔒 **Never share your API key** in chat logs or screenshots
- 🔒 **Store keys securely** - Use your AI assistant's secure storage
- 🔒 **Rotate keys regularly** - Generate new keys every 90 days
- 🔒 **Use limited permissions** - Only request access to robots you need
- 🔒 **Monitor usage** - Check for unexpected activity

### Safe Usage
- ✅ **Test in private channels first** before using in public
- ✅ **Be mindful of message content** - Remember it's posted to Discord
- ✅ **Respect rate limits** - Don't spam messages
- ✅ **Use appropriate robots** - Match message type to robot personality
- ✅ **Schedule responsibly** - Don't over-schedule recurring messages

## 🎯 Advanced Tips

### Power User Techniques

**Batch Operations**:
- *"Send the same reminder through all 7 robots"*
- *"Schedule weekly updates for Robots 1, 3, and 5"*

**Conditional Logic**:
- *"If Robot 2 is offline, send the message through Robot 3 instead"*
- *"Check which robots are available and use the first active one"*

**Dynamic Content**:
- *"Send a message with today's date in the title"*
- *"Include the current time in the announcement"*

**Template Messages**:
- *"Create a weekly status template and schedule it for Robot 3"*
- *"Set up a deployment notification template for Robot 1"*

### Integration Ideas

**Development Teams**:
- Daily standup reminders through Robot 2
- Deployment notifications via Robot 1  
- Weekly retrospective prompts from Robot 7

**Community Management**:
- Welcome messages for new members (Robot 6)
- Event announcements through Robot 5
- Moderation alerts via Robot 4

**Content Teams**:
- Publishing schedules through Robot 3
- Content review reminders via Robot 4
- Celebration posts through Robot 5

## 📈 Usage Analytics

Track your Robot Team usage by asking:
- *"Show me API usage statistics"*  
- *"How many messages have I sent this week?"*
- *"Which robots do I use most often?"*

## 🚀 What's Next?

Now that you're set up with Robot Team MCP integration:

1. **Start Simple** - Try basic messaging first
2. **Experiment with Scheduling** - Set up a few recurring reminders  
3. **Explore Robot Personalities** - Find your favorites for different message types
4. **Share with Your Team** - Help others get set up too
5. **Provide Feedback** - Let the admins know how it's working for you

## 📚 Additional Resources

- **Robot Team Server Handbook** - For administrators and developers
- **API Documentation** - Complete technical reference  
- **Discord Setup Guide** - How to configure the Discord side
- **Troubleshooting Guide** - Detailed problem-solving steps

---

**🤖 Happy Botting!** You now have the power to control Discord robots with natural language through your AI assistant. Enjoy the seamless integration and automated messaging capabilities!

*Need help? Ask your Robot Team administrator or check the troubleshooting section above.*
