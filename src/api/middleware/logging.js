/**
 * Request logging middleware for API
 */
function logRequest(req, res, next) {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  // Log the incoming request
  console.log(`📨 ${timestamp} ${req.method} ${req.path} - ${req.ip}`);
  
  // Log API key info (without exposing the actual key)
  const apiKey = req.get('X-API-Key');
  if (apiKey) {
    const maskedKey = apiKey.substring(0, 8) + '*'.repeat(Math.max(0, apiKey.length - 8));
    console.log(`🔑 API Key: ${maskedKey}`);
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '🔴' : '🟢';
    
    console.log(`📤 ${statusColor} ${res.statusCode} ${req.method} ${req.path} - ${duration}ms`);
    
    // Log error responses for debugging
    if (res.statusCode >= 400 && data.error) {
      console.log(`❌ Error: ${data.error} - ${data.message}`);
    }
    
    return originalJson.call(this, data);
  };

  next();
}

/**
 * Error logging middleware
 */
function logError(error, req, res, next) {
  const timestamp = new Date().toISOString();
  console.error(`💥 ${timestamp} Error in ${req.method} ${req.path}:`);
  console.error(error);
  next(error);
}

module.exports = {
  logRequest,
  logError
};
