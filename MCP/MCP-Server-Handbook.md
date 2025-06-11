# 🛠️ Robot Team MCP Server Handbook

## Welcome Server Administrators & Developers!

This handbook provides comprehensive guidance for installing, configuring, and maintaining the Robot Team MCP server. Whether you're setting up for a team or deploying in production, this guide has you covered.

## 🎯 Target Audience

- **System Administrators** - Setting up MCP for teams
- **DevOps Engineers** - Production deployment and monitoring
- **Developers** - Extending and customizing the MCP server
- **Team Leads** - Managing API access and security

## 🌟 What You're Setting Up

The Robot Team MCP server provides:

✅ **6 Powerful Tools** - Complete Discord bot control via AI assistants  
✅ **Secure API Integration** - Authenticated access to Robot Team REST API  
✅ **Multi-Client Support** - Works with Cline, Claude Desktop, and other MCP clients  
✅ **Robust Error Handling** - Comprehensive error reporting and recovery  
✅ **Production Ready** - Built for scale with proper security and monitoring  
✅ **Easy Deployment** - Pre-built binaries and simple configuration

## 📋 Prerequisites

### System Requirements
- **Node.js** v16.7 or higher
- **Operating System**: Windows, macOS, or Linux
- **Memory**: 512MB RAM minimum (1GB+ recommended)
- **Storage**: 100MB for server files
- **Network**: Access to Robot Team API server

### Required Services
- **Robot Team Server** - Must be running and accessible
- **Discord Bot** - Properly configured with webhooks
- **Network Access** - Between MCP server and Robot Team API

### Administrator Access
- **Robot Team Admin Key** - For generating API keys
- **File System Access** - To install and configure MCP server
- **MCP Client Access** - To configure user AI assistants

## 🚀 Installation Guide

### Step 1: Download and Build

```bash
# Navigate to your Robot Team installation
cd /path/to/robot-team

# The MCP server is already included in the MCP/ directory
# Build the TypeScript source
cd MCP/robot-team-server/robot-team-server
npm install
npm run build

# Verify build completed
ls build/index.js
```

### Step 2: Generate Admin API Key

First, ensure your Robot Team server is running:

```bash
# In the main robot-team directory
npm start
```

Then generate an API key for the MCP server:

```bash
# Using curl (replace admin-key with your actual admin key)
curl -X POST http://localhost:9000/api/auth/keys \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: your-admin-key" \
  -d '{
    "name": "MCP Server Master Key",
    "expiresIn": 365,
    "permissions": {
      "canSendMessages": true,
      "canSchedule": true,
      "canViewStatus": true,
      "canGenerateKeys": true,
      "allowedRobots": [1, 2, 3, 4, 5, 6, 7]
    }
  }'

# Or using PowerShell on Windows
Invoke-WebRequest -Uri "http://localhost:9000/api/auth/keys" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"; "X-Admin-Key"="your-admin-key"} `
  -Body '{"name": "MCP Server Master Key", "expiresIn": 365}'
```

**Save the returned API key securely** - you'll need it for configuration.

### Step 3: Test MCP Server

Test the server runs correctly:

```bash
cd MCP/robot-team-server/robot-team-server

# Set environment variables
export ROBOT_TEAM_API_KEY="your-generated-api-key"
export ROBOT_TEAM_API_URL="http://localhost:9000"

# Test the server (should start without errors)
node build/index.js
# Press Ctrl+C to stop after seeing "Robot Team MCP server running on stdio"
```

### Step 4: Create Configuration Templates

Create configuration files for easy user setup:

```bash
# Create a template configuration file
cat > MCP/user-config-template.json << 'EOF'
{
  "mcpServers": {
    "robot-team": {
      "command": "node",
      "args": ["REPLACE_WITH_FULL_PATH/MCP/robot-team-server/robot-team-server/build/index.js"],
      "env": {
        "ROBOT_TEAM_API_KEY": "USER_API_KEY_HERE",
        "ROBOT_TEAM_API_URL": "http://localhost:9000"
      }
    }
  }
}
EOF
```

## 🔧 Configuration Guide

### Environment Variables

The MCP server uses these environment variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ROBOT_TEAM_API_KEY` | ✅ Yes | - | API key for Robot Team access |
| `ROBOT_TEAM_API_URL` | ❌ No | `http://localhost:9000` | Robot Team server URL |
| `ROBOT_TEAM_ADMIN_KEY` | ❌ No | - | Admin key for key generation |

### Configuration File Options

For production deployments, create a `.env` file:

```bash
# MCP Server Configuration
ROBOT_TEAM_API_KEY=rtk_your_master_api_key_here
ROBOT_TEAM_API_URL=https://robot-team.yourdomain.com
ROBOT_TEAM_ADMIN_KEY=your_admin_key_here

# Optional: Logging and debugging
DEBUG=robot-team-mcp:*
LOG_LEVEL=info
```

### Security Configuration

#### API Key Permissions

Configure API keys with minimal required permissions:

```javascript
// For regular users
{
  "name": "User API Key",
  "permissions": {
    "canSendMessages": true,
    "canSchedule": true,
    "canViewStatus": true,
    "canGenerateKeys": false,  // Admin only
    "allowedRobots": [1, 2, 3]  // Limit robot access
  },
  "expiresIn": 90  // 90 days
}

// For power users
{
  "name": "Power User API Key",
  "permissions": {
    "canSendMessages": true,
    "canSchedule": true,
    "canViewStatus": true,
    "canGenerateKeys": false,
    "allowedRobots": [1, 2, 3, 4, 5, 6, 7]  // All robots
  },
  "expiresIn": 90
}

// For admins
{
  "name": "Admin API Key",
  "permissions": {
    "canSendMessages": true,
    "canSchedule": true,
    "canViewStatus": true,
    "canGenerateKeys": true,  // Can create new keys
    "allowedRobots": [1, 2, 3, 4, 5, 6, 7]
  },
  "expiresIn": 30  // Shorter expiration for admin keys
}
```

#### Network Security

```bash
# Firewall configuration (example for Ubuntu)
sudo ufw allow from 192.168.1.0/24 to any port 9000  # Local network only
sudo ufw deny 9000  # Deny external access

# Or use reverse proxy with authentication
# See production deployment section
```

## 👥 User Management

### Creating API Keys for Users

#### Method 1: Automated Script

Create a script for easy API key generation:

```bash
#!/bin/bash
# generate-user-key.sh

API_URL="http://localhost:9000"
ADMIN_KEY="your-admin-key"

if [ -z "$1" ]; then
    echo "Usage: $0 <user-name> [robots] [days]"
    echo "Example: $0 'john-doe' '1,2,3' 90"
    exit 1
fi

USER_NAME="$1"
ROBOTS="${2:-1,2,3,4,5,6,7}"
DAYS="${3:-90}"

# Convert comma-separated robots to JSON array
ROBOTS_JSON=$(echo "[$ROBOTS]" | sed 's/,/, /g')

curl -X POST "$API_URL/api/auth/keys" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Key: $ADMIN_KEY" \
  -d "{
    \"name\": \"$USER_NAME MCP Key\",
    \"expiresIn\": $DAYS,
    \"permissions\": {
      \"canSendMessages\": true,
      \"canSchedule\": true,
      \"canViewStatus\": true,
      \"allowedRobots\": $ROBOTS_JSON
    }
  }" | jq .
```

#### Method 2: Interactive Web Interface

If you have a web interface for Robot Team, add MCP key generation:

```javascript
// Example API endpoint for web interface
app.post('/admin/mcp-keys', requireAdmin, async (req, res) => {
  const { userName, robots, expiresIn } = req.body;
  
  try {
    const apiKey = await generateApiKey({
      name: `${userName} MCP Key`,
      permissions: {
        canSendMessages: true,
        canSchedule: true,
        canViewStatus: true,
        allowedRobots: robots
      },
      expiresIn
    });
    
    res.json({
      success: true,
      apiKey,
      configTemplate: generateMCPConfig(apiKey)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### User Onboarding Process

1. **Generate API Key** using admin tools
2. **Create Configuration** from template
3. **Share Setup Instructions** from Client Handbook
4. **Verify Setup** with test commands
5. **Document Access** for audit trail

### Revoking Access

```bash
# List all API keys
curl -H "X-Admin-Key: your-admin-key" \
  http://localhost:9000/api/auth/keys

# Revoke specific key
curl -X DELETE -H "X-Admin-Key: your-admin-key" \
  http://localhost:9000/api/auth/keys/key-id-here
```

## 🌐 Production Deployment

### Deployment Options

#### Option 1: Same Server as Robot Team

**Pros**: Simple setup, shared resources  
**Cons**: Single point of failure

```bash
# Add to Robot Team startup script
cd /path/to/robot-team/MCP/robot-team-server/robot-team-server
export ROBOT_TEAM_API_KEY="production-api-key"
export ROBOT_TEAM_API_URL="http://localhost:9000"

# Start as background service
nohup node build/index.js > mcp-server.log 2>&1 &
echo $! > mcp-server.pid
```

#### Option 2: Separate Server

**Pros**: Isolated, scalable, better security  
**Cons**: More complex setup

```bash
# On separate server
export ROBOT_TEAM_API_KEY="production-api-key"
export ROBOT_TEAM_API_URL="https://robot-team.yourdomain.com"

# Use process manager
pm2 start build/index.js --name "robot-team-mcp"
pm2 startup
pm2 save
```

#### Option 3: Container Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY build/ ./build/
COPY node_modules/ ./node_modules/

USER node
EXPOSE 3000

CMD ["node", "build/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  robot-team-mcp:
    build: .
    environment:
      - ROBOT_TEAM_API_KEY=${ROBOT_TEAM_API_KEY}
      - ROBOT_TEAM_API_URL=${ROBOT_TEAM_API_URL}
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs
```

### Load Balancing

For high availability:

```nginx
# nginx.conf
upstream mcp_servers {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name mcp.yourdomain.com;
    
    location / {
        proxy_pass http://mcp_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/TLS Configuration

```bash
# Using Let's Encrypt
certbot --nginx -d mcp.yourdomain.com

# Or with custom certificates
nginx -t && systemctl reload nginx
```

## 📊 Monitoring & Logging

### Health Monitoring

Create monitoring endpoints:

```bash
#!/bin/bash
# health-check.sh

API_URL="http://localhost:9000"
MCP_HEALTH=$(curl -s "$API_URL/health" | jq -r '.status')

if [ "$MCP_HEALTH" = "healthy" ]; then
    echo "✅ Robot Team API: Healthy"
else
    echo "❌ Robot Team API: Unhealthy"
    exit 1
fi

# Test MCP server (basic connectivity)
if pgrep -f "robot-team-mcp" > /dev/null; then
    echo "✅ MCP Server: Running"
else
    echo "❌ MCP Server: Not running"
    exit 1
fi
```

### Log Management

```bash
# Log rotation configuration
# /etc/logrotate.d/robot-team-mcp
/var/log/robot-team-mcp/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 robot-team robot-team
    postrotate
        systemctl reload robot-team-mcp
    endscript
}
```

### Performance Monitoring

```javascript
// Example monitoring script
const monitor = {
  checkApiLatency: async () => {
    const start = Date.now();
    await fetch('http://localhost:9000/health');
    return Date.now() - start;
  },
  
  checkMemoryUsage: () => {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      heapUsed: Math.round(used.heapUsed / 1024 / 1024)
    };
  }
};

// Run every 5 minutes
setInterval(async () => {
  const latency = await monitor.checkApiLatency();
  const memory = monitor.checkMemoryUsage();
  
  console.log(`API Latency: ${latency}ms, Memory: ${memory.rss}MB`);
}, 5 * 60 * 1000);
```

## 🔐 Security Best Practices

### API Key Security

1. **Use Strong API Keys**:
   ```bash
   # Generate secure random keys
   openssl rand -base64 32
   ```

2. **Implement Key Rotation**:
   ```bash
   # Automated key rotation script
   #!/bin/bash
   # rotate-api-keys.sh
   
   # Generate new key
   NEW_KEY=$(curl -X POST ... | jq -r '.data.apiKey')
   
   # Update configuration
   sed -i "s/ROBOT_TEAM_API_KEY=.*/ROBOT_TEAM_API_KEY=$NEW_KEY/" .env
   
   # Restart services
   systemctl restart robot-team-mcp
   
   # Revoke old key after grace period
   sleep 300  # 5 minute grace period
   curl -X DELETE -H "X-Admin-Key: $ADMIN_KEY" \
     "http://localhost:9000/api/auth/keys/$OLD_KEY_ID"
   ```

3. **Monitor Key Usage**:
   ```bash
   # Log API key usage
   tail -f /var/log/robot-team/api.log | grep "API_KEY_USED"
   ```

### Network Security

```bash
# Firewall rules
iptables -A INPUT -p tcp --dport 9000 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 9000 -j DROP

# Use VPN for remote access
openvpn --config robot-team-vpn.ovpn
```

### Access Control

```yaml
# Example RBAC configuration
roles:
  admin:
    permissions:
      - "mcp:*"
      - "api:keys:*"
      - "robots:*"
  
  power_user:
    permissions:
      - "mcp:use"
      - "robots:send"
      - "robots:schedule"
      - "robots:status"
  
  user:
    permissions:
      - "mcp:use"
      - "robots:send"
      - "robots:status"
    restrictions:
      - "robots:1,2,3"  # Limited robot access
```

## 🚨 Troubleshooting

### Common Issues

#### MCP Server Won't Start

**Error**: `ROBOT_TEAM_API_KEY environment variable is required`

**Solution**:
```bash
# Check environment variables
env | grep ROBOT_TEAM

# Set if missing
export ROBOT_TEAM_API_KEY="your-api-key"
export ROBOT_TEAM_API_URL="http://localhost:9000"
```

#### Authentication Failures

**Error**: `Authentication Required` or `API key invalid`

**Solutions**:
1. Verify API key is correct:
   ```bash
   curl -H "X-API-Key: $ROBOT_TEAM_API_KEY" \
     http://localhost:9000/api/robots/status
   ```

2. Check key expiration:
   ```bash
   curl -H "X-Admin-Key: $ADMIN_KEY" \
     http://localhost:9000/api/auth/keys | jq '.[] | select(.apiKey == "your-key")'
   ```

3. Regenerate if expired:
   ```bash
   # Generate new key
   curl -X POST http://localhost:9000/api/auth/keys \
     -H "Content-Type: application/json" \
     -H "X-Admin-Key: $ADMIN_KEY" \
     -d '{"name": "New MCP Key", "expiresIn": 90}'
   ```

#### Connection Refused

**Error**: `Unable to connect to the remote server`

**Solutions**:
1. Check Robot Team server status:
   ```bash
   curl http://localhost:9000/health
   ```

2. Verify network connectivity:
   ```bash
   telnet localhost 9000
   ```

3. Check firewall rules:
   ```bash
   sudo ufw status
   sudo iptables -L
   ```

#### Permission Denied

**Error**: `Robot Access Denied` or `Insufficient permissions`

**Solutions**:
1. Check API key permissions:
   ```bash
   curl -H "X-Admin-Key: $ADMIN_KEY" \
     http://localhost:9000/api/auth/keys | jq '.[] | .permissions'
   ```

2. Update permissions:
   ```bash
   curl -X PUT http://localhost:9000/api/auth/keys/key-id \
     -H "Content-Type: application/json" \
     -H "X-Admin-Key: $ADMIN_KEY" \
     -d '{"permissions": {"canSendMessages": true, "allowedRobots": [1,2,3,4,5,6,7]}}'
   ```

### Debug Mode

Enable detailed logging:

```bash
# Set debug environment variable
export DEBUG=robot-team-mcp:*
export LOG_LEVEL=debug

# Run with verbose logging
node build/index.js 2>&1 | tee mcp-debug.log
```

### Performance Issues

#### High Memory Usage

```bash
# Monitor memory usage
ps aux | grep node
top -p $(pgrep -f robot-team-mcp)

# Check for memory leaks
node --inspect build/index.js
# Use Chrome DevTools to analyze memory
```

#### Slow Response Times

```bash
# Check API response times
time curl -H "X-API-Key: $API_KEY" http://localhost:9000/api/robots/status

# Monitor with continuous ping
watch -n 1 'curl -w "%{time_total}s\n" -o /dev/null -s -H "X-API-Key: $API_KEY" http://localhost:9000/health'
```

## 🔧 Development & Customization

### Extending the MCP Server

#### Adding New Tools

1. **Define the tool in the server**:
```typescript
// In src/index.ts, add to tools array
{
  name: 'custom_tool',
  description: 'My custom tool',
  inputSchema: {
    type: 'object',
    properties: {
      parameter: {
        type: 'string',
        description: 'Tool parameter'
      }
    },
    required: ['parameter']
  }
}
```

2. **Implement the tool handler**:
```typescript
// Add to switch statement in CallToolRequestSchema handler
case 'custom_tool':
  return await this.customTool(request.params.arguments);
```

3. **Add the tool method**:
```typescript
private async customTool(args: any) {
  const { parameter } = args;
  
  // Your custom logic here
  const result = await this.performCustomAction(parameter);
  
  return {
    content: [{
      type: 'text',
      text: `Custom tool executed: ${result}`
    }]
  };
}
```

#### Custom Authentication

```typescript
// Add custom auth middleware
class CustomAuth {
  static validateApiKey(apiKey: string): boolean {
    // Your custom validation logic
    return apiKey.startsWith('custom_') && apiKey.length === 32;
  }
  
  static async getPermissions(apiKey: string): Promise<Permissions> {
    // Fetch permissions from custom source
    return await customPermissionStore.get(apiKey);
  }
}
```

#### Custom Error Handling

```typescript
// Enhanced error handling
private handleError(error: unknown): McpError {
  if (error instanceof CustomAPIError) {
    return new McpError(ErrorCode.InvalidRequest, error.message);
  }
  
  if (error instanceof NetworkError) {
    return new McpError(ErrorCode.InternalError, 'Network connectivity issue');
  }
  
  // Log unexpected errors
  console.error('Unexpected error:', error);
  return new McpError(ErrorCode.InternalError, 'An unexpected error occurred');
}
```

### Building from Source

```bash
# Development setup
git clone <repository>
cd robot-team/MCP/robot-team-server/robot-team-server

# Install dependencies
npm install

# Development with auto-reload
npm run watch

# Build for production
npm run build

# Run tests (if available)
npm test
```

### Contributing Guidelines

1. **Code Style**: Follow existing TypeScript patterns
2. **Error Handling**: Always use proper error types
3. **Documentation**: Update JSDoc comments
4. **Testing**: Add tests for new features
5. **Security**: Validate all inputs
6. **Performance**: Consider memory and CPU impact

## 📚 Additional Resources

### Official Documentation
- **[Robot Team API Documentation](../docs/api-documentation.md)** - Complete REST API reference
- **[MCP Client Handbook](./MCP-Client-Handbook.md)** - User guide for AI assistants
- **[Discord Setup Guide](../docs/Discord-Handoff.md)** - Discord bot configuration

### Community Resources
- **GitHub Issues** - Bug reports and feature requests
- **Discord Community** - Real-time support and discussions
- **Documentation Wiki** - Community-maintained guides

### Development Tools
- **MCP Inspector** - Debug MCP connections
- **Postman Collection** - API testing collection
- **Docker Images** - Pre-built deployment containers

## 🎯 Next Steps

After completing the MCP server setup:

1. **Test thoroughly** with multiple clients
2. **Document your deployment** for team reference
3. **Set up monitoring** and alerting
4. **Plan key rotation** schedule
5. **Train your users** with the Client Handbook
6. **Monitor usage** and optimize as needed

---

**🛠️ Need Support?** Check the troubleshooting section, review logs, or reach out to the Robot Team community for assistance with your MCP server deployment.

*This handbook is maintained by the Robot Team development team. Please contribute improvements and report issues.*
