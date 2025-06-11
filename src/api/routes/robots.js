const express = require('express');
const router = express.Router();
const { requirePermission, requireRobotAccess } = require('../middleware/auth');
const { Robot, ScheduledPost } = require('../../models');
const RobotEmbedBuilder = require('../../utils/embedBuilder');

/**
 * GET /api/robots/status
 * Get status of all robots or a specific robot
 */
router.get('/status', requirePermission('canViewStatus'), async (req, res) => {
  try {
    const robotId = req.query.robotId ? parseInt(req.query.robotId) : null;
    
    if (robotId) {
      // Get specific robot status
      if (robotId < 1 || robotId > 7) {
        return res.status(400).json({
          error: 'Invalid Robot ID',
          message: 'Robot ID must be between 1 and 7.'
        });
      }
      
      const robot = await Robot.findByPk(robotId);
      const activePosts = await ScheduledPost.count({
        where: { robotId, isActive: true }
      });
      
      const isOnline = req.webhookService.getWebhook(robotId) !== undefined;
      
      res.json({
        robot: {
          id: robotId,
          name: robot?.name || `Robot ${robotId}`,
          isActive: robot?.isActive || false,
          hasWebhook: !!robot?.webhookId,
          isOnline,
          activePosts,
          avatarUrl: robot?.avatarUrl,
          lastUpdated: robot?.updatedAt
        }
      });
    } else {
      // Get all robots status
      const robots = await Robot.findAll({
        order: [['id', 'ASC']]
      });
      
      const robotStatuses = [];
      
      for (let i = 1; i <= 7; i++) {
        const robot = robots.find(r => r.id === i);
        const activePosts = await ScheduledPost.count({
          where: { robotId: i, isActive: true }
        });
        
        const isOnline = req.webhookService.getWebhook(i) !== undefined;
        
        robotStatuses.push({
          id: i,
          name: robot?.name || `Robot ${i}`,
          isActive: robot?.isActive || false,
          hasWebhook: !!robot?.webhookId,
          isOnline,
          activePosts,
          avatarUrl: robot?.avatarUrl,
          lastUpdated: robot?.updatedAt
        });
      }
      
      res.json({
        robots: robotStatuses,
        summary: {
          total: 7,
          active: robotStatuses.filter(r => r.isActive).length,
          online: robotStatuses.filter(r => r.isOnline).length,
          totalActivePosts: robotStatuses.reduce((sum, r) => sum + r.activePosts, 0)
        }
      });
    }
  } catch (error) {
    console.error('Error getting robot status:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve robot status.'
    });
  }
});

/**
 * POST /api/robots/{robotId}/message
 * Send immediate message as a robot
 */
router.post('/:robotId/message', 
  requirePermission('canSendMessages'),
  requireRobotAccess,
  async (req, res) => {
    try {
      const robotId = parseInt(req.params.robotId);
      const { content, title, image, channelId } = req.body;
      
      // Validate input
      if (!content && !title) {
        return res.status(400).json({
          error: 'Missing Content',
          message: 'Either content or title is required.'
        });
      }
      
      if (content && content.length > 2000) {
        return res.status(400).json({
          error: 'Content Too Long',
          message: 'Content must be 2000 characters or less.'
        });
      }
      
      // Check if robot is available
      const webhook = req.webhookService.getWebhook(robotId);
      if (!webhook) {
        return res.status(404).json({
          error: 'Robot Not Available',
          message: `Robot ${robotId} is not initialized or offline.`
        });
      }
      
      // Prepare message options
      const messageOptions = {
        content: title ? undefined : content
      };
      
      // Create embed if title or image provided
      if (title || image) {
        const embedBuilder = new RobotEmbedBuilder(robotId);
        messageOptions.embeds = [embedBuilder.createStandardEmbed({
          title,
          description: title ? content : undefined,
          image
        })];
      }
      
      // Send the message
      const message = await req.webhookService.sendMessage(robotId, messageOptions);
      
      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: message.id,
          robotId,
          content: content || title,
          timestamp: message.createdAt,
          url: message.url
        }
      });
      
    } catch (error) {
      console.error('Error sending robot message:', error);
      
      // Check for Discord rate limit errors
      if (error.code === 429) {
        res.status(429).json({
          error: 'Rate Limited',
          message: 'Discord rate limit reached. Please try again later.',
          retryAfter: error.retry_after
        });
      } else {
        res.status(500).json({
          error: 'Message Send Failed',
          message: 'Failed to send message. Please try again.'
        });
      }
    }
  }
);

/**
 * POST /api/robots/{robotId}/schedule
 * Schedule a message for a robot
 */
router.post('/:robotId/schedule',
  requirePermission('canSchedule'),
  requireRobotAccess,
  async (req, res) => {
    try {
      const robotId = parseInt(req.params.robotId);
      const { content, title, image, when, recurring, cron, channelId } = req.body;
      
      // Validate input
      if (!content && !title) {
        return res.status(400).json({
          error: 'Missing Content',
          message: 'Either content or title is required.'
        });
      }
      
      if (!when && !cron) {
        return res.status(400).json({
          error: 'Missing Schedule',
          message: 'Either "when" (date/time) or "cron" expression is required.'
        });
      }
      
      let scheduledFor = null;
      let cronExpression = null;
      
      if (recurring && cron) {
        // Validate cron expression
        const cronValidator = require('node-cron');
        if (!cronValidator.validate(cron)) {
          return res.status(400).json({
            error: 'Invalid Cron Expression',
            message: 'The provided cron expression is invalid.'
          });
        }
        cronExpression = cron;
      } else if (when) {
        // Parse date/time
        scheduledFor = new Date(when);
        if (isNaN(scheduledFor.getTime())) {
          return res.status(400).json({
            error: 'Invalid Date',
            message: 'Invalid date format. Use ISO 8601 format (e.g., "2024-12-25T15:30:00Z").'
          });
        }
        if (scheduledFor <= new Date()) {
          return res.status(400).json({
            error: 'Past Date',
            message: 'Scheduled time must be in the future.'
          });
        }
      }
      
      // Create embed data if title or image provided
      let embedData = null;
      if (title || image) {
        embedData = {
          title,
          description: title ? content : undefined,
          image
        };
      }
      
      // Create scheduled post
      const scheduledPost = await req.schedulerService.addScheduledPost({
        robotId,
        channelId: channelId || process.env.DEFAULT_CHANNEL_ID,
        content: embedData ? undefined : content,
        embedData,
        scheduledFor,
        cronExpression,
        isRecurring: recurring || false,
        createdBy: `api:${req.apiKey.name}`
      });
      
      res.json({
        success: true,
        message: 'Message scheduled successfully',
        data: {
          scheduleId: scheduledPost.id,
          robotId,
          content: content || title,
          scheduledFor,
          cronExpression,
          isRecurring: recurring || false,
          createdAt: scheduledPost.createdAt
        }
      });
      
    } catch (error) {
      console.error('Error scheduling robot message:', error);
      res.status(500).json({
        error: 'Schedule Failed',
        message: 'Failed to schedule message. Please try again.'
      });
    }
  }
);

module.exports = router;
