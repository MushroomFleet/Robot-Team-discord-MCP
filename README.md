# Robot Team Discord Bot

A sophisticated Discord bot system that manages 7 unique robot personas (:one::robot: through :seven::robot:) for automated scheduling and posting with rich embeds.

## Features

🤖 **7 Individual Robot Personas** - Each robot has unique colors and personalities  
📅 **Advanced Scheduling** - One-time and recurring posts with cron expressions  
🎨 **Rich Embeds** - Beautiful, color-coded messages with images and formatting  
📡 **Webhook System** - Individual webhooks for authentic robot posting  
🗄️ **SQLite Database** - Persistent storage for schedules and configurations  
⚡ **Slash Commands** - Modern Discord command interface  
🔧 **Admin Controls** - Full management and monitoring capabilities  

## Quick Start

### Prerequisites
- Node.js v16.7 or higher
- Discord Developer Account
- Discord server with admin permissions

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository>
cd robot-team-bot
npm install
```

2. **Environment setup:**
```bash
cp .env.example .env
# Edit .env with your Discord credentials
```

3. **Discord setup (see Discord-Handoff.md for details):**
   - Create Discord application and bot
   - Get bot token and client ID
   - Invite bot to server with proper permissions

4. **Test configuration:**
```bash
npm test
```

5. **Deploy commands:**
```bash
npm run deploy
```

6. **Start the bot:**
```bash
npm start
# or for development:
npm run dev
```

## Commands

### Setup Commands
- `/init-robot robot:1` - Initialize a robot with webhook
- `/robot-status` - Check all robots or specific robot status

### Posting Commands
- `/robot-post robot:1 content:"Hello!"` - Send immediate post
- `/schedule robot:1 content:"Daily update" when:"0 9 * * *" recurring:true` - Schedule recurring post
- `/schedule robot:2 content:"Meeting reminder" when:"2024-12-25 15:30"` - Schedule one-time post

### Management Commands
- `/schedule-list` - View all scheduled posts
- `/schedule-cancel post-id:abc123` - Cancel a scheduled post

## Robot Colors

Each robot has a unique color scheme:
- 🤖 Robot 1: Red (#FF0000)
- 🤖 Robot 2: Green (#00FF00)  
- 🤖 Robot 3: Blue (#0099FF)
- 🤖 Robot 4: Yellow (#FFFF00)
- 🤖 Robot 5: Magenta (#FF00FF)
- 🤖 Robot 6: Cyan (#00FFFF)
- 🤖 Robot 7: Orange (#FFA500)

## Scheduling Examples

### Cron Expressions
```bash
# Daily at 9 AM
/schedule robot:1 content:"Good morning!" when:"0 9 * * *" recurring:true

# Every 6 hours
/schedule robot:2 content:"Periodic update" when:"0 */6 * * *" recurring:true

# Weekdays at noon
/schedule robot:3 content:"Lunch time!" when:"0 12 * * 1-5" recurring:true

# First day of every month
/schedule robot:4 content:"Monthly report" when:"0 0 1 * *" recurring:true
```

### One-time Posts
```bash
# Specific date and time
/schedule robot:5 content:"Event starts now!" when:"2024-12-25 15:30"

# With rich embed
/schedule robot:6 content:"Check this out!" when:"2024-12-25 20:00" title:"Important Announcement" image:"https://example.com/image.png"
```

## Development

### Project Structure
```
robot-team-bot/
├── src/
│   ├── commands/          # Slash commands
│   │   ├── admin/         # Admin-only commands
│   │   ├── robot/         # Robot management commands
│   │   └── schedule/      # Scheduling commands
│   ├── models/            # Database models
│   ├── services/          # Core services
│   │   ├── webhooks.js    # Webhook management
│   │   └── scheduler.js   # Cron scheduling
│   └── utils/             # Utilities
│       └── embedBuilder.js # Rich embed creation
├── data/                  # SQLite database
├── index.js              # Main bot application
├── deploy-commands.js    # Command deployment
└── test-bot.js          # Configuration testing
```

### Adding Commands

1. Create command file in appropriate folder:
```javascript
// src/commands/example/test.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test command'),
  
  async execute(interaction) {
    await interaction.reply('Test successful!');
  }
};
```

2. Redeploy commands:
```bash
npm run deploy
```

### Database Operations

The bot automatically handles database migrations. To reset:
```bash
npm run db:reset
```

## Monitoring

### Health Checks
The scheduler service includes built-in health monitoring:
- Tracks failed post executions
- Monitors webhook status
- Logs system statistics

### Logs
All operations are logged with appropriate emojis for easy identification:
- 🤖 Bot operations
- 📡 Webhook activities
- ⏰ Scheduler events
- ❌ Errors and warnings

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
NODE_ENV=production npm start
```

### Railway Deployment
1. Connect GitHub repository to Railway
2. Set environment variables
3. Deploy automatically

## Troubleshooting

### Common Issues

**Bot not responding:**
- Check `DISCORD_TOKEN` in .env
- Verify bot is online in Developer Portal
- Ensure bot has proper server permissions

**Commands not appearing:**
- Run `npm run deploy`
- Check `CLIENT_ID` and `GUILD_ID` in .env
- Verify bot has "Use Slash Commands" permission

**Webhooks failing:**
- Ensure bot has "Manage Webhooks" permission
- Check if webhooks were created properly with `/robot-status`
- Re-initialize robots with `/init-robot`

**Scheduling not working:**
- Validate cron expressions at [crontab.guru](https://crontab.guru)
- Check if robot is active with `/robot-status`
- Review logs for error messages

### Getting Help

1. Check the logs for specific error messages
2. Run `npm test` to validate configuration
3. Use `/robot-status` to check system health
4. Review the troubleshooting section in robot-team-guide.md

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes and test thoroughly
4. Submit pull request with detailed description

## License

MIT License - see LICENSE file for details.

## Support

- 📚 [Complete setup guide](./robot-team-guide.md)
- 🤖 [Discord team instructions](./Discord-Handoff.md)  
- 🎨 [Art team specifications](./Art-Team-Handoff.md)

---

**Robot Team Bot** - Bringing automation and personality to your Discord server! 🤖✨
