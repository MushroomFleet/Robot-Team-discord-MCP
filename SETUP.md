# Robot Team Bot Setup Guide

## Quick Start

This guide will help you get the Robot Team Discord bot with REST API up and running.

## Prerequisites

- Node.js 16.7+ installed
- Discord bot token and server access
- Basic command line knowledge

## Step 1: Initial Setup

1. **Clone/Download** the project files
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment** by updating `.env`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_bot_client_id_here
   GUILD_ID=your_server_id_here
   DATABASE_URL=./data/database.sqlite
   NODE_ENV=development
   
   # API Configuration
   API_PORT=9000
   CORS_ORIGIN=*
   API_RATE_LIMIT_WINDOW=60000
   API_RATE_LIMIT_MAX=100
   ADMIN_KEY=admin-key-change-in-production
   DEFAULT_CHANNEL_ID=your_default_channel_id
   ```

## Step 2: Deploy Commands

Deploy the slash commands to Discord:

```bash
npm run deploy
```

## Step 3: Start the Bot

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

## Step 4: Initialize Robots

In Discord, use the `/init-robot` command to set up each robot:

```
/init-robot robot:1
/init-robot robot:2
/init-robot robot:3
/init-robot robot:4
/init-robot robot:5
/init-robot robot:6
/init-robot robot:7
```

## Step 5: Test the System

### Discord Commands

1. **Check robot status:**
   ```
   /robot-status
   ```

2. **Send immediate message:**
   ```
   /robot-post robot:1 content:"Hello World!" title:"Test Message"
   ```

3. **Schedule a message:**
   ```
   /schedule robot:2 content:"Daily reminder" when:"2024-12-25 15:30" title:"Reminder"
   ```

4. **List scheduled posts:**
   ```
   /schedule-list
   ```

### API Testing

1. **Generate API key:**
   ```bash
   node examples/api-client.js generate-key "Test Key"
   ```

2. **Test API health:**
   ```bash
   curl http://localhost:9000/health
   ```

3. **Test with API client:**
   ```bash
   # Update API_KEY in examples/api-client.js first
   node examples/api-client.js test your-api-key-here
   ```

## System Architecture

```
Robot Team Bot System
├── Discord Bot (index.js)
│   ├── Slash Commands (/src/commands/)
│   ├── Webhook Management (/src/services/webhooks.js)
│   └── Job Scheduler (/src/services/scheduler.js)
├── REST API Server (/src/api/)
│   ├── Authentication & Rate Limiting
│   ├── Robot Operations (/api/robots/)
│   ├── Schedule Management (/api/schedules/)
│   └── API Key Management (/api/auth/)
├── Database (SQLite)
│   ├── Robots Configuration
│   ├── Scheduled Posts
│   ├── Post History
│   └── API Keys
└── Examples & Documentation
    ├── API Client (/examples/api-client.js)
    └── Full Documentation (/docs/api-documentation.md)
```

## Available Scripts

```bash
npm start          # Start the bot
npm run dev        # Start with auto-restart (development)
npm run deploy     # Deploy Discord commands
npm run test       # Run bot connection test
npm run db:reset   # Reset database (WARNING: deletes all data)
```

## API Endpoints Summary

### Core Operations
- `GET /health` - Health check
- `GET /api` - API documentation
- `GET /api/robots/status` - Robot status
- `POST /api/robots/{id}/message` - Send immediate message
- `POST /api/robots/{id}/schedule` - Schedule message

### Schedule Management
- `GET /api/schedules` - List scheduled posts
- `GET /api/schedules/{id}` - Get specific schedule
- `PUT /api/schedules/{id}` - Update schedule
- `DELETE /api/schedules/{id}` - Cancel schedule

### API Key Management
- `POST /api/auth/keys` - Generate API key
- `GET /api/auth/keys` - List API keys (admin)
- `DELETE /api/auth/keys/{id}` - Revoke API key (admin)

## Features

### ✅ Discord Bot Features
- 7 individual robot personas (:one::robot: through :seven::robot:)
- Slash command interface
- Rich embed support
- Webhook-based messaging for unique avatars
- Scheduled posting with cron expressions
- One-time and recurring posts
- Post history tracking

### ✅ REST API Features
- RESTful API with full CRUD operations
- API key authentication with granular permissions
- Rate limiting (global + per-robot)
- Comprehensive error handling
- Robot status monitoring
- Schedule management
- Security headers and CORS support

### ✅ Database Features
- SQLite database with Sequelize ORM
- Robot configuration storage
- Scheduled post management
- Post execution history
- API key management
- Automatic database migrations

### ✅ Developer Experience
- Complete API documentation
- Example client implementations
- TypeScript-ready structure
- Comprehensive error handling
- Detailed logging
- Health check endpoints

## Example Use Cases

### 1. Automated Announcements
```javascript
const client = new RobotTeamClient('api-key');

// Send immediate announcement
await client.sendMessage(1, 'Server maintenance in 1 hour', {
  title: '🚨 Maintenance Alert'
});

// Schedule recurring reminders
await client.scheduleMessage(2, 'Weekly team meeting today!', null, {
  recurring: true,
  cron: '0 9 * * MON',
  title: '📅 Weekly Reminder'
});
```

### 2. Multi-Robot Content Distribution
```javascript
// Send same message from different robots
for (let robotId = 1; robotId <= 7; robotId++) {
  await client.sendMessage(robotId, `Robot ${robotId} reporting for duty!`);
}
```

### 3. Scheduled Content Calendar
```javascript
// Schedule a week of content
const schedules = [
  { robot: 1, day: 'MON', message: 'Week planning session' },
  { robot: 2, day: 'WED', message: 'Mid-week check-in' },
  { robot: 3, day: 'FRI', message: 'Weekly wrap-up' }
];

for (const schedule of schedules) {
  await client.scheduleMessage(schedule.robot, schedule.message, null, {
    recurring: true,
    cron: `0 10 * * ${schedule.day}`
  });
}
```

## Production Deployment

### Environment Variables
```env
NODE_ENV=production
ADMIN_KEY=secure-random-key-here
CORS_ORIGIN=https://yourdomain.com
API_RATE_LIMIT_MAX=1000
```

### Security Considerations
- Change default `ADMIN_KEY` in production
- Use HTTPS in production environments
- Restrict CORS origins to trusted domains
- Monitor API usage and set appropriate rate limits
- Regularly rotate API keys
- Use environment-specific Discord tokens

### Hosting Options
- **Railway**: Easy deployment with GitHub integration
- **Heroku**: Classic PaaS with free tier
- **DigitalOcean**: VPS with full control
- **AWS/GCP**: Enterprise-grade with advanced features

## Troubleshooting

### Common Issues

1. **Bot not responding to commands**
   - Check `DISCORD_TOKEN` and `GUILD_ID` in `.env`
   - Verify bot has proper permissions in Discord
   - Run `npm run deploy` to update commands

2. **Webhooks not working**
   - Ensure bot has "Manage Webhooks" permission
   - Use `/init-robot` command to create webhooks
   - Check robot status with `/robot-status`

3. **API authentication errors**
   - Generate API key with `/api/auth/keys` endpoint
   - Include `X-API-Key` header in requests
   - Check key permissions and expiration

4. **Database errors**
   - Ensure `data/` directory exists and is writable
   - Try `npm run db:reset` (WARNING: deletes all data)
   - Check SQLite file permissions

5. **Scheduling not working**
   - Validate cron expressions at https://crontab.guru
   - Check timezone settings (uses UTC)
   - Verify robot is initialized and active

### Getting Help

- Check console logs for detailed error information
- Use health check endpoints to verify system status
- Test individual components with provided utilities
- Review API documentation for correct usage

## Next Steps

1. **Customize robot personalities** by updating avatar URLs and names
2. **Add more commands** by creating files in `/src/commands/`
3. **Integrate with external services** using the API
4. **Create custom dashboards** using the REST API
5. **Add monitoring** and alerting for production use

## Contributing

- Follow existing code structure and naming conventions
- Add JSDoc comments for new functions
- Update documentation when adding features
- Test new features thoroughly before deployment

---

🤖 **Robot Team Bot** - Bringing automation and personality to Discord communication!
