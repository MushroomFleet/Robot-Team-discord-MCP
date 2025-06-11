# Robot Team MCP Integration

This directory contains the Model Context Protocol (MCP) server that enables external applications like Cline to interact with the Robot Team Discord bot system.

## What is MCP?

The Model Context Protocol allows AI assistants like Cline to access external tools and services. This MCP server acts as a bridge between Cline and the Robot Team API, enabling you to send messages through Discord bots directly from your AI assistant.

## Directory Structure

```
MCP/
├── README.md                           # This file
├── SETUP_GUIDE.md                     # Quick setup instructions
└── robot-team-server/
    └── robot-team-server/
        ├── package.json                # Project dependencies
        ├── tsconfig.json               # TypeScript configuration
        ├── README.md                   # Detailed documentation
        ├── src/
        │   └── index.ts               # MCP server source code
        └── build/
            └── index.js               # Compiled server (ready to use)
```

## Features

🤖 **Send Discord Messages**: Send messages through any of the 7 Robot Team bots
📅 **Schedule Messages**: Set up one-time or recurring messages
📊 **Monitor Status**: Check robot health and availability
🔧 **Manage Schedules**: List and cancel scheduled messages
🔑 **API Key Management**: Generate new API keys (admin only)

## Quick Start

1. **Ensure Robot Team is running**:
   ```bash
   # In the main robot-team directory
   npm start
   ```

2. **Get an API key** from your Robot Team admin or web interface

3. **Configure Cline** by adding this to your MCP settings:
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

4. **Restart Cline** and start using Robot Team commands!

## Example Usage

Once configured, you can ask Cline to:

- "Send a message through Robot 1 saying 'Hello World!'"
- "Schedule Robot 3 to post a daily reminder at 9 AM"
- "What's the status of all the robots?"
- "Show me all scheduled messages"

## Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[robot-team-server/README.md](robot-team-server/robot-team-server/README.md)** - Detailed technical documentation

## Benefits

✅ **Seamless Integration**: Use natural language to control Discord bots
✅ **No Manual Switching**: Stay in your development environment
✅ **Powerful Scheduling**: Set up complex recurring messages
✅ **Real-time Status**: Monitor robot health and activity
✅ **Secure**: Uses Robot Team's existing authentication system

## Architecture

```
Cline (AI Assistant)
    ↓ MCP Protocol
Robot Team MCP Server
    ↓ HTTP/REST API  
Robot Team System
    ↓ Discord API
Discord Server (7 Bots)
```

The MCP server acts as a translator between Cline's tool requests and the Robot Team's REST API, providing a seamless way to control Discord bots from within your AI assistant.

## Support

For issues with:
- **MCP Server**: Check the logs and documentation in this directory
- **Robot Team API**: Refer to the main Robot Team documentation
- **Cline Integration**: Check Cline's MCP settings and restart if needed

## Security

- API keys are stored in environment variables, never in code
- All requests are authenticated through Robot Team's security system
- Admin functions require separate admin keys
- Regular API key rotation is recommended
