const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../data/database.sqlite'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false
});

// Robot configuration model
const Robot = sequelize.define('Robot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    validate: { min: 1, max: 7 }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  webhookId: DataTypes.STRING,
  webhookToken: DataTypes.STRING,
  avatarUrl: DataTypes.STRING,
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  config: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'robots',
  timestamps: true
});

// Scheduled posts model
const ScheduledPost = sequelize.define('ScheduledPost', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  robotId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Robot,
      key: 'id'
    }
  },
  channelId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: DataTypes.TEXT,
  embedData: DataTypes.JSON,
  scheduledFor: DataTypes.DATE,
  cronExpression: DataTypes.STRING,
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdBy: DataTypes.STRING,
  lastExecuted: DataTypes.DATE
}, {
  tableName: 'scheduled_posts',
  timestamps: true
});

// Post history model
const PostHistory = sequelize.define('PostHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  scheduledPostId: {
    type: DataTypes.UUID,
    references: {
      model: ScheduledPost,
      key: 'id'
    }
  },
  robotId: DataTypes.INTEGER,
  channelId: DataTypes.STRING,
  messageId: DataTypes.STRING,
  executedAt: DataTypes.DATE,
  success: DataTypes.BOOLEAN,
  errorMessage: DataTypes.TEXT
}, {
  tableName: 'post_history',
  timestamps: true
});

// API Keys model
const ApiKey = sequelize.define('ApiKey', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  keyHash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      canSendMessages: true,
      canSchedule: true,
      canViewStatus: true,
      allowedRobots: [1, 2, 3, 4, 5, 6, 7]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastUsed: DataTypes.DATE,
  createdBy: DataTypes.STRING,
  expiresAt: DataTypes.DATE
}, {
  tableName: 'api_keys',
  timestamps: true
});

// Define associations
Robot.hasMany(ScheduledPost, { foreignKey: 'robotId' });
ScheduledPost.belongsTo(Robot, { foreignKey: 'robotId' });
ScheduledPost.hasMany(PostHistory, { foreignKey: 'scheduledPostId' });
PostHistory.belongsTo(ScheduledPost, { foreignKey: 'scheduledPostId' });

module.exports = {
  sequelize,
  Robot,
  ScheduledPost,
  PostHistory,
  ApiKey
};
