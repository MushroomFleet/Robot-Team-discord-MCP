# Robot Team System - User Handbook

## Table of Contents
1. [System Overview](#system-overview)
2. [Getting Started](#getting-started)
3. [Command Reference](#command-reference)
4. [Practical Examples](#practical-examples)
5. [Robot Personas & Best Practices](#robot-personas--best-practices)
6. [Scheduling Guide](#scheduling-guide)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Usage](#advanced-usage)

---

## System Overview

### What is the Robot Team System?

The Robot Team system is a Discord bot that manages **7 unique robot personas** (:one::robot: through :seven::robot:), each capable of posting scheduled content with rich embeds and individual personalities. Think of it as having 7 dedicated team members who can post messages on schedule or on demand.

### The 7 Robot Personas

Each robot has a unique identity and color scheme:

| Robot | Color | Hex Code | Suggested Use Cases |
|-------|-------|----------|-------------------|
| DJZ Clone 1 | Red | `#FF0000` | Alerts, Urgent Announcements, Critical Updates |
| DJZ Clone 2 | Green | `#00FF00` | Success Messages, Good News, Achievement Posts |
| DJZ Clone 3 | Blue | `#0099FF` | Information, General Announcements, Daily Updates |
| DJZ Clone 4 | Yellow | `#FFFF00` | Warnings, Reminders, Attention-Grabbing Content |
| DJZ Clone 5 | Magenta | `#FF00FF` | Creative Content, Special Events, Unique Announcements |
| DJZ Clone 6 | Cyan | `#00FFFF` | Technical Updates, System Messages, Process Info |
| DJZ Clone 7 | Orange | `#FFA500` | Community Posts, Social Content, Casual Updates |

### How It Works

- Each robot operates through its own **webhook** in your Discord channel
- Robots can post **immediately** or on **scheduled intervals**
- All posts support **rich embeds** with titles, images, and custom formatting
- The system tracks all posts and maintains a complete history
- Administrators can manage all robots from Discord using slash commands

---

## Getting Started

### Prerequisites

Before using the Robot Team system, ensure:

1. **Admin Permissions**: You need administrator permissions to initialize robots
2. **Bot Presence**: The Robot Team bot is active in your server
3. **Channel Access**: The bot has permission to manage webhooks in your target channel

### Initial Setup

#### Step 1: Check System Status
```
/robot-status
```
This shows you the current state of all 7 robots.

#### Step 2: Initialize Robots
For each robot you want to use, run:
```
/init-robot robot:1
/init-robot robot:2
/init-robot robot:3
/init-robot robot:4
/init-robot robot:5
/init-robot robot:6
/init-robot robot:7
```

**Note**: Run these commands in the channel where you want the robots to post.

#### Step 3: Verify Setup
```
/robot-status
```
All robots should now show:
- 🟢 Active status
- ✅ Webhook configured
- 0 Active posts (initially)

---

## Command Reference

### Administrative Commands

#### `/init-robot`
**Purpose**: Initialize a robot with a webhook in the current channel  
**Permissions**: Administrator only  
**Parameters**:
- `robot` (required): Robot number (1-7)
- `channel` (optional): Target channel (defaults to current)

**Example**:
```
/init-robot robot:1
/init-robot robot:3 channel:#announcements
```

#### `/robot-status`
**Purpose**: Check the status of robots  
**Permissions**: All users  
**Parameters**:
- `robot` (optional): Specific robot number (1-7)

**Examples**:
```
/robot-status                    # View all robots
/robot-status robot:2           # View Robot 2 only
```

### Posting Commands

#### `/robot-post`
**Purpose**: Send an immediate message as a robot  
**Permissions**: All users  
**Parameters**:
- `robot` (required): Robot number (1-7)
- `content` (required): Message content (max 2000 characters)
- `title` (optional): Embed title (max 256 characters)
- `image` (optional): Image URL for embed
- `thumbnail` (optional): Thumbnail URL for embed

**Examples**:
```
# Simple text message
/robot-post robot:1 content:"System maintenance complete!"

# Rich embed with title
/robot-post robot:2 content:"All systems are running smoothly." title:"✅ Status Update"

# Full embed with image
/robot-post robot:3 content:"Check out our latest features!" title:"🆕 New Release" image:"https://example.com/image.png"
```

### Scheduling Commands

#### `/schedule`
**Purpose**: Schedule a message for future posting  
**Permissions**: All users  
**Parameters**:
- `robot` (required): Robot number (1-7)
- `content` (required): Message content
- `when` (required): Schedule time (date/time or cron expression)
- `recurring` (optional): Whether this is a recurring post
- `title` (optional): Embed title
- `image` (optional): Image URL

**Examples**:
```
# One-time post
/schedule robot:1 content:"Meeting starts now!" when:"2024-12-15 14:00" recurring:false

# Daily recurring post
/schedule robot:3 content:"Daily standup in 15 minutes" when:"0 9 * * *" recurring:true title:"📅 Daily Reminder"

# Weekly report
/schedule robot:6 content:"Weekly metrics report is ready" when:"0 17 * * FRI" recurring:true title:"📊 Weekly Report"
```

#### `/schedule-list`
**Purpose**: View all scheduled posts  
**Permissions**: All users  
**Parameters**:
- `robot` (optional): Filter by specific robot

**Examples**:
```
/schedule-list                   # View all scheduled posts
/schedule-list robot:1          # View only Robot 1's posts
```

#### `/schedule-cancel`
**Purpose**: Cancel a scheduled post  
**Permissions**: All users  
**Parameters**:
- `post-id` (required): The ID of the scheduled post to cancel

**Example**:
```
/schedule-cancel post-id:a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Practical Examples

### Basic Robot Posting

#### Simple Announcement
```
/robot-post robot:3 content:"Server will be restarting in 10 minutes for updates."
```

#### Success Notification
```
/robot-post robot:2 content:"Deployment completed successfully! All services are online." title:"🚀 Deployment Complete"
```

#### Alert Message
```
/robot-post robot:1 content:"Critical: Database connection issues detected. Team has been notified." title:"🚨 System Alert"
```

### Rich Embed Examples

#### News Update with Image
```
/robot-post robot:5 content:"We're excited to announce our partnership with TechCorp! This collaboration will bring new features and improved performance to our platform." title:"🤝 Partnership Announcement" image:"https://example.com/partnership-banner.png"
```

#### Technical Update with Thumbnail
```
/robot-post robot:6 content:"API v2.1 is now live with improved rate limiting and better error responses. Check the documentation for details." title:"⚙️ API Update" thumbnail:"https://example.com/api-icon.png"
```

### Scheduling Scenarios

#### Daily Standup Reminder
```
/schedule robot:4 content:"Daily standup meeting starts in 15 minutes! Join the #standup voice channel." when:"0 9 * * 1-5" recurring:true title:"📅 Standup Reminder"
```

#### Weekly Team Meeting
```
/schedule robot:7 content:"Weekly team meeting today at 3 PM in Conference Room A. Agenda: Q4 planning, project updates, and team announcements." when:"0 15 * * WED" recurring:true title:"🏢 Weekly Team Meeting"
```

#### Monthly Report
```
/schedule robot:6 content:"Monthly performance report is available in the shared drive. Key metrics show 15% growth this month!" when:"0 9 1 * *" recurring:true title:"📈 Monthly Report"
```

#### One-time Event Reminder
```
/schedule robot:5 content:"Don't forget: Company holiday party tonight at 6 PM in the main lobby. Food, drinks, and prizes!" when:"2024-12-20 17:00" recurring:false title:"🎉 Holiday Party Tonight!"
```

---

## Robot Personas & Best Practices

### Robot Personality Guide

#### DJZ Clone 1 (Red) - The Alerter
- **Use for**: Critical alerts, system failures, urgent announcements
- **Tone**: Direct, urgent, action-required
- **Example content**: "URGENT: Payment system down", "Security breach detected"

#### DJZ Clone 2 (Green) - The Celebrator  
- **Use for**: Success stories, achievements, positive news
- **Tone**: Positive, encouraging, celebratory
- **Example content**: "Milestone reached!", "Bug fixed successfully"

#### DJZ Clone 3 (Blue) - The Informer
- **Use for**: General information, daily updates, neutral announcements
- **Tone**: Professional, informative, neutral
- **Example content**: "Daily metrics", "Schedule updates"

#### DJZ Clone 4 (Yellow) - The Warner
- **Use for**: Warnings, reminders, attention-needed items
- **Tone**: Cautionary, helpful, preventive
- **Example content**: "Maintenance window approaching", "Deadline reminder"

#### DJZ Clone 5 (Magenta) - The Creative
- **Use for**: Special events, creative content, unique announcements
- **Tone**: Creative, engaging, special
- **Example content**: "Creative showcase", "Special events"

#### DJZ Clone 6 (Cyan) - The Technical
- **Use for**: Technical updates, system information, developer content
- **Tone**: Technical, precise, detailed
- **Example content**: "API changes", "System architecture updates"

#### DJZ Clone 7 (Orange) - The Social
- **Use for**: Community content, social updates, casual communication
- **Tone**: Friendly, social, community-focused
- **Example content**: "Team building activities", "Casual updates"

### Content Guidelines

#### Message Content
- **Keep it concise**: Aim for clear, actionable messages
- **Use emojis**: Enhance readability and visual appeal
- **Be specific**: Include relevant details and next steps
- **Match the robot**: Use appropriate robot for the message type

#### Embed Best Practices
- **Titles**: Use clear, descriptive titles (max 256 characters)
- **Images**: Use high-quality, relevant images
- **Thumbnails**: Small icons or logos work best
- **Consistency**: Maintain consistent formatting across similar content types

---

## Scheduling Guide

### Time Formats

#### One-time Posts
Use standard date/time format:
```
YYYY-MM-DD HH:MM
```

Examples:
- `2024-12-15 09:30` (December 15, 2024 at 9:30 AM)
- `2024-01-01 00:00` (New Year's Day at midnight)

#### Recurring Posts (Cron Expressions)
Use cron syntax for recurring schedules:
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

### Common Cron Patterns

#### Daily Schedules
```
0 9 * * *          # Every day at 9:00 AM
0 17 * * *         # Every day at 5:00 PM
30 12 * * *        # Every day at 12:30 PM
```

#### Weekday Schedules
```
0 9 * * 1-5        # Weekdays at 9:00 AM
0 18 * * MON-FRI   # Weekdays at 6:00 PM
30 8 * * 1,2,3,4,5 # Weekdays at 8:30 AM
```

#### Weekly Schedules
```
0 10 * * MON       # Every Monday at 10:00 AM
0 15 * * WED       # Every Wednesday at 3:00 PM
0 14 * * FRI       # Every Friday at 2:00 PM
```

#### Monthly Schedules
```
0 9 1 * *          # First day of every month at 9:00 AM
0 17 15 * *        # 15th of every month at 5:00 PM
0 12 * * 1         # First Monday of every month at noon
```

#### Interval Schedules
```
0 */2 * * *        # Every 2 hours
*/30 * * * *       # Every 30 minutes
0 */6 * * *        # Every 6 hours (4 times daily)
```

### Scheduling Examples by Use Case

#### Development Team
```
# Daily standup reminder
/schedule robot:4 content:"Daily standup in 15 minutes!" when:"0 9 * * 1-5" recurring:true

# Weekly retrospective
/schedule robot:7 content:"Sprint retrospective today at 4 PM" when:"0 16 * * FRI" recurring:true

# Deployment notifications (manual trigger, not scheduled)
/robot-post robot:2 content:"Deployment to staging complete" title:"✅ Staging Deploy"
```

#### Operations Team
```
# System health check
/schedule robot:6 content:"Daily system health report available" when:"0 8 * * *" recurring:true

# Maintenance windows
/schedule robot:1 content:"Scheduled maintenance begins in 1 hour" when:"0 2 * * SUN" recurring:true

# Backup confirmations
/schedule robot:3 content:"Nightly backup completed successfully" when:"0 6 * * *" recurring:true
```

#### Marketing Team
```
# Social media reminders
/schedule robot:5 content:"Don't forget to schedule today's social media posts!" when:"0 9 * * 1-5" recurring:true

# Weekly metrics
/schedule robot:6 content:"Weekly marketing metrics report is ready for review" when:"0 10 * * MON" recurring:true

# Campaign launches
/robot-post robot:5 content:"New campaign goes live in 30 minutes!" title:"🚀 Campaign Launch"
```

---

## Troubleshooting

### Common Issues and Solutions

#### Robot Not Responding
**Problem**: Robot doesn't post when commanded  
**Solutions**:
1. Check robot status: `/robot-status robot:X`
2. Verify robot is initialized: Look for ✅ Webhook configured
3. Re-initialize if needed: `/init-robot robot:X`
4. Check bot permissions in the channel

#### Invalid Cron Expression
**Problem**: Error when scheduling recurring posts  
**Solutions**:
1. Verify cron syntax: Use online cron validators
2. Check common patterns in this handbook
3. Test with simple expressions first (e.g., `0 9 * * *`)

#### Scheduled Post Not Executing
**Problem**: Scheduled post doesn't appear at the expected time  
**Solutions**:
1. Check if post is active: `/schedule-list`
2. Verify time format is correct
3. Ensure future date/time for one-time posts
4. Check if robot webhook still exists

#### Permission Errors
**Problem**: Bot lacks permissions for certain actions  
**Solutions**:
1. Ensure bot has "Manage Webhooks" permission
2. Check channel permissions for the bot
3. Verify you have admin rights for robot initialization

### Error Messages and Meanings

#### "Robot X is not configured or inactive"
- **Meaning**: Robot hasn't been initialized or webhook is broken
- **Solution**: Run `/init-robot robot:X`

#### "Invalid cron expression"
- **Meaning**: The recurring schedule format is incorrect
- **Solution**: Check cron syntax or use date/time format instead

#### "Scheduled time must be in the future"
- **Meaning**: You're trying to schedule a post for a past date/time
- **Solution**: Use a future date/time

#### "No webhook found for robot X"
- **Meaning**: Robot's webhook was deleted or corrupted
- **Solution**: Re-initialize the robot

### Getting Help

If you encounter issues not covered here:

1. **Check robot status**: `/robot-status` for system overview
2. **Review recent changes**: Check if webhooks were accidentally deleted
3. **Test with simple commands**: Start with basic `/robot-post` commands
4. **Contact your administrator**: They can check bot logs and permissions

---

## Advanced Usage

### Multi-Robot Coordination

#### Escalation Sequences
Use multiple robots for escalating importance:

```
# Level 1: Information (Robot 3)
/robot-post robot:3 content:"Scheduled maintenance tonight 11 PM - 2 AM"

# Level 2: Warning (Robot 4) 
/schedule robot:4 content:"Maintenance begins in 2 hours" when:"2024-12-15 21:00"

# Level 3: Alert (Robot 1)
/schedule robot:1 content:"MAINTENANCE STARTING NOW - Services will be unavailable" when:"2024-12-15 23:00"
```

#### Themed Content Campaigns
Assign robots to different content themes:

```
# Technical updates (Robot 6)
/schedule robot:6 content:"API rate limits updated" when:"0 9 * * MON" recurring:true

# Community highlights (Robot 7)  
/schedule robot:7 content:"Community spotlight: This week's top contributors" when:"0 15 * * FRI" recurring:true

# Success stories (Robot 2)
/robot-post robot:2 content:"Q4 goals achieved ahead of schedule!" title:"🎯 Milestone Reached"
```

### Content Templates

#### Status Update Template
```
/robot-post robot:3 content:"**System Status**: All services operational
**Uptime**: 99.9%
**Response Time**: <100ms average
**Issues**: None reported" title:"📊 Daily Status Update"
```

#### Meeting Reminder Template
```
/schedule robot:4 content:"📅 **Upcoming Meeting**
**Time**: [TIME]
**Location**: [LOCATION]  
**Agenda**: [AGENDA_ITEMS]
**Attendees**: [TEAM_MEMBERS]" when:"[SCHEDULE]" recurring:true title:"Meeting Reminder"
```

#### Release Announcement Template
```
/robot-post robot:5 content:"🚀 **Version [X.Y.Z] Released!**

**New Features**:
• [Feature 1]
• [Feature 2]

**Bug Fixes**:
• [Fix 1]
• [Fix 2]

**Breaking Changes**: None

Full changelog: [URL]" title:"Release Notes" image:"[RELEASE_IMAGE_URL]"
```

### Advanced Scheduling Patterns

#### Business Hours Only
```
# Monday-Friday, 9 AM - 5 PM hourly reminders
0 9-17 * * 1-5
```

#### Multiple Daily Posts
```
# Three times daily: morning, lunch, evening
0 9,13,17 * * *
```

#### Quarterly Reports
```
# First Monday of January, April, July, October
0 9 1-7 1,4,7,10 1
```

#### Holiday Awareness
```
# Skip holidays by scheduling around them
# Example: Skip December 25th and January 1st
0 9 * * * && date != "2024-12-25" && date != "2024-01-01"
```

### Integration Strategies

#### Workflow Integration
1. **Development Pipeline**: 
   - Robot 6: Technical updates
   - Robot 2: Success notifications
   - Robot 1: Critical failures

2. **Customer Support**:
   - Robot 4: Maintenance warnings
   - Robot 3: Status updates
   - Robot 7: Community engagement

3. **Project Management**:
   - Robot 5: Milestone celebrations
   - Robot 4: Deadline reminders
   - Robot 6: Progress reports

#### Channel Organization
- **#alerts**: Robots 1, 4 for urgent content
- **#general**: Robots 2, 3, 7 for community content  
- **#technical**: Robot 6 for technical updates
- **#celebrations**: Robots 2, 5 for achievements

### Performance Tips

#### Optimal Posting Times
- **Announcements**: 9 AM for maximum visibility
- **Reminders**: 15-30 minutes before events
- **Status Updates**: End of day or start of day
- **Social Content**: Lunch time or early afternoon

#### Content Best Practices
- **Character Limits**: Keep embed titles under 200 characters
- **Image Sizes**: Use images under 8MB for faster loading
- **Update Frequency**: Avoid overwhelming channels with too many scheduled posts
- **Robot Distribution**: Spread content across different robots for visual variety

---

## Quick Reference

### Essential Commands
```bash
# Setup
/robot-status                    # Check all robots
/init-robot robot:1             # Initialize Robot 1

# Immediate posting
/robot-post robot:1 content:"Message"
/robot-post robot:2 content:"Message" title:"Title"

# Scheduling
/schedule robot:1 content:"Message" when:"2024-12-15 14:00"
/schedule robot:2 content:"Message" when:"0 9 * * *" recurring:true

# Management
/schedule-list                   # View scheduled posts
/schedule-cancel post-id:abc123  # Cancel a scheduled post
```

### Cron Quick Reference
```bash
0 9 * * *       # Daily at 9 AM
0 9 * * 1-5     # Weekdays at 9 AM  
0 9 * * MON     # Mondays at 9 AM
0 9 1 * *       # Monthly on 1st at 9 AM
0 */2 * * *     # Every 2 hours
*/30 * * * *    # Every 30 minutes
```

### Robot Color Reference
- DJZ Clone 1: Red `#FF0000` - Alerts & Urgent
- DJZ Clone 2: Green `#00FF00` - Success & Positive
- DJZ Clone 3: Blue `#0099FF` - Info & General
- DJZ Clone 4: Yellow `#FFFF00` - Warnings & Reminders  
- DJZ Clone 5: Magenta `#FF00FF` - Creative & Special
- DJZ Clone 6: Cyan `#00FFFF` - Technical & System
- DJZ Clone 7: Orange `#FFA500` - Social & Community

---

*This handbook covers the essential usage of the Robot Team system. For technical setup and development information, refer to the `robot-team-guide.md` documentation.*
