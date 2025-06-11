# Robot Team API Documentation

## Overview

The Robot Team API provides a RESTful interface for interacting with the Discord Robot Team bot system. It allows external applications to send messages, schedule posts, and manage robot operations programmatically.

## Base URL

```
http://localhost:9000
```

## Authentication

All API endpoints (except health check and documentation) require authentication via API key.

### API Key Header
```http
X-API-Key: your-api-key-here
```

### Generating API Keys

```bash
# Generate a new API key
curl -X POST http://localhost:9000/api/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My App Key", "expiresIn": 30}'
```

## Rate Limiting

- **Global**: 100 requests per minute per API key
- **Messages**: 10 messages per minute per robot
- **Headers**: Rate limit information included in response headers

## Error Handling

All errors return JSON with consistent format:

```json
{
  "error": "Error Type",
  "message": "Human-readable error description",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Endpoints

### Health & Info

#### GET /health
Health check endpoint (no authentication required).

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### GET /api
API documentation endpoint (no authentication required).

```http
GET /api
```

**Response:**
```json
{
  "name": "Robot Team API",
  "version": "1.0.0",
  "description": "REST API for the Robot Team Discord bot system",
  "endpoints": {...},
  "authentication": "API Key required (X-API-Key header)",
  "rateLimit": {...}
}
```

### Robot Operations

#### GET /api/robots/status
Get status of all robots or a specific robot.

**Parameters:**
- `robotId` (query, optional): Robot ID (1-7)

```http
GET /api/robots/status
GET /api/robots/status?robotId=1
```

**Response (All Robots):**
```json
{
  "robots": [
    {
      "id": 1,
      "name": "DJZ Clone 1",
      "isActive": true,
      "hasWebhook": true,
      "isOnline": true,
      "activePosts": 3,
      "avatarUrl": "https://...",
      "lastUpdated": "2024-01-01T12:00:00.000Z"
    }
  ],
  "summary": {
    "total": 7,
    "active": 5,
    "online": 5,
    "totalActivePosts": 12
  }
}
```

**Response (Single Robot):**
```json
{
  "robot": {
    "id": 1,
    "name": "DJZ Clone 1",
    "isActive": true,
    "hasWebhook": true,
    "isOnline": true,
    "activePosts": 3,
    "avatarUrl": "https://...",
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

#### POST /api/robots/{robotId}/message
Send an immediate message as a robot.

**Path Parameters:**
- `robotId`: Robot ID (1-7)

**Body Parameters:**
- `content` (string, required*): Message content
- `title` (string, optional): Embed title
- `image` (string, optional): Image URL for embed
- `channelId` (string, optional): Channel ID (uses default if not specified)

*Either `content` or `title` is required.

```http
POST /api/robots/1/message
Content-Type: application/json
X-API-Key: your-api-key

{
  "content": "Hello from Robot 1!",
  "title": "Announcement",
  "image": "https://example.com/image.png"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "messageId": "1234567890",
    "robotId": 1,
    "content": "Hello from Robot 1!",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "url": "https://discord.com/channels/..."
  }
}
```

#### POST /api/robots/{robotId}/schedule
Schedule a message for a robot.

**Path Parameters:**
- `robotId`: Robot ID (1-7)

**Body Parameters:**
- `content` (string, required*): Message content
- `title` (string, optional): Embed title
- `image` (string, optional): Image URL for embed
- `when` (string, optional**): ISO 8601 date/time for one-time posts
- `cron` (string, optional**): Cron expression for recurring posts
- `recurring` (boolean, optional): Whether this is a recurring post
- `channelId` (string, optional): Channel ID

*Either `content` or `title` is required.
**Either `when` or `cron` is required.

```http
POST /api/robots/2/schedule
Content-Type: application/json
X-API-Key: your-api-key

{
  "content": "Daily reminder!",
  "title": "Daily Update",
  "recurring": true,
  "cron": "0 9 * * *"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message scheduled successfully",
  "data": {
    "scheduleId": "uuid-here",
    "robotId": 2,
    "content": "Daily reminder!",
    "scheduledFor": null,
    "cronExpression": "0 9 * * *",
    "isRecurring": true,
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### Schedule Management

#### GET /api/schedules
List scheduled posts with optional filtering.

**Query Parameters:**
- `robotId` (optional): Filter by robot ID
- `limit` (optional): Number of results (max 100, default 50)
- `offset` (optional): Pagination offset (default 0)
- `active` (optional): Filter by active status (true/false, default true)

```http
GET /api/schedules
GET /api/schedules?robotId=1&limit=10&active=true
```

**Response:**
```json
{
  "schedules": [
    {
      "id": "uuid-here",
      "robotId": 1,
      "robotName": "DJZ Clone 1",
      "content": "Scheduled message",
      "embedData": null,
      "scheduledFor": "2024-01-02T12:00:00.000Z",
      "cronExpression": null,
      "isRecurring": false,
      "isActive": true,
      "createdBy": "api:My App Key",
      "lastExecuted": null,
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

#### GET /api/schedules/{id}
Get specific scheduled post details.

**Path Parameters:**
- `id`: Schedule ID (UUID)

```http
GET /api/schedules/uuid-here
```

**Response:**
```json
{
  "schedule": {
    "id": "uuid-here",
    "robotId": 1,
    "robotName": "DJZ Clone 1",
    "content": "Scheduled message",
    "embedData": null,
    "scheduledFor": "2024-01-02T12:00:00.000Z",
    "cronExpression": null,
    "isRecurring": false,
    "isActive": true,
    "createdBy": "api:My App Key",
    "lastExecuted": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### DELETE /api/schedules/{id}
Cancel/delete a scheduled post.

**Path Parameters:**
- `id`: Schedule ID (UUID)

```http
DELETE /api/schedules/uuid-here
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled post cancelled successfully",
  "data": {
    "scheduleId": "uuid-here",
    "robotId": 1,
    "cancelledAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### PUT /api/schedules/{id}
Update a scheduled post.

**Path Parameters:**
- `id`: Schedule ID (UUID)

**Body Parameters:**
- `content` (string, optional): New message content
- `title` (string, optional): New embed title
- `image` (string, optional): New image URL
- `when` (string, optional): New schedule time (ISO 8601)
- `cron` (string, optional): New cron expression
- `recurring` (boolean, optional): Whether this should be recurring

```http
PUT /api/schedules/uuid-here
Content-Type: application/json
X-API-Key: your-api-key

{
  "content": "Updated message content",
  "when": "2024-01-03T15:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Scheduled post updated successfully",
  "data": {
    "scheduleId": "uuid-here",
    "robotId": 1,
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### API Key Management

#### POST /api/auth/keys
Generate a new API key (admin access required in production).

**Headers (Production):**
- `X-Admin-Key`: Admin key for key generation

**Body Parameters:**
- `name` (string, required): Descriptive name for the API key
- `permissions` (object, optional): Custom permissions object
- `expiresIn` (number, optional): Expiration in days (1-365)

```http
POST /api/auth/keys
Content-Type: application/json

{
  "name": "Integration App",
  "expiresIn": 90,
  "permissions": {
    "canSendMessages": true,
    "canSchedule": true,
    "canViewStatus": true,
    "allowedRobots": [1, 2, 3]
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key generated successfully",
  "data": {
    "apiKey": "rtk_1234567890abcdef...",
    "id": "uuid-here",
    "name": "Integration App",
    "permissions": {...},
    "expiresAt": "2024-04-01T12:00:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  },
  "warning": "Store this API key securely. It will not be shown again."
}
```

#### GET /api/auth/keys
List all API keys (admin access required).

```http
GET /api/auth/keys
X-Admin-Key: admin-key-here
```

#### DELETE /api/auth/keys/{id}
Revoke an API key (admin access required).

```http
DELETE /api/auth/keys/uuid-here
X-Admin-Key: admin-key-here
```

## Permissions

API keys have granular permissions:

- `canSendMessages`: Send immediate messages
- `canSchedule`: Create, update, and cancel scheduled posts
- `canViewStatus`: View robot status and scheduled posts
- `allowedRobots`: Array of robot IDs (1-7) the key can access

## Cron Expression Examples

```
0 9 * * *        # Daily at 9:00 AM
0 */6 * * *      # Every 6 hours
0 0 * * MON      # Every Monday at midnight
0 12 * * 1-5     # Weekdays at noon
0 0 1 * *        # First day of every month
*/15 * * * *     # Every 15 minutes
```

## Date/Time Format

Use ISO 8601 format for scheduling:
```
2024-12-25T15:30:00Z        # UTC time
2024-12-25T15:30:00-05:00   # EST time
```

## Example Workflows

### 1. Send Immediate Announcement

```bash
# Generate API key
curl -X POST http://localhost:9000/api/auth/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "Announcement Bot"}'

# Send message
curl -X POST http://localhost:9000/api/robots/1/message \
  -H "Content-Type: application/json" \
  -H "X-API-Key: rtk_your_key_here" \
  -d '{
    "title": "🚨 System Maintenance",
    "content": "Servers will be down for maintenance from 2-4 AM UTC.",
    "image": "https://example.com/maintenance.png"
  }'
```

### 2. Schedule Daily Reminders

```bash
# Schedule recurring daily reminder
curl -X POST http://localhost:9000/api/robots/2/schedule \
  -H "Content-Type: application/json" \
  -H "X-API-Key: rtk_your_key_here" \
  -d '{
    "title": "📅 Daily Standup",
    "content": "Don'\''t forget about the daily standup at 10 AM!",
    "recurring": true,
    "cron": "0 9 * * 1-5"
  }'
```

### 3. Manage Scheduled Posts

```bash
# List scheduled posts
curl -X GET "http://localhost:9000/api/schedules?robotId=2&limit=5" \
  -H "X-API-Key: rtk_your_key_here"

# Cancel a scheduled post
curl -X DELETE http://localhost:9000/api/schedules/uuid-here \
  -H "X-API-Key: rtk_your_key_here"
```

## Error Examples

### Authentication Error
```json
{
  "error": "Authentication Required",
  "message": "API key is required. Include it in the X-API-Key header.",
  "example": "X-API-Key: your-api-key-here"
}
```

### Rate Limit Error
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": "60 seconds"
}
```

### Validation Error
```json
{
  "error": "Invalid Robot ID",
  "message": "Robot ID must be between 1 and 7."
}
```

### Permission Error
```json
{
  "error": "Robot Access Denied",
  "message": "This API key does not have access to robot 5."
}
```

## SDKs and Libraries

### JavaScript/Node.js
```javascript
const RobotTeamClient = require('./examples/api-client.js');

const client = new RobotTeamClient('your-api-key');
await client.sendMessage(1, 'Hello World!');
```

### Python (Example)
```python
import requests

class RobotTeamClient:
    def __init__(self, api_key, base_url='http://localhost:9000'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
    
    def send_message(self, robot_id, content, title=None):
        url = f"{self.base_url}/api/robots/{robot_id}/message"
        data = {'content': content}
        if title:
            data['title'] = title
        
        response = requests.post(url, json=data, headers=self.headers)
        return response.json()

# Usage
client = RobotTeamClient('your-api-key')
result = client.send_message(1, 'Hello from Python!')
```

## Support and Troubleshooting

### Common Issues

1. **403 Forbidden**: Check API key permissions and robot access
2. **429 Rate Limited**: Reduce request frequency
3. **404 Robot Not Available**: Initialize robot with `/init-robot` command
4. **Invalid Cron**: Use https://crontab.guru to validate expressions

### Getting Help

- Check bot logs for detailed error information
- Use `/robot-status` Discord command to verify robot setup
- Test API connectivity with health check endpoint
- Verify API key permissions with `/api/auth/keys` endpoint

## Changelog

### v1.0.0
- Initial API release
- Robot message sending and scheduling
- API key authentication
- Rate limiting and security features
- Comprehensive documentation
