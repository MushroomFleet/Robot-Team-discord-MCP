const { WebhookClient } = require('discord.js');
const { Robot } = require('../models');

class WebhookService {
  constructor() {
    this.webhooks = new Map();
    this.robotNames = {
      1: ':one::robot:',
      2: ':two::robot:',
      3: ':three::robot:',
      4: ':four::robot:',
      5: ':five::robot:',
      6: ':six::robot:',
      7: ':seven::robot:'
    };
  }

  getRobotName(robotId) {
    return this.robotNames[robotId] || `:${robotId}::robot:`;
  }

  async initializeWebhooks() {
    try {
      const robots = await Robot.findAll();
      
      for (const robot of robots) {
        if (robot.webhookId && robot.webhookToken) {
          this.webhooks.set(robot.id, new WebhookClient({
            id: robot.webhookId,
            token: robot.webhookToken
          }));
          console.log(`✅ Webhook initialized for Robot ${robot.id}`);
        }
      }
      
      console.log(`📡 Initialized ${this.webhooks.size} webhooks`);
    } catch (error) {
      console.error('❌ Error initializing webhooks:', error);
    }
  }

  async createWebhookForRobot(client, channelId, robotId) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel) {
        throw new Error('Channel not found');
      }

      // Check if robot already has a webhook
      const existingRobot = await Robot.findByPk(robotId);
      if (existingRobot && existingRobot.webhookId) {
        throw new Error(`Robot ${robotId} already has a webhook configured`);
      }

      const robotName = this.getRobotName(robotId);
      
      const webhook = await channel.createWebhook({
        name: robotName,
        reason: `Robot ${robotId} webhook creation`
      });

      // Save webhook details to database
      await Robot.upsert({
        id: robotId,
        name: robotName,
        webhookId: webhook.id,
        webhookToken: webhook.token,
        avatarUrl: webhook.avatarURL(),
        isActive: true
      });

      // Add to memory cache
      this.webhooks.set(robotId, new WebhookClient({
        id: webhook.id,
        token: webhook.token
      }));

      console.log(`✅ Created webhook for Robot ${robotId} in ${channel.name}`);
      return webhook;
    } catch (error) {
      console.error(`❌ Failed to create webhook for robot ${robotId}:`, error);
      throw error;
    }
  }

  getWebhook(robotId) {
    return this.webhooks.get(robotId);
  }

  async sendMessage(robotId, options) {
    const webhook = this.getWebhook(robotId);
    if (!webhook) {
      throw new Error(`No webhook found for robot ${robotId}. Please initialize the robot first.`);
    }

    try {
      const robot = await Robot.findByPk(robotId);
      
      const robotName = this.getRobotName(robotId);
      
      const message = await webhook.send({
        username: robotName,
        avatarURL: robot?.avatarUrl || options.avatarURL,
        content: options.content,
        embeds: options.embeds,
        files: options.files
      });

      console.log(`📤 Robot ${robotId} sent message: ${message.id}`);
      return message;
    } catch (error) {
      console.error(`❌ Failed to send message via robot ${robotId}:`, error);
      throw error;
    }
  }

  async deleteWebhook(robotId) {
    try {
      const webhook = this.getWebhook(robotId);
      if (webhook) {
        await webhook.delete();
        this.webhooks.delete(robotId);
      }

      // Update database
      await Robot.update(
        { 
          webhookId: null, 
          webhookToken: null, 
          avatarUrl: null,
          isActive: false 
        },
        { where: { id: robotId } }
      );

      console.log(`🗑️ Deleted webhook for Robot ${robotId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete webhook for robot ${robotId}:`, error);
      throw error;
    }
  }

  async testWebhook(robotId) {
    try {
      const webhook = this.getWebhook(robotId);
      if (!webhook) {
        return { success: false, error: 'Webhook not found' };
      }

      const robotName = this.getRobotName(robotId);
      
      // Try to send a test message
      await webhook.send({
        username: robotName,
        content: `🧪 Test message from Robot ${robotId}`,
        embeds: [{
          title: 'Webhook Test',
          description: 'This is a test message to verify webhook functionality.',
          color: 0x00FF00,
          timestamp: new Date().toISOString(),
          footer: { text: `Robot ${robotId} Test` }
        }]
      });

      return { success: true };
    } catch (error) {
      console.error(`❌ Webhook test failed for robot ${robotId}:`, error);
      return { success: false, error: error.message };
    }
  }

  getWebhookCount() {
    return this.webhooks.size;
  }

  getActiveRobots() {
    return Array.from(this.webhooks.keys());
  }

  async refreshWebhook(robotId) {
    try {
      const robot = await Robot.findByPk(robotId);
      if (!robot || !robot.webhookId || !robot.webhookToken) {
        throw new Error('Robot webhook data not found in database');
      }

      // Remove old webhook from cache
      this.webhooks.delete(robotId);

      // Create new webhook client
      const webhookClient = new WebhookClient({
        id: robot.webhookId,
        token: robot.webhookToken
      });

      // Test the webhook
      try {
        await webhookClient.fetchMessage('@original');
      } catch (error) {
        // If webhook is invalid, mark robot as inactive
        await robot.update({ isActive: false });
        throw new Error('Webhook is no longer valid');
      }

      // Add back to cache
      this.webhooks.set(robotId, webhookClient);
      console.log(`🔄 Refreshed webhook for Robot ${robotId}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to refresh webhook for robot ${robotId}:`, error);
      throw error;
    }
  }
}

module.exports = WebhookService;
