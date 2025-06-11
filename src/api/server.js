const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Import routes
const robotRoutes = require('./routes/robots');
const scheduleRoutes = require('./routes/schedules');
const authRoutes = require('./routes/auth');

// Import middleware
const { authMiddleware } = require('./middleware/auth');
const { logRequest } = require('./middleware/logging');

class ApiServer {
  constructor(webhookService, schedulerService) {
    this.app = express();
    this.webhookService = webhookService;
    this.schedulerService = schedulerService;
    this.server = null;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(logRequest);

    // Global rate limiting
    const globalLimiter = rateLimit({
      windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW) || 60000, // 1 minute
      max: parseInt(process.env.API_RATE_LIMIT_MAX) || 100, // 100 requests per window
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: '60 seconds'
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => req.get('X-API-Key') || req.ip
    });

    this.app.use('/api', globalLimiter);

    // Message-specific rate limiting
    const messageLimiter = rateLimit({
      windowMs: 60000, // 1 minute
      max: 10, // 10 messages per minute per robot
      message: {
        error: 'Message rate limit exceeded',
        message: 'Too many messages sent. Please slow down.',
        retryAfter: '60 seconds'
      },
      keyGenerator: (req) => `${req.get('X-API-Key') || req.ip}:${req.params.robotId}`
    });

    this.app.use('/api/robots/:robotId/message', messageLimiter);

    // Pass services to routes
    this.app.use((req, res, next) => {
      req.webhookService = this.webhookService;
      req.schedulerService = this.schedulerService;
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API documentation
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Robot Team API',
        version: '1.0.0',
        description: 'REST API for the Robot Team Discord bot system',
        endpoints: {
          'POST /api/robots/{robotId}/message': 'Send immediate message',
          'POST /api/robots/{robotId}/schedule': 'Schedule a message',
          'GET /api/robots/status': 'Get robot status',
          'GET /api/schedules': 'List scheduled posts',
          'DELETE /api/schedules/{id}': 'Cancel scheduled post',
          'POST /api/auth/keys': 'Generate API key (admin)',
          'DELETE /api/auth/keys/{id}': 'Revoke API key (admin)'
        },
        authentication: 'API Key required (X-API-Key header)',
        rateLimit: {
          global: '100 requests per minute',
          messages: '10 messages per minute per robot'
        }
      });
    });

    // Protected API routes
    this.app.use('/api/robots', authMiddleware, robotRoutes);
    this.app.use('/api/schedules', authMiddleware, scheduleRoutes);
    this.app.use('/api/auth', authRoutes);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
        availableEndpoints: '/api'
      });
    });
  }

  setupErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('API Error:', error);
      
      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        error: error.name || 'Internal Server Error',
        message: error.message || 'An unexpected error occurred',
        ...(isDevelopment && { stack: error.stack }),
        timestamp: new Date().toISOString()
      });
    });
  }

  start(port = 9000) {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`🌐 API Server running on port ${port}`);
          console.log(`📖 API Documentation: http://localhost:${port}/api`);
          console.log(`💚 Health Check: http://localhost:${port}/health`);
          resolve(this.server);
        }
      });
    });
  }

  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = ApiServer;
