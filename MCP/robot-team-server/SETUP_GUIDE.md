# Robot Team MCP Server Setup Guide

## Quick Setup for Cline

### Step 1: Get a Robot Team API Key

You'll need a Robot Team API key to use this MCP server. You can get one by:

1. **If Robot Team is running locally:**
   - Start the Robot Team server: `npm start` (in the main robot-team directory)
   - The server should be running on `http://localhost:9000`
   - Use the web interface or contact your admin for an API key

2. **Generate an API key programmatically:**
   - If you have admin access, you can use the MCP server's `generate_api_key` tool once configured

### Step 2: Configure Cline MCP Settings

1. **Open Cline Settings:**
   - In VS Code, open the Command Palette (Ctrl+Shift+P)
   - Search for "Cline: Open MCP Settings"
   - Or manually edit your MCP configuration file

2. **Add the Robot Team server configuration:**

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

**Replace `your-api-key-here` with your actual Robot Team API key.**

### Step 3: Restart Cline

After adding the configuration:
1. Restart VS Code or reload the Cline extension
2. The Robot Team tools should now be available in Cline

### Step 4: Test the Integration

Once configured, you can use these tools in Cline:

- **Send a message:** "Send a message through Robot 1 saying 'Hello World!'"
- **Check status:** "What's the status of all the robots?"
- **Schedule a message:** "Schedule Robot 3 to say 'Good morning!' at 9 AM tomorrow"

## Available Tools

After configuration, Cline will have access to these Robot Team tools:

1. **send_robot_message** - Send immediate messages
2. **schedule_robot_message** - Schedule messages for later
3. **get_robot_status** - Check robot health and status
4. **list_scheduled_messages** - View scheduled posts
5. **cancel_scheduled_message** - Cancel scheduled posts
6. **generate_api_key** - Create new API keys (admin only)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ROBOT_TEAM_API_KEY` | Yes | - | Your Robot Team API key |
| `ROBOT_TEAM_API_URL` | No | `http://localhost:9000` | Robot Team server URL |
| `ROBOT_TEAM_ADMIN_KEY` | No | - | Admin key for generating API keys |

## Troubleshooting

### "API key required" error
- Make sure you've set `ROBOT_TEAM_API_KEY` in the MCP configuration
- Verify the API key is valid and hasn't expired

### "Connection refused" errors
- Ensure the Robot Team server is running
- Check the `ROBOT_TEAM_API_URL` is correct
- Verify network connectivity

### MCP server not appearing in Cline
- Check the file path in the configuration is correct
- Restart VS Code completely
- Check Cline's output/error logs

### "Robot not found" errors
- Verify the robot ID is between 1-7
- Check robot status using `get_robot_status`
- Ensure the robot is properly configured in Robot Team

## Security Notes

- Store API keys securely
- Don't commit API keys to version control
- Use environment-specific API keys
- Regularly rotate API keys
- Monitor API usage for suspicious activity

## Example Usage in Cline

After setup, you can ask Cline to:

```
"Send a message through Robot 2 with the title 'Daily Update' and content 'All systems operational'"

"Schedule Robot 5 to send a reminder every Monday at 9 AM with the content 'Team meeting in 1 hour'"

"Show me the status of all robots"

"List all scheduled messages for Robot 3"
```

The MCP server will handle the Robot Team API integration automatically!
