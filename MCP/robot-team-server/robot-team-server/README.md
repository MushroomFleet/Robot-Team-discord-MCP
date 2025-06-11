# Robot Team MCP Server

This MCP (Model Context Protocol) server provides tools to interact with the Robot Team's REST API, allowing external applications to send messages through the 7 Discord robots.

## Features

🤖 **Robot Communication Tools:**
- Send immediate messages through any of the 7 robots
- Schedule one-time or recurring messages
- Check robot status and health
- Manage scheduled posts
- Generate API keys (admin only)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Set environment variables:**
   ```bash
   # Required: API key for Robot Team access
   export ROBOT_TEAM_API_KEY="your-robot-team-api-key"
   
   # Optional: Custom API URL (defaults to http://localhost:9000)
   export ROBOT_TEAM_API_URL="https://your-robot-team-instance.com"
   
   # Optional: Admin key for generating new API keys
   export ROBOT_TEAM_ADMIN_KEY="your-admin-key"
   ```

## Configuration

### For Cline (Claude Dev)

Add this to your MCP settings configuration:

```json
{
  "mcpServers": {
    "robot-team": {
      "command": "node",
      "args": ["C:/Projects/robot-team/MCP/robot-team-server/robot-team-server/build/index.js"],
      "env": {
        "ROBOT_TEAM_API_KEY": "your-api-key-here",
        "ROBOT_TEAM_API_URL": "http://localhost:9000"
      }
    }
  }
}
```

### For Other MCP Clients

Use the built `index.js` file as the executable with appropriate environment variables.

## Available Tools

### 1. `send_robot_message`
Send an immediate message through one of the 7 robots.

**Parameters:**
- `robotId` (required): Robot ID (1-7)
- `content` (optional): Message text content
- `title` (optional): Embed title
- `image` (optional): Image URL for embed
- `channelId` (optional): Discord channel ID

**Example:**
```javascript
{
  "robotId": 1,
  "content": "Hello from Robot 1!",
  "title": "Greetings",
  "image": "https://example.com/image.png"
}
```

### 2. `schedule_robot_message`
Schedule a message to be sent at a specific time or on a recurring schedule.

**Parameters:**
- `robotId` (required): Robot ID (1-7)
- `content` (optional): Message text content
- `title` (optional): Embed title
- `image` (optional): Image URL for embed
- `when` (optional): ISO 8601 date/time for one-time posts
- `cron` (optional): Cron expression for recurring posts
- `recurring` (optional): Whether this is a recurring post
- `channelId` (optional): Discord channel ID

**Examples:**
```javascript
// One-time message
{
  "robotId": 2,
  "content": "Scheduled announcement!",
  "when": "2024-12-25T15:30:00Z"
}

// Recurring message (daily at 9 AM)
{
  "robotId": 3,
  "content": "Daily reminder",
  "cron": "0 9 * * *",
  "recurring": true
}
```

### 3. `get_robot_status`
Check the status of robots.

**Parameters:**
- `robotId` (optional): Specific robot ID to check (1-7). If omitted, returns all robots.

### 4. `list_scheduled_messages`
List scheduled messages with optional filtering.

**Parameters:**
- `robotId` (optional): Filter by robot ID (1-7)
- `limit` (optional): Number of results (max 100, default 50)
- `offset` (optional): Pagination offset (default 0)
- `active` (optional): Filter by active status (default true)

### 5. `cancel_scheduled_message`
Cancel/delete a scheduled message.

**Parameters:**
- `scheduleId` (required): Schedule ID (UUID) to cancel

### 6. `generate_api_key`
Generate a new API key for Robot Team access (requires admin privileges).

**Parameters:**
- `name` (required): Descriptive name for the API key
- `expiresIn` (optional): Expiration in days (1-365)
- `allowedRobots` (optional): Array of robot IDs the key can access

## Robot Information

| Robot ID | Name    | Color   | Emoji        |
|----------|---------|---------|--------------|
| 1        | Robot 1 | #FF0000 | :one::robot: |
| 2        | Robot 2 | #00FF00 | :two::robot: |
| 3        | Robot 3 | #0099FF | :three::robot: |
| 4        | Robot 4 | #FFFF00 | :four::robot: |
| 5        | Robot 5 | #FF00FF | :five::robot: |
| 6        | Robot 6 | #00FFFF | :six::robot: |
| 7        | Robot 7 | #FFA500 | :seven::robot: |

## Getting an API Key

To use this MCP server, you need a Robot Team API key:

1. **If you have admin access:** Use the `generate_api_key` tool
2. **If you need a key:** Contact your Robot Team administrator
3. **For development:** Use the Robot Team web interface to generate a key

## Troubleshooting

### Common Issues

1. **"API key required" error:**
   - Ensure `ROBOT_TEAM_API_KEY` environment variable is set
   - Verify the API key is valid and not expired

2. **"Robot Team API error" messages:**
   - Check that the Robot Team server is running
   - Verify the `ROBOT_TEAM_API_URL` is correct
   - Ensure the robot you're trying to use is configured

3. **Build errors:**
   - Run `npm install` to ensure dependencies are installed
   - Check that TypeScript and Node.js versions are compatible

### Logs

The server logs errors to stderr. Check the MCP client logs for debugging information.

## Development

### Watch Mode
```bash
npm run watch
```

### Inspector Mode
```bash
npm run inspector
```

## Security

- Store API keys securely
- Use admin keys only when necessary
- Regularly rotate API keys
- Monitor API usage for suspicious activity

## License

This project is part of the Robot Team system.
