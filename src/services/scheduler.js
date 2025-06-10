const cron = require('node-cron');
const { ScheduledPost, PostHistory, Robot } = require('../models');
const RobotEmbedBuilder = require('../utils/embedBuilder');

class SchedulerService {
  constructor(webhookService) {
    this.webhookService = webhookService;
    this.jobs = new Map();
  }

  async initializeScheduledJobs() {
    try {
      const activePosts = await ScheduledPost.findAll({
        where: { isActive: true },
        include: [Robot]
      });

      for (const post of activePosts) {
        if (post.isRecurring && post.cronExpression) {
          this.scheduleRecurringPost(post);
        } else if (post.scheduledFor && post.scheduledFor > new Date()) {
          this.scheduleOneTimePost(post);
        }
      }

      console.log(`⏰ Initialized ${this.jobs.size} scheduled jobs`);
    } catch (error) {
      console.error('❌ Error initializing scheduled jobs:', error);
    }
  }

  scheduleRecurringPost(scheduledPost) {
    if (!cron.validate(scheduledPost.cronExpression)) {
      console.error(`❌ Invalid cron expression: ${scheduledPost.cronExpression}`);
      return;
    }

    const job = cron.schedule(
      scheduledPost.cronExpression,
      async () => {
        await this.executePost(scheduledPost);
      },
      {
        scheduled: true,
        timezone: 'UTC'
      }
    );

    this.jobs.set(scheduledPost.id, { type: 'cron', job });
    console.log(`🔄 Scheduled recurring post ${scheduledPost.id} with cron: ${scheduledPost.cronExpression}`);
  }

  scheduleOneTimePost(scheduledPost) {
    const now = new Date();
    const scheduledTime = new Date(scheduledPost.scheduledFor);
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.log(`⚡ Post ${scheduledPost.id} is past due, executing immediately`);
      this.executePost(scheduledPost);
      return;
    }

    const timeout = setTimeout(async () => {
      await this.executePost(scheduledPost);
      // Deactivate one-time posts after execution
      await scheduledPost.update({ isActive: false });
      this.jobs.delete(scheduledPost.id);
    }, delay);

    this.jobs.set(scheduledPost.id, { type: 'timeout', timeout });
    console.log(`⏰ Scheduled one-time post ${scheduledPost.id} for ${scheduledTime.toISOString()}`);
  }

  async executePost(scheduledPost) {
    const startTime = new Date();
    let success = false;
    let errorMessage = null;
    let messageId = null;

    try {
      console.log(`🚀 Executing post ${scheduledPost.id} for robot ${scheduledPost.robotId}`);

      const embedBuilder = new RobotEmbedBuilder(scheduledPost.robotId);
      let embeds = [];

      if (scheduledPost.embedData) {
        embeds.push(embedBuilder.createStandardEmbed(scheduledPost.embedData));
      }

      const message = await this.webhookService.sendMessage(scheduledPost.robotId, {
        content: scheduledPost.content,
        embeds: embeds.length > 0 ? embeds : undefined
      });

      messageId = message.id;
      success = true;

      // Update last executed time
      await scheduledPost.update({ lastExecuted: startTime });
      console.log(`✅ Successfully executed post ${scheduledPost.id}`);

    } catch (error) {
      console.error(`❌ Failed to execute post ${scheduledPost.id}:`, error);
      errorMessage = error.message;
    }

    // Log execution history
    try {
      await PostHistory.create({
        scheduledPostId: scheduledPost.id,
        robotId: scheduledPost.robotId,
        channelId: scheduledPost.channelId,
        messageId,
        executedAt: startTime,
        success,
        errorMessage
      });
    } catch (historyError) {
      console.error('❌ Failed to log post history:', historyError);
    }
  }

  async addScheduledPost(postData) {
    try {
      const scheduledPost = await ScheduledPost.create(postData);

      if (postData.isRecurring && postData.cronExpression) {
        this.scheduleRecurringPost(scheduledPost);
      } else if (postData.scheduledFor) {
        this.scheduleOneTimePost(scheduledPost);
      }

      console.log(`📅 Added scheduled post ${scheduledPost.id} for robot ${postData.robotId}`);
      return scheduledPost;
    } catch (error) {
      console.error('❌ Failed to add scheduled post:', error);
      throw error;
    }
  }

  cancelJob(postId) {
    const jobData = this.jobs.get(postId);
    if (jobData) {
      if (jobData.type === 'timeout') {
        clearTimeout(jobData.timeout);
      } else if (jobData.type === 'cron') {
        jobData.job.destroy();
      }
      this.jobs.delete(postId);
      console.log(`🗑️ Cancelled job for post ${postId}`);
      return true;
    }
    return false;
  }

  async reschedulePost(postId, newSchedule) {
    try {
      this.cancelJob(postId);
      
      const scheduledPost = await ScheduledPost.findByPk(postId);
      if (!scheduledPost) {
        throw new Error('Scheduled post not found');
      }

      await scheduledPost.update(newSchedule);

      if (newSchedule.isRecurring && newSchedule.cronExpression) {
        this.scheduleRecurringPost(scheduledPost);
      } else if (newSchedule.scheduledFor) {
        this.scheduleOneTimePost(scheduledPost);
      }

      console.log(`🔄 Rescheduled post ${postId}`);
      return scheduledPost;
    } catch (error) {
      console.error(`❌ Failed to reschedule post ${postId}:`, error);
      throw error;
    }
  }

  async deleteScheduledPost(postId) {
    try {
      this.cancelJob(postId);
      
      const scheduledPost = await ScheduledPost.findByPk(postId);
      if (!scheduledPost) {
        throw new Error('Scheduled post not found');
      }

      await scheduledPost.update({ isActive: false });
      console.log(`🗑️ Deleted scheduled post ${postId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete scheduled post ${postId}:`, error);
      throw error;
    }
  }

  getJobCount() {
    return this.jobs.size;
  }

  getActiveJobs() {
    const jobs = [];
    for (const [postId, jobData] of this.jobs.entries()) {
      jobs.push({
        postId,
        type: jobData.type,
        scheduled: jobData.type === 'timeout' ? 'one-time' : 'recurring'
      });
    }
    return jobs;
  }

  async getPostHistory(robotId = null, limit = 10) {
    try {
      const whereClause = {};
      if (robotId) whereClause.robotId = robotId;

      const history = await PostHistory.findAll({
        where: whereClause,
        include: [ScheduledPost],
        order: [['executedAt', 'DESC']],
        limit
      });

      return history;
    } catch (error) {
      console.error('❌ Failed to get post history:', error);
      throw error;
    }
  }

  async getFailedPosts(hours = 24) {
    try {
      const sinceTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
      
      const failedPosts = await PostHistory.findAll({
        where: {
          success: false,
          executedAt: {
            [require('sequelize').Op.gte]: sinceTime
          }
        },
        include: [ScheduledPost],
        order: [['executedAt', 'DESC']]
      });

      return failedPosts;
    } catch (error) {
      console.error('❌ Failed to get failed posts:', error);
      throw error;
    }
  }

  // Health check method
  async performHealthCheck() {
    try {
      const stats = {
        activeJobs: this.jobs.size,
        webhooksActive: this.webhookService.getWebhookCount(),
        recentFailures: 0,
        lastCheck: new Date()
      };

      // Count recent failures (last 24 hours)
      const failedPosts = await this.getFailedPosts(24);
      stats.recentFailures = failedPosts.length;

      if (stats.recentFailures > 5) {
        console.warn(`⚠️ High failure rate: ${stats.recentFailures} failed posts in last 24 hours`);
      }

      return stats;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return null;
    }
  }
}

module.exports = SchedulerService;
