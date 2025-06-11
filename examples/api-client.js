/**
 * Example API Client for Robot Team Bot
 * This demonstrates how to interact with the Robot Team API
 */

const API_BASE_URL = 'http://localhost:9000';
const API_KEY = 'your-api-key-here'; // Replace with actual API key

class RobotTeamClient {
  constructor(apiKey, baseUrl = API_BASE_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(`API Error ${response.status}: ${data.message || data.error}`);
      }
      
      return data;
    } catch (error) {
      console.error(`Request failed to ${endpoint}:`, error.message);
      throw error;
    }
  }

  // Robot operations
  async getRobotStatus(robotId = null) {
    const endpoint = robotId ? `/api/robots/status?robotId=${robotId}` : '/api/robots/status';
    return this.makeRequest(endpoint);
  }

  async sendMessage(robotId, content, options = {}) {
    return this.makeRequest(`/api/robots/${robotId}/message`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        title: options.title,
        image: options.image,
        channelId: options.channelId
      })
    });
  }

  async scheduleMessage(robotId, content, when, options = {}) {
    return this.makeRequest(`/api/robots/${robotId}/schedule`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        title: options.title,
        image: options.image,
        when,
        recurring: options.recurring,
        cron: options.cron,
        channelId: options.channelId
      })
    });
  }

  // Schedule operations
  async getSchedules(options = {}) {
    const params = new URLSearchParams();
    if (options.robotId) params.append('robotId', options.robotId);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    if (options.active !== undefined) params.append('active', options.active);

    const endpoint = `/api/schedules${params.toString() ? '?' + params.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  async getSchedule(scheduleId) {
    return this.makeRequest(`/api/schedules/${scheduleId}`);
  }

  async cancelSchedule(scheduleId) {
    return this.makeRequest(`/api/schedules/${scheduleId}`, {
      method: 'DELETE'
    });
  }

  async updateSchedule(scheduleId, updates) {
    return this.makeRequest(`/api/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  // Utility methods
  async healthCheck() {
    return this.makeRequest('/health');
  }

  async getApiInfo() {
    return this.makeRequest('/api');
  }
}

// Example usage
async function examples() {
  const client = new RobotTeamClient(API_KEY);

  try {
    console.log('🚀 Robot Team API Client Examples\n');

    // 1. Check API health
    console.log('📊 Health Check:');
    const health = await client.healthCheck();
    console.log(health);

    // 2. Get robot status
    console.log('\n🤖 Robot Status:');
    const status = await client.getRobotStatus();
    console.log(status);

    // 3. Send immediate message
    console.log('\n📤 Sending immediate message...');
    const message = await client.sendMessage(1, 'Hello from the API!', {
      title: 'API Test Message'
    });
    console.log(message);

    // 4. Schedule a message for tomorrow
    console.log('\n⏰ Scheduling message...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0); // Noon tomorrow

    const scheduled = await client.scheduleMessage(
      2, 
      'This is a scheduled message from the API!',
      tomorrow.toISOString(),
      { title: 'Scheduled Test' }
    );
    console.log(scheduled);

    // 5. Schedule recurring daily message
    console.log('\n🔄 Scheduling recurring message...');
    const recurring = await client.scheduleMessage(
      3,
      'Daily reminder from Robot 3!',
      null,
      {
        recurring: true,
        cron: '0 9 * * *', // 9 AM every day
        title: 'Daily Reminder'
      }
    );
    console.log(recurring);

    // 6. List scheduled posts
    console.log('\n📅 Scheduled Posts:');
    const schedules = await client.getSchedules({ limit: 10 });
    console.log(schedules);

    // 7. Get specific robot status
    console.log('\n🤖 Robot 1 Status:');
    const robot1Status = await client.getRobotStatus(1);
    console.log(robot1Status);

  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Utility function to generate API key (for admin use)
async function generateApiKey(name = 'Test Key') {
  const response = await fetch(`${API_BASE_URL}/api/auth/keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      expiresIn: 30 // 30 days
    })
  });

  const result = await response.json();
  
  if (response.ok) {
    console.log('🔑 Generated API Key:');
    console.log(`Key: ${result.data.apiKey}`);
    console.log(`Name: ${result.data.name}`);
    console.log(`ID: ${result.data.id}`);
    console.log('\n⚠️ Store this key securely - it will not be shown again!');
    return result.data.apiKey;
  } else {
    console.error('❌ Failed to generate API key:', result.message);
    throw new Error(result.message);
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'examples':
      examples();
      break;
    case 'generate-key':
      const keyName = process.argv[3] || 'CLI Generated Key';
      generateApiKey(keyName);
      break;
    case 'test':
      // Quick API test
      const testClient = new RobotTeamClient(process.argv[3] || API_KEY);
      testClient.healthCheck()
        .then(result => console.log('✅ API is healthy:', result))
        .catch(error => console.error('❌ API test failed:', error.message));
      break;
    default:
      console.log(`
🤖 Robot Team API Client

Usage:
  node api-client.js examples          - Run example operations
  node api-client.js generate-key [name] - Generate a new API key  
  node api-client.js test [api-key]    - Test API connection

Before running examples, make sure to:
1. Start the Robot Team bot (npm start)
2. Generate an API key
3. Update the API_KEY constant in this file
      `);
  }
}

module.exports = RobotTeamClient;
