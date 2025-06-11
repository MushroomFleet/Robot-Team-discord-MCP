# Robot Team Discord Bot + REST API

A comprehensive Discord bot system with integrated REST API that manages 7 unique robot personas (:one::robot: through :seven::robot:) for automated scheduling, posting, and cross-platform integration.

## 🚀 System Overview

**Robot Team** is a dual-interface system providing both Discord bot functionality and a complete REST API for external integrations. Perfect for automated content management, scheduled announcements, and multi-platform bot coordination.

## ✨ Core Features

### 🤖 Discord Bot Features
- **7 Individual Robot Personas** - Each with unique colors, webhooks, and personalities
- **Advanced Scheduling** - One-time and recurring posts with cron expressions
- **Rich Embeds** - Beautiful, color-coded messages with images and formatting
- **Webhook System** - Individual webhooks for authentic robot posting with unique avatars
- **Slash Commands** - Modern Discord command interface with full admin controls

### 🌐 REST API Features
- **Complete CRUD Operations** - Full message and schedule management via API
- **API Key Authentication** - Secure access with granular permissions and expiration
- **Rate Limiting** - Global and per-robot limits to prevent abuse
- **Cross-Platform Integration** - Use robots from any application or service
- **Real-time Monitoring** - Health checks, usage analytics, and error tracking
- **Security First** - CORS, request validation, and secure key storage

### 🗄️ Database & Infrastructure
- **SQLite Database** - Persistent storage with automatic migrations
- **Sequelize ORM** - Type-safe database operations and relationships
- **Job Scheduling** - Robust cron-based scheduling with failure recovery
- **Graceful Shutdown** - Zero-downtime deployments and restarts
- **Comprehensive Logging** - Detailed system monitoring and debugging

## 📋 Quick Start

### Prerequisites
- Node.js v16.7 or higher
- Discord Developer Account
- Discord server with admin permissions

### 1. Installation & Setup

```bash
# Clone and install
git clone <repository>
cd robot-team
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Discord credentials and API settings
```

### 2. Discord Setup
See [Discord-Handoff.md](./docs/Discord-Handoff.md) for detailed Discord configuration.

Required `.env` variables:
```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_bot_client_id_here
GUILD_ID=your_server_id_here
DATABASE_URL=./data/database.sqlite

# API Configuration
API_PORT=9000
CORS_ORIGIN=*
API_RATE_LIMIT_MAX=100
ADMIN_KEY=change-in-production
DEFAULT_CHANNEL_ID=your_default_channel_id
```

### 3. Deploy & Start

```bash
# Deploy Discord commands
npm run deploy

# Start the system (Discord bot + API server)
npm start

# For development with auto-restart
npm run dev
```

### 4. Initialize Robots

```bash
# In Discord, initialize each robot:
/init-robot robot:1
/init-robot robot:2
# ... continue for robots 3-7

# Check status
/robot-status
```

## 💬 Discord Usage

### Setup Commands
- `/init-robot robot:1` - Initialize robot with webhook
- `/robot-status` - Check all robots or specific robot status
- `/reset-robot robot:1` - Reset robot configuration

### Immediate Posting
```bash
# Simple message
/robot-post robot:1 content:"Hello World!"

# Rich embed with title
/robot-post robot:2 content:"Important update" title:"📢 Announcement"
```

### Scheduling Posts
```bash
# One-time scheduled post
/schedule robot:1 content:"Meeting in 10 minutes" when:"2024-12-25 15:30" title:"⏰ Reminder"

# Recurring daily post
/schedule robot:2 content:"Good morning team!" when:"0 9 * * *" recurring:true title:"🌅 Daily Greeting"

# Weekly report (Mondays at noon)
/schedule robot:3 content:"Weekly status update" when:"0 12 * * MON" recurring:true
```

### Schedule Management
```bash
# List all scheduled posts
/schedule-list

# List for specific robot
/schedule-list robot:1

# Cancel a scheduled post
/schedule-cancel post-id:abc-123-def
```

## 🌐 REST API Usage

### API Authentication

```bash
# Generate API key (requires admin access)
curl -X POST http://localhost:9000/api/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My App Key", "expiresIn": 30}'

# Use API key in requests
curl -H "X-API-Key: rtk_your_api_key_here" \
  http://localhost:9000/api/robots/status
```

### Send Immediate Messages

```bash
# Simple message
curl -X POST http://localhost:9000/api/robots/1/message \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from API!"}'

# Rich embed message
curl -X POST http://localhost:9000/api/robots/2/message \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Announcement",
    "content": "This message was sent via the REST API",
    "image": "https://example.com/image.png"
  }'
```

### Schedule Messages

```bash
# One-time scheduled message
curl -X POST http://localhost:9000/api/robots/1/schedule \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Scheduled Reminder",
    "content": "Don't forget about the meeting!",
    "when": "2024-12-25T15:30:00Z"
  }'

# Recurring message (daily at 9 AM)
curl -X POST http://localhost:9000/api/robots/2/schedule \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Daily standup in 30 minutes",
    "recurring": true,
    "cron": "0 9 * * *"
  }'
```

### Manage Schedules

```bash
# List scheduled posts
curl -H "X-API-Key: your_key" \
  "http://localhost:9000/api/schedules?robotId=1&limit=10"

# Cancel scheduled post
curl -X DELETE http://localhost:9000/api/schedules/post-id-here \
  -H "X-API-Key: your_key"

# Update scheduled post
curl -X PUT http://localhost:9000/api/schedules/post-id-here \
  -H "X-API-Key: your_key" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated message content"}'
```

### System Monitoring

```bash
# Health check
curl http://localhost:9000/health

# Robot status
curl -H "X-API-Key: your_key" \
  http://localhost:9000/api/robots/status

# API documentation
curl http://localhost:9000/api
```

## 🛠️ JavaScript SDK Example

Use the included JavaScript client for easy integration:

```javascript
const RobotTeamClient = require('./examples/api-client.js');

const client = new RobotTeamClient('your-api-key');

// Send immediate message
await client.sendMessage(1, 'Hello from SDK!', {
  title: '🤖 SDK Test',
  image: 'https://example.com/image.png'
});

// Schedule recurring message
await client.scheduleMessage(2, 'Weekly reminder', null, {
  recurring: true,
  cron: '0 9 * * MON',
  title: '📅 Weekly Update'
});

// Get robot status
const status = await client.getRobotStatus();
console.log('Active robots:', status.summary.active);
```

## 🤖 Robot Personalities

Each robot has a unique color scheme and can be customized:

| Robot | Color | Hex Code | Use Case |
|-------|-------|----------|----------|
| 🤖 Robot 1 | Red | #FF0000 | Alerts & Urgent Messages |
| 🤖 Robot 2 | Green | #00FF00 | Success & Positive Updates |
| 🤖 Robot 3 | Blue | #0099FF | Information & Announcements |
| 🤖 Robot 4 | Yellow | #FFFF00 | Warnings & Cautions |
| 🤖 Robot 5 | Magenta | #FF00FF | Special Events |
| 🤖 Robot 6 | Cyan | #00FFFF | Tech & Development |
| 🤖 Robot 7 | Orange | #FFA500 | Social & Community |

## 📁 Project Structure

```
robot-team/
├── src/
│   ├── api/                    # REST API Server
│   │   ├── server.js           # Express server setup
│   │   ├── middleware/         # Auth, logging, validation
│   │   └── routes/             # API endpoints
│   │       ├── robots.js       # Robot operations
│   │       ├── schedules.js    # Schedule management
│   │       └── auth.js         # API key management
│   ├── commands/               # Discord slash commands
│   │   ├── admin/              # Admin-only commands
│   │   ├── robot/              # Robot management
│   │   └── schedule/           # Scheduling commands
│   ├── models/                 # Database models (Sequelize)
│   ├── services/               # Core business logic
│   │   ├── webhooks.js         # Discord webhook management
│   │   └── scheduler.js        # Cron job scheduling
│   └── utils/                  # Shared utilities
│       ├── embedBuilder.js     # Rich embed creation
│       └── robotNames.js       # Robot name utilities
├── examples/
│   └── api-client.js           # JavaScript SDK & CLI tool
├── docs/                       # Documentation
│   ├── api-documentation.md    # Complete API reference
│   ├── robot-team-guide.md     # Detailed setup guide
│   ├── Discord-Handoff.md      # Discord configuration
│   └── Art-Team-Handoff.md     # Visual specifications
├── data/                       # SQLite database
├── SETUP.md                    # Quick start guide
├── Robot-Team-Handbook.md      # Complete handbook
└── index.js                    # Main application entry
```

## ⏰ Scheduling Examples

### Cron Expression Reference

| Pattern | Description | Example |
|---------|-------------|---------|
| `0 9 * * *` | Daily at 9:00 AM | Morning announcements |
| `0 */6 * * *` | Every 6 hours | Periodic status updates |
| `0 12 * * 1-5` | Weekdays at noon | Lunch reminders |
| `0 0 1 * *` | First day of month | Monthly reports |
| `0 17 * * FRI` | Fridays at 5 PM | Weekly wrap-ups |

### Advanced Scheduling

```bash
# Complex recurring schedules
/schedule robot:1 content:"Backup completed" when:"0 2 * * *" recurring:true title:"🔄 System Backup"
/schedule robot:2 content:"Weekly team meeting" when:"0 10 * * MON" recurring:true title:"📅 Team Meeting"
/schedule robot:3 content:"Server maintenance window" when:"0 1 * * SUN" recurring:true title:"🔧 Maintenance"
```

## 🔧 Development

### Adding New Commands

1. Create command file:
```javascript
// src/commands/example/hello.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Say hello'),
    
  async execute(interaction) {
    await interaction.reply('Hello from Robot Team!');
  }
};
```

2. Redeploy commands:
```bash
npm run deploy
```

### Adding API Endpoints

1. Add route in `src/api/routes/`:
```javascript
router.get('/custom-endpoint', requirePermission('canViewStatus'), async (req, res) => {
  res.json({ message: 'Custom endpoint working!' });
});
```

2. Test endpoint:
```bash
curl -H "X-API-Key: your_key" http://localhost:9000/api/custom-endpoint
```

### Database Operations

```bash
# Reset database (WARNING: Deletes all data)
npm run db:reset

# View database in development
npm run dev
# Check logs for SQL queries
```

## 📊 Monitoring & Analytics

### Health Monitoring
- **System Health**: `/health` endpoint provides uptime and status
- **Robot Status**: Track active robots and webhook health
- **Scheduler Health**: Monitor job execution and failures
- **API Usage**: Track requests, rate limits, and authentication

### Logging
All operations are logged with context:
- 🤖 Bot operations and command execution
- 📡 Webhook activities and message sending
- ⏰ Scheduler events and job execution
- 🌐 API requests and responses
- ❌ Errors with full stack traces

## 🚀 Production Deployment

### Environment Configuration
```env
NODE_ENV=production
ADMIN_KEY=secure-random-key-here
CORS_ORIGIN=https://yourdomain.com
API_RATE_LIMIT_MAX=1000
```

### Hosting Options

#### Railway (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically
4. Scale as needed

#### Alternative Platforms
- **Heroku**: Classic PaaS with easy deployment
- **DigitalOcean**: VPS with full control
- **AWS/GCP**: Enterprise-grade with advanced features

### Security Checklist
- [ ] Change default `ADMIN_KEY`
- [ ] Use HTTPS in production
- [ ] Restrict CORS origins
- [ ] Set appropriate rate limits
- [ ] Monitor API usage
- [ ] Regularly rotate API keys
- [ ] Use production Discord tokens

## 🔍 Troubleshooting

### Common Issues

#### Discord Bot Issues
- **Bot not responding**: Check `DISCORD_TOKEN` and bot permissions
- **Commands not appearing**: Run `npm run deploy` and verify `CLIENT_ID`/`GUILD_ID`
- **Webhooks failing**: Ensure "Manage Webhooks" permission and re-run `/init-robot`

#### API Issues
- **Authentication errors**: Generate new API key and check `X-API-Key` header
- **Rate limiting**: Check limits and implement backoff in your client
- **CORS errors**: Update `CORS_ORIGIN` environment variable

#### Scheduling Issues
- **Jobs not executing**: Validate cron expressions at [crontab.guru](https://crontab.guru)
- **Wrong timezone**: System uses UTC, adjust your cron expressions accordingly
- **Robot offline**: Check robot status with `/robot-status` or API

### Debug Commands

```bash
# Test bot connection
npm test

# Check system health
curl http://localhost:9000/health

# Generate test API key
node examples/api-client.js generate-key "Debug Key"

# Test API client
node examples/api-client.js examples your-api-key
```

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Quick setup guide
- **[Robot-Team-Handbook.md](./Robot-Team-Handbook.md)** - Complete system handbook
- **[API Documentation](./docs/api-documentation.md)** - Full REST API reference
- **[Discord Setup](./docs/Discord-Handoff.md)** - Discord configuration guide
- **[Art Specifications](./docs/Art-Team-Handoff.md)** - Visual design guidelines

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and test thoroughly
4. Update documentation as needed
5. Submit a pull request with detailed description

### Development Guidelines
- Follow existing code style and patterns
- Add JSDoc comments for new functions
- Update tests for new features
- Ensure backwards compatibility
- Document breaking changes

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Support & Community

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Discord**: Join our community server for support
- **Documentation**: Check the `/docs` folder for detailed guides

---

**🤖 Robot Team Bot** - Bringing automation, personality, and powerful API integration to your Discord server and beyond! 

*Built with ❤️ for the modern Discord community and developer ecosystem.*
