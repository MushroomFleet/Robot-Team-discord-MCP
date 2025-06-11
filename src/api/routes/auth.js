const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { ApiKey } = require('../../models');

/**
 * POST /api/auth/keys
 * Generate a new API key (admin only - no auth required for bootstrap)
 */
router.post('/keys', async (req, res) => {
  try {
    const { name, permissions, expiresIn } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: 'Missing Name',
        message: 'API key name is required.'
      });
    }
    
    // Generate a random API key
    const apiKey = `rtk_${uuidv4().replace(/-/g, '')}`;
    
    // Hash the key for storage
    const keyHash = await bcrypt.hash(apiKey, 10);
    
    // Set expiration if provided
    let expiresAt = null;
    if (expiresIn) {
      const days = parseInt(expiresIn);
      if (days > 0 && days <= 365) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);
      }
    }
    
    // Default permissions
    const defaultPermissions = {
      canSendMessages: true,
      canSchedule: true,
      canViewStatus: true,
      allowedRobots: [1, 2, 3, 4, 5, 6, 7]
    };
    
    // Create API key record
    const apiKeyRecord = await ApiKey.create({
      keyHash,
      name,
      permissions: permissions || defaultPermissions,
      expiresAt,
      createdBy: 'admin'
    });
    
    res.json({
      success: true,
      message: 'API key generated successfully',
      data: {
        apiKey, // Only return the actual key once, during creation
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        permissions: apiKeyRecord.permissions,
        expiresAt: apiKeyRecord.expiresAt,
        createdAt: apiKeyRecord.createdAt
      },
      warning: 'Store this API key securely. It will not be shown again.'
    });
    
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to generate API key.'
    });
  }
});

/**
 * GET /api/auth/keys
 * List all API keys (admin only - basic auth for now)
 */
router.get('/keys', async (req, res) => {
  try {
    // Simple admin check - in production you'd want proper admin auth
    const adminKey = req.get('X-Admin-Key');
    if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        error: 'Admin Access Required',
        message: 'Admin key required to list API keys.'
      });
    }
    
    const apiKeys = await ApiKey.findAll({
      attributes: ['id', 'name', 'permissions', 'isActive', 'lastUsed', 'expiresAt', 'createdBy', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      apiKeys: apiKeys.map(key => ({
        id: key.id,
        name: key.name,
        permissions: key.permissions,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        expiresAt: key.expiresAt,
        createdBy: key.createdBy,
        createdAt: key.createdAt,
        isExpired: key.expiresAt ? new Date() > key.expiresAt : false
      }))
    });
    
  } catch (error) {
    console.error('Error listing API keys:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to list API keys.'
    });
  }
});

/**
 * DELETE /api/auth/keys/{id}
 * Revoke an API key
 */
router.delete('/keys/:id', async (req, res) => {
  try {
    // Simple admin check
    const adminKey = req.get('X-Admin-Key');
    if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        error: 'Admin Access Required',
        message: 'Admin key required to revoke API keys.'
      });
    }
    
    const keyId = req.params.id;
    
    const apiKey = await ApiKey.findByPk(keyId);
    if (!apiKey) {
      return res.status(404).json({
        error: 'API Key Not Found',
        message: 'The specified API key was not found.'
      });
    }
    
    await apiKey.update({ isActive: false });
    
    res.json({
      success: true,
      message: 'API key revoked successfully',
      data: {
        id: keyId,
        name: apiKey.name,
        revokedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error revoking API key:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to revoke API key.'
    });
  }
});

/**
 * PUT /api/auth/keys/{id}
 * Update API key permissions
 */
router.put('/keys/:id', async (req, res) => {
  try {
    // Simple admin check
    const adminKey = req.get('X-Admin-Key');
    if (adminKey !== process.env.ADMIN_KEY && process.env.NODE_ENV === 'production') {
      return res.status(401).json({
        error: 'Admin Access Required',
        message: 'Admin key required to update API keys.'
      });
    }
    
    const keyId = req.params.id;
    const { name, permissions, isActive } = req.body;
    
    const apiKey = await ApiKey.findByPk(keyId);
    if (!apiKey) {
      return res.status(404).json({
        error: 'API Key Not Found',
        message: 'The specified API key was not found.'
      });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    await apiKey.update(updateData);
    
    res.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        id: keyId,
        name: apiKey.name,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        updatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({
      error: 'Server Error',
      message: 'Failed to update API key.'
    });
  }
});

module.exports = router;
