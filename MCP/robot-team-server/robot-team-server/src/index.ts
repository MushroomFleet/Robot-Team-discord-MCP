#!/usr/bin/env node

/**
 * Robot Team MCP Server
 * 
 * This MCP server provides tools to interact with the Robot Team's REST API,
 * allowing external applications to:
 * - Send immediate messages through any of the 7 robots
 * - Schedule one-time or recurring messages
 * - Check robot status
 * - Manage scheduled posts
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  CallToolRequest,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from 'axios';

// Environment variables
const API_URL = process.env.ROBOT_TEAM_API_URL || 'http://localhost:9000';
const API_KEY = process.env.ROBOT_TEAM_API_KEY;
const ADMIN_KEY = process.env.ROBOT_TEAM_ADMIN_KEY;

if (!API_KEY) {
  throw new Error('ROBOT_TEAM_API_KEY environment variable is required');
}

// Robot configuration mapping
const ROBOT_COLORS = {
  1: { name: 'Robot 1', color: '#FF0000', emoji: ':one::robot:' },
  2: { name: 'Robot 2', color: '#00FF00', emoji: ':two::robot:' },
  3: { name: 'Robot 3', color: '#0099FF', emoji: ':three::robot:' },
  4: { name: 'Robot 4', color: '#FFFF00', emoji: ':four::robot:' },
  5: { name: 'Robot 5', color: '#FF00FF', emoji: ':five::robot:' },
  6: { name: 'Robot 6', color: '#00FFFF', emoji: ':six::robot:' },
  7: { name: 'Robot 7', color: '#FFA500', emoji: ':seven::robot:' },
};

// Type definitions
interface RobotStatus {
  id: number;
  name: string;
  isActive: boolean;
  hasWebhook: boolean;
  isOnline: boolean;
  activePosts: number;
  avatarUrl?: string;
  lastUpdated: string;
}

interface ScheduledMessage {
  id: string;
  robotId: number;
  robotName: string;
  content: string;
  embedData?: any;
  scheduledFor?: string;
  cronExpression?: string;
  isRecurring: boolean;
  isActive: boolean;
  createdBy: string;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

class RobotTeamServer {
  private server: Server;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: "robot-team-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Configure axios instance with authentication
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
      },
      timeout: 30000,
    });

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error: Error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'send_robot_message',
          description: 'Send an immediate message through one of the 7 Robot Team bots to Discord',
          inputSchema: {
            type: 'object',
            properties: {
              robotId: {
                type: 'number',
                description: 'Robot ID (1-7)',
                minimum: 1,
                maximum: 7,
              },
              content: {
                type: 'string',
                description: 'Message content (required if no title)',
              },
              title: {
                type: 'string',
                description: 'Embed title (optional)',
              },
              image: {
                type: 'string',
                description: 'Image URL for embed (optional)',
              },
              channelId: {
                type: 'string',
                description: 'Discord channel ID (optional, uses default if not specified)',
              },
            },
            required: ['robotId'],
          },
        },
        {
          name: 'schedule_robot_message',
          description: 'Schedule a message to be sent by a robot at a specific time or on a recurring schedule',
          inputSchema: {
            type: 'object',
            properties: {
              robotId: {
                type: 'number',
                description: 'Robot ID (1-7)',
                minimum: 1,
                maximum: 7,
              },
              content: {
                type: 'string',
                description: 'Message content (required if no title)',
              },
              title: {
                type: 'string',
                description: 'Embed title (optional)',
              },
              image: {
                type: 'string',
                description: 'Image URL for embed (optional)',
              },
              when: {
                type: 'string',
                description: 'ISO 8601 date/time for one-time posts (e.g., 2024-12-25T15:30:00Z)',
              },
              cron: {
                type: 'string',
                description: 'Cron expression for recurring posts (e.g., "0 9 * * *" for daily at 9 AM)',
              },
              recurring: {
                type: 'boolean',
                description: 'Whether this is a recurring post',
              },
              channelId: {
                type: 'string',
                description: 'Discord channel ID (optional)',
              },
            },
            required: ['robotId'],
          },
        },
        {
          name: 'get_robot_status',
          description: 'Check the status of all robots or a specific robot',
          inputSchema: {
            type: 'object',
            properties: {
              robotId: {
                type: 'number',
                description: 'Specific robot ID to check (1-7). If omitted, returns status for all robots',
                minimum: 1,
                maximum: 7,
              },
            },
          },
        },
        {
          name: 'list_scheduled_messages',
          description: 'List scheduled messages with optional filtering',
          inputSchema: {
            type: 'object',
            properties: {
              robotId: {
                type: 'number',
                description: 'Filter by robot ID (1-7)',
                minimum: 1,
                maximum: 7,
              },
              limit: {
                type: 'number',
                description: 'Number of results (max 100, default 50)',
                minimum: 1,
                maximum: 100,
              },
              offset: {
                type: 'number',
                description: 'Pagination offset (default 0)',
                minimum: 0,
              },
              active: {
                type: 'boolean',
                description: 'Filter by active status (default true)',
              },
            },
          },
        },
        {
          name: 'cancel_scheduled_message',
          description: 'Cancel/delete a scheduled message',
          inputSchema: {
            type: 'object',
            properties: {
              scheduleId: {
                type: 'string',
                description: 'Schedule ID (UUID) to cancel',
              },
            },
            required: ['scheduleId'],
          },
        },
        {
          name: 'generate_api_key',
          description: 'Generate a new API key for Robot Team access (requires admin privileges)',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Descriptive name for the API key',
              },
              expiresIn: {
                type: 'number',
                description: 'Expiration in days (1-365)',
                minimum: 1,
                maximum: 365,
              },
              allowedRobots: {
                type: 'array',
                description: 'Array of robot IDs (1-7) the key can access',
                items: {
                  type: 'number',
                  minimum: 1,
                  maximum: 7,
                },
              },
            },
            required: ['name'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      try {
        switch (request.params.name) {
          case 'send_robot_message':
            return await this.sendRobotMessage(request.params.arguments);
          
          case 'schedule_robot_message':
            return await this.scheduleRobotMessage(request.params.arguments);
          
          case 'get_robot_status':
            return await this.getRobotStatus(request.params.arguments);
          
          case 'list_scheduled_messages':
            return await this.listScheduledMessages(request.params.arguments);
          
          case 'cancel_scheduled_message':
            return await this.cancelScheduledMessage(request.params.arguments);
          
          case 'generate_api_key':
            return await this.generateApiKey(request.params.arguments);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.message || error.message;
          
          throw new McpError(
            status === 401 ? ErrorCode.InvalidRequest : ErrorCode.InternalError,
            `Robot Team API error: ${message}`
          );
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async sendRobotMessage(args: any) {
    const { robotId, content, title, image, channelId } = args;
    
    if (!robotId || robotId < 1 || robotId > 7) {
      throw new McpError(ErrorCode.InvalidParams, 'Robot ID must be between 1 and 7');
    }

    if (!content && !title) {
      throw new McpError(ErrorCode.InvalidParams, 'Either content or title is required');
    }

    const payload: any = {};
    if (content) payload.content = content;
    if (title) payload.title = title;
    if (image) payload.image = image;
    if (channelId) payload.channelId = channelId;

    const response = await this.axiosInstance.post(`/api/robots/${robotId}/message`, payload);
    
    const robotInfo = ROBOT_COLORS[robotId as keyof typeof ROBOT_COLORS];
    
    return {
      content: [{
        type: 'text',
        text: `✅ Message sent successfully via ${robotInfo.emoji} ${robotInfo.name}!\n\n` +
              `📍 Message ID: ${response.data.data.messageId}\n` +
              `🕐 Sent at: ${response.data.data.timestamp}\n` +
              `🔗 URL: ${response.data.data.url || 'N/A'}\n\n` +
              `💬 Content: ${content || 'N/A'}\n` +
              `🏷️ Title: ${title || 'N/A'}`
      }]
    };
  }

  private async scheduleRobotMessage(args: any) {
    const { robotId, content, title, image, when, cron, recurring, channelId } = args;
    
    if (!robotId || robotId < 1 || robotId > 7) {
      throw new McpError(ErrorCode.InvalidParams, 'Robot ID must be between 1 and 7');
    }

    if (!content && !title) {
      throw new McpError(ErrorCode.InvalidParams, 'Either content or title is required');
    }

    if (!when && !cron) {
      throw new McpError(ErrorCode.InvalidParams, 'Either when (ISO 8601 date) or cron expression is required');
    }

    const payload: any = {};
    if (content) payload.content = content;
    if (title) payload.title = title;
    if (image) payload.image = image;
    if (when) payload.when = when;
    if (cron) payload.cron = cron;
    if (recurring !== undefined) payload.recurring = recurring;
    if (channelId) payload.channelId = channelId;

    const response = await this.axiosInstance.post(`/api/robots/${robotId}/schedule`, payload);
    
    const robotInfo = ROBOT_COLORS[robotId as keyof typeof ROBOT_COLORS];
    const scheduleType = recurring ? 'Recurring' : 'One-time';
    const scheduleInfo = cron ? `Cron: ${cron}` : `Time: ${when}`;
    
    return {
      content: [{
        type: 'text',
        text: `📅 ${scheduleType} message scheduled successfully via ${robotInfo.emoji} ${robotInfo.name}!\n\n` +
              `🆔 Schedule ID: ${response.data.data.scheduleId}\n` +
              `⏰ ${scheduleInfo}\n` +
              `🔄 Recurring: ${recurring ? 'Yes' : 'No'}\n` +
              `🕐 Created at: ${response.data.data.createdAt}\n\n` +
              `💬 Content: ${content || 'N/A'}\n` +
              `🏷️ Title: ${title || 'N/A'}`
      }]
    };
  }

  private async getRobotStatus(args: any) {
    const { robotId } = args;
    
    const params = robotId ? { robotId } : {};
    const response = await this.axiosInstance.get('/api/robots/status', { params });
    
    if (robotId) {
      // Single robot status
      const robot: RobotStatus = response.data.robot;
      const robotInfo = ROBOT_COLORS[robotId as keyof typeof ROBOT_COLORS];
      
      return {
        content: [{
          type: 'text',
          text: `🤖 ${robotInfo.emoji} ${robotInfo.name} Status\n\n` +
                `🟢 Active: ${robot.isActive ? 'Yes' : 'No'}\n` +
                `🔗 Webhook: ${robot.hasWebhook ? 'Configured' : 'Not configured'}\n` +
                `📡 Online: ${robot.isOnline ? 'Yes' : 'No'}\n` +
                `📊 Active Posts: ${robot.activePosts}\n` +
                `🕐 Last Updated: ${robot.lastUpdated}\n` +
                `🎨 Color: ${robotInfo.color}`
        }]
      };
    } else {
      // All robots status
      const robots: RobotStatus[] = response.data.robots;
      const summary = response.data.summary;
      
      let statusText = `🤖 Robot Team Status Summary\n\n`;
      statusText += `📊 Total Robots: ${summary.total}\n`;
      statusText += `🟢 Active: ${summary.active}\n`;
      statusText += `📡 Online: ${summary.online}\n`;
      statusText += `📝 Total Active Posts: ${summary.totalActivePosts}\n\n`;
      statusText += `📋 Individual Robot Status:\n\n`;
      
      robots.forEach(robot => {
        const robotInfo = ROBOT_COLORS[robot.id as keyof typeof ROBOT_COLORS];
        const status = robot.isActive && robot.isOnline ? '🟢' : '🔴';
        statusText += `${status} ${robotInfo.emoji} ${robotInfo.name}: `;
        statusText += `${robot.isActive ? 'Active' : 'Inactive'}, `;
        statusText += `${robot.hasWebhook ? 'Webhook OK' : 'No Webhook'}, `;
        statusText += `${robot.activePosts} posts\n`;
      });
      
      return {
        content: [{
          type: 'text',
          text: statusText
        }]
      };
    }
  }

  private async listScheduledMessages(args: any) {
    const { robotId, limit = 50, offset = 0, active = true } = args;
    
    const params: any = { limit, offset, active };
    if (robotId) params.robotId = robotId;
    
    const response = await this.axiosInstance.get('/api/schedules', { params });
    
    const schedules: ScheduledMessage[] = response.data.schedules;
    const pagination = response.data.pagination;
    
    if (schedules.length === 0) {
      return {
        content: [{
          type: 'text',
          text: '📭 No scheduled messages found with the specified criteria.'
        }]
      };
    }
    
    let resultText = `📅 Scheduled Messages\n\n`;
    resultText += `📊 Showing ${schedules.length} of ${pagination.total} total messages\n`;
    if (robotId) {
      const robotInfo = ROBOT_COLORS[robotId as keyof typeof ROBOT_COLORS];
      resultText += `🤖 Filtered by: ${robotInfo.emoji} ${robotInfo.name}\n`;
    }
    resultText += `\n`;
    
    schedules.forEach((schedule, index) => {
      const robotInfo = ROBOT_COLORS[schedule.robotId as keyof typeof ROBOT_COLORS];
      const scheduleType = schedule.isRecurring ? '🔄 Recurring' : '⏰ One-time';
      const scheduleInfo = schedule.cronExpression 
        ? `Cron: ${schedule.cronExpression}` 
        : `Time: ${schedule.scheduledFor}`;
      
      resultText += `${index + 1}. ${robotInfo.emoji} ${schedule.robotName}\n`;
      resultText += `   🆔 ID: ${schedule.id}\n`;
      resultText += `   ${scheduleType} - ${scheduleInfo}\n`;
      resultText += `   💬 "${schedule.content || schedule.embedData?.title || 'No content'}"\n`;
      resultText += `   🕐 Created: ${schedule.createdAt}\n`;
      if (schedule.lastExecuted) {
        resultText += `   ✅ Last executed: ${schedule.lastExecuted}\n`;
      }
      resultText += `\n`;
    });
    
    if (pagination.hasMore) {
      resultText += `📄 Use offset ${pagination.offset + pagination.limit} to see more results.`;
    }
    
    return {
      content: [{
        type: 'text',
        text: resultText
      }]
    };
  }

  private async cancelScheduledMessage(args: any) {
    const { scheduleId } = args;
    
    if (!scheduleId) {
      throw new McpError(ErrorCode.InvalidParams, 'Schedule ID is required');
    }
    
    const response = await this.axiosInstance.delete(`/api/schedules/${scheduleId}`);
    
    return {
      content: [{
        type: 'text',
        text: `✅ Scheduled message cancelled successfully!\n\n` +
              `🆔 Schedule ID: ${response.data.data.scheduleId}\n` +
              `🤖 Robot ID: ${response.data.data.robotId}\n` +
              `🕐 Cancelled at: ${response.data.data.cancelledAt}`
      }]
    };
  }

  private async generateApiKey(args: any) {
    if (!ADMIN_KEY) {
      throw new McpError(
        ErrorCode.InvalidRequest, 
        'Admin key not configured. Set ROBOT_TEAM_ADMIN_KEY environment variable.'
      );
    }
    
    const { name, expiresIn, allowedRobots } = args;
    
    if (!name) {
      throw new McpError(ErrorCode.InvalidParams, 'API key name is required');
    }
    
    const payload: any = { name };
    if (expiresIn) payload.expiresIn = expiresIn;
    if (allowedRobots && allowedRobots.length > 0) {
      payload.permissions = {
        canSendMessages: true,
        canSchedule: true,
        canViewStatus: true,
        allowedRobots: allowedRobots
      };
    }
    
    // Use admin key for this request
    const adminAxios = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': ADMIN_KEY,
      },
    });
    
    const response = await adminAxios.post('/api/auth/keys', payload);
    
    return {
      content: [{
        type: 'text',
        text: `🔑 API Key Generated Successfully!\n\n` +
              `📝 Name: ${response.data.data.name}\n` +
              `🆔 ID: ${response.data.data.id}\n` +
              `🗝️ API Key: ${response.data.data.apiKey}\n` +
              `⏰ Expires: ${response.data.data.expiresAt}\n` +
              `🕐 Created: ${response.data.data.createdAt}\n\n` +
              `⚠️ WARNING: Store this API key securely. It will not be shown again.\n\n` +
              `💡 Use this key in the X-API-Key header for Robot Team API requests.`
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Robot Team MCP server running on stdio');
  }
}

// Start the server
const server = new RobotTeamServer();
server.run().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
