const bcrypt = require('bcryptjs');
const { ApiKey } = require('../../models');

/**
 * Authentication middleware for API routes
 * Validates API keys and sets permissions on request object
 */
async function authMiddleware(req, res, next) {
  try {
    const apiKey = req.get('X-API-Key');
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: 'API key is required. Include it in the X-API-Key header.',
        example: 'X-API-Key: your-api-key-here'
      });
    }

    // Find API key in database (we store hashed keys for security)
    const apiKeys = await ApiKey.findAll({
      where: { isActive: true }
    });

    let validKey = null;
    for (const key of apiKeys) {
      if (await bcrypt.compare(apiKey, key.keyHash)) {
        validKey = key;
        break;
      }
    }

    if (!validKey) {
      return res.status(401).json({
        error: 'Invalid API Key',
        message: 'The provided API key is invalid or has been revoked.'
      });
    }

    // Check if key has expired
    if (validKey.expiresAt && new Date() > validKey.expiresAt) {
      return res.status(401).json({
        error: 'API Key Expired',
        message: 'The provided API key has expired.'
      });
    }

    // Update last used timestamp
    await validKey.update({ lastUsed: new Date() });

    // Attach API key info and permissions to request
    req.apiKey = {
      id: validKey.id,
      name: validKey.name,
      permissions: validKey.permissions
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication Error',
      message: 'An error occurred while validating your API key.'
    });
  }
}

/**
 * Check if the API key has a specific permission
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.apiKey || !req.apiKey.permissions[permission]) {
      return res.status(403).json({
        error: 'Insufficient Permissions',
        message: `This API key does not have permission: ${permission}`
      });
    }
    next();
  };
}

/**
 * Check if the API key can access a specific robot
 */
function requireRobotAccess(req, res, next) {
  const robotId = parseInt(req.params.robotId);
  
  if (!robotId || robotId < 1 || robotId > 7) {
    return res.status(400).json({
      error: 'Invalid Robot ID',
      message: 'Robot ID must be between 1 and 7.'
    });
  }

  const allowedRobots = req.apiKey.permissions.allowedRobots || [];
  
  if (!allowedRobots.includes(robotId)) {
    return res.status(403).json({
      error: 'Robot Access Denied',
      message: `This API key does not have access to robot ${robotId}.`
    });
  }

  next();
}

module.exports = {
  authMiddleware,
  requirePermission,
  requireRobotAccess
};
