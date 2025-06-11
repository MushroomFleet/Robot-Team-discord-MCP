const express = require('express');
const router = express.Router();
const { requirePermission } = require('../middleware/auth');
const { ScheduledPost, Robot } = require('../../models');

/**
 * GET /api/schedules
 * List scheduled posts with optional filtering
 */
router.get('/', requirePermission('canViewStatus'), async (req, res) => {
  try {
    const { robotId, limit = 50, offset = 0, active = true } = req.query;
    
    // Build where clause
    const where = {};
    
    if (active !== undefined) {
      where.isActive = active === 'true';
    }
    
    if (robotId) {
      const id = parseInt(robotId);
      if (id < 1 || id > 7) {
        return res.status(400).json({
          error: 'Invalid Robot ID',
          message: 'Robot ID must be between 1 and 7.'
        });
      }
      where.robotId = id;
    }
    
    // Check robot access permissions
    const allowedRobots = req.apiKey.permissions.allowedRobots || [];
    if (robotId && !allowedRobots.includes(parseInt(robotId))) {
      return res.status(403).json({
        error: 'Robot Access Denied',
        message: `This API key does not have access to robot ${robotId}.`
      });
    }
    
    // If no specific robot requested, filter by allowed robots
    if (!robotId && allowedRobots.length < 7) {
      where.robotId = allowedRobots;
    }
    
    const scheduledPosts = await ScheduledPost.findAndCountAll({
      where,
      include: [Robot],
      order: [['scheduledFor', 'ASC'], ['createdAt', 'ASC']],
      limit: Math.min(parseInt(limit), 100), // Max 100 results
      offset: parseInt(offset)
    });
    
    const formattedPosts = scheduledPosts.rows.map(post => ({
      id: post.id,
      robotId: post.robotId,
      robotName: post.Robot?.name || `Robot ${post.robotId}`,
      content: post.content || 'Rich embed content',
      embedData: post.embedData,
      scheduledFor: post.scheduledFor,
      cronExpression: post.cronExpression,
      isRecurring: post.isRecurring,
      isActive: post.isActive,
      createdBy: post.createdBy,
      lastExecuted: post.lastExecuted,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
    
    res.json({
      schedules: formattedPosts,
      pagination: {
        total: scheduledPosts.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < scheduledPosts.count
      }
    });
    
  } catch (error) {
    console.error('Error listing schedules:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve scheduled posts.'
    });
  }
});

/**
 * GET /api/schedules/{id}
 * Get specific scheduled post details
 */
router.get('/:id', requirePermission('canViewStatus'), async (req, res) => {
  try {
    const scheduleId = req.params.id;
    
    const scheduledPost = await ScheduledPost.findByPk(scheduleId, {
      include: [Robot]
    });
    
    if (!scheduledPost) {
      return res.status(404).json({
        error: 'Schedule Not Found',
        message: 'The requested scheduled post was not found.'
      });
    }
    
    // Check robot access permissions
    const allowedRobots = req.apiKey.permissions.allowedRobots || [];
    if (!allowedRobots.includes(scheduledPost.robotId)) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'This API key does not have access to this scheduled post.'
      });
    }
    
    res.json({
      schedule: {
        id: scheduledPost.id,
        robotId: scheduledPost.robotId,
        robotName: scheduledPost.Robot?.name || `Robot ${scheduledPost.robotId}`,
        content: scheduledPost.content,
        embedData: scheduledPost.embedData,
        scheduledFor: scheduledPost.scheduledFor,
        cronExpression: scheduledPost.cronExpression,
        isRecurring: scheduledPost.isRecurring,
        isActive: scheduledPost.isActive,
        createdBy: scheduledPost.createdBy,
        lastExecuted: scheduledPost.lastExecuted,
        createdAt: scheduledPost.createdAt,
        updatedAt: scheduledPost.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error getting schedule:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to retrieve scheduled post.'
    });
  }
});

/**
 * DELETE /api/schedules/{id}
 * Cancel/delete a scheduled post
 */
router.delete('/:id', requirePermission('canSchedule'), async (req, res) => {
  try {
    const scheduleId = req.params.id;
    
    const scheduledPost = await ScheduledPost.findByPk(scheduleId);
    
    if (!scheduledPost) {
      return res.status(404).json({
        error: 'Schedule Not Found',
        message: 'The requested scheduled post was not found.'
      });
    }
    
    // Check robot access permissions
    const allowedRobots = req.apiKey.permissions.allowedRobots || [];
    if (!allowedRobots.includes(scheduledPost.robotId)) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'This API key does not have access to this scheduled post.'
      });
    }
    
    if (!scheduledPost.isActive) {
      return res.status(400).json({
        error: 'Already Inactive',
        message: 'This scheduled post is already inactive.'
      });
    }
    
    // Cancel the job in scheduler
    const cancelled = req.schedulerService.cancelJob(scheduleId);
    
    // Deactivate in database
    await scheduledPost.update({ 
      isActive: false,
      updatedAt: new Date()
    });
    
    res.json({
      success: true,
      message: 'Scheduled post cancelled successfully',
      data: {
        scheduleId,
        robotId: scheduledPost.robotId,
        cancelledAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error cancelling schedule:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to cancel scheduled post.'
    });
  }
});

/**
 * PUT /api/schedules/{id}
 * Update a scheduled post
 */
router.put('/:id', requirePermission('canSchedule'), async (req, res) => {
  try {
    const scheduleId = req.params.id;
    const { content, title, image, when, cron, recurring } = req.body;
    
    const scheduledPost = await ScheduledPost.findByPk(scheduleId);
    
    if (!scheduledPost) {
      return res.status(404).json({
        error: 'Schedule Not Found',
        message: 'The requested scheduled post was not found.'
      });
    }
    
    // Check robot access permissions
    const allowedRobots = req.apiKey.permissions.allowedRobots || [];
    if (!allowedRobots.includes(scheduledPost.robotId)) {
      return res.status(403).json({
        error: 'Access Denied',
        message: 'This API key does not have access to this scheduled post.'
      });
    }
    
    // Prepare update data
    const updateData = {};
    
    if (content !== undefined || title !== undefined) {
      if (title || image) {
        updateData.embedData = {
          title,
          description: title ? content : undefined,
          image
        };
        updateData.content = null;
      } else {
        updateData.content = content;
        updateData.embedData = null;
      }
    }
    
    if (when !== undefined || cron !== undefined) {
      if (recurring && cron) {
        const cronValidator = require('node-cron');
        if (!cronValidator.validate(cron)) {
          return res.status(400).json({
            error: 'Invalid Cron Expression',
            message: 'The provided cron expression is invalid.'
          });
        }
        updateData.cronExpression = cron;
        updateData.scheduledFor = null;
        updateData.isRecurring = true;
      } else if (when) {
        const scheduledFor = new Date(when);
        if (isNaN(scheduledFor.getTime())) {
          return res.status(400).json({
            error: 'Invalid Date',
            message: 'Invalid date format. Use ISO 8601 format.'
          });
        }
        if (scheduledFor <= new Date()) {
          return res.status(400).json({
            error: 'Past Date',
            message: 'Scheduled time must be in the future.'
          });
        }
        updateData.scheduledFor = scheduledFor;
        updateData.cronExpression = null;
        updateData.isRecurring = false;
      }
    }
    
    // Update the scheduled post
    await scheduledPost.update(updateData);
    
    // Reschedule the job
    if (updateData.scheduledFor !== undefined || updateData.cronExpression !== undefined) {
      await req.schedulerService.reschedulePost(scheduleId, updateData);
    }
    
    res.json({
      success: true,
      message: 'Scheduled post updated successfully',
      data: {
        scheduleId,
        robotId: scheduledPost.robotId,
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update scheduled post.'
    });
  }
});

module.exports = router;
