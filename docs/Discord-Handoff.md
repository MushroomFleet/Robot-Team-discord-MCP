# Discord Team Handoff Instructions

## Overview
These instructions are for the Discord team to create and configure the Discord application and bot for the Robot-Team system.

## Step 1: Create Discord Application

### 1.1 Access Developer Portal
1. Visit [Discord Developer Portal](https://discord.com/developers/applications)
2. Log in with your Discord account (must have developer access)
3. Click **"New Application"**
4. Name the application: **"Robot Team"**
5. Click **"Create"**

### 1.2 Configure Application
1. In the **General Information** tab:
   - Set application name: **"Robot Team"**
   - Add description: **"Discord bot system with 7 robot personas for scheduled posting"**
   - Upload app icon (optional - can use robot emoji initially)

## Step 2: Create Bot

### 2.1 Bot Creation
1. Navigate to the **"Bot"** tab in the left sidebar
2. Click **"Add Bot"**
3. Confirm by clicking **"Yes, do it!"**

### 2.2 Bot Configuration
1. **Bot Settings:**
   - Username: **"Robot-Team"**
   - Presence Intent: **Enabled**
   - Server Members Intent: **Enabled** 
   - Message Content Intent: **Enabled**

2. **Token Generation:**
   - Click **"Reset Token"** (if needed)
   - Copy the bot token immediately
   - **⚠️ CRITICAL: Store this token securely - never share publicly**

## Step 3: Configure Bot Permissions

### 3.1 Required Permissions
In the **Bot** tab, ensure the following permissions are enabled:

**Text Permissions:**
- ✅ Send Messages
- ✅ Send Messages in Threads  
- ✅ Embed Links
- ✅ Attach Files
- ✅ Read Message History
- ✅ Use Slash Commands
- ✅ Add Reactions

**Advanced Permissions:**
- ✅ Manage Webhooks (Critical for robot personas)
- ✅ Use External Emojis

### 3.2 Generate Invite URL
1. Go to **OAuth2 > URL Generator**
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions (same as above)
4. Copy the generated URL

## Step 4: Server Integration

### 4.1 Server Details
- **Server Name:** Scuffed Epoch Official
- **Server ID:** `1209627581037420614`

### 4.2 Bot Invitation
1. Use the generated invite URL from Step 3.2
2. Select **"Scuffed Epoch Official"** server
3. Confirm permissions
4. Complete authorization

### 4.3 Verify Installation
1. Check that **Robot-Team** bot appears in server member list
2. Verify bot has appropriate role permissions
3. Test bot can see and send messages in target channels

## Step 5: Information to Provide

### 5.1 Required Tokens/IDs
Please provide the development team with:

```
DISCORD_TOKEN=<bot_token_from_step_2.2>
CLIENT_ID=<application_id_from_general_info>
GUILD_ID=1209627581037420614
```

### 5.2 Application Information
- **Application ID:** Found in General Information tab
- **Bot Token:** From Step 2.2 (keep secure!)
- **Public Key:** Found in General Information tab

## Step 6: Role Configuration (Optional)

### 6.1 Create Bot Role
1. Go to Server Settings > Roles
2. Create new role: **"Robot Team Bot"**
3. Assign permissions:
   - Manage Webhooks
   - Send Messages
   - Use Slash Commands
   - Embed Links
4. Move role above @everyone but below admin roles
5. Assign role to Robot-Team bot

## Security Notes

⚠️ **IMPORTANT SECURITY GUIDELINES:**
- Never share the bot token publicly
- Store tokens in secure environment variables
- Regenerate token if compromised
- Limit bot permissions to minimum required
- Monitor bot activity regularly

## Testing Checklist

Before handoff completion, verify:
- [ ] Bot appears in server member list
- [ ] Bot can send messages in test channel
- [ ] Bot has "Manage Webhooks" permission
- [ ] All required tokens/IDs collected
- [ ] Permissions properly configured

## Support

If you encounter issues:
1. Check Discord Developer Documentation
2. Verify server permissions
3. Ensure bot is online in developer portal
4. Contact development team with specific error messages

---

**Completion Date:** ___________
**Completed By:** ___________
**Bot Token Provided:** [ ] Yes [ ] No
**Testing Completed:** [ ] Yes [ ] No
