const axios = require('axios');
const { findService } = require('../config/consul'); // Import discovery helper

// REMOVE HARDCODED URL
// const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid format (Bearer Token)' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        // This case is technically covered by the split check above, but good practice
        return res.status(401).json({ message: 'Token missing' });
    }

    // 1. Discover Auth Service
    const authService = await findService('auth-service');
    if (!authService) {
      console.error('Auth Middleware: Could not discover auth-service via Consul.');
      return res.status(503).json({ message: 'Authentication service is currently unavailable.' });
    }

    // 2. Validate token with discovered Auth service instance
    const validationUrl = `${authService.url}/auth/validate`; // Construct dynamic URL
    console.log(`Auth Middleware: Validating token via ${validationUrl}`);

    const response = await axios.post(validationUrl, { token }, {
        timeout: 5000 // Add a reasonable timeout
    });

    if (!response.data || !response.data.valid) {
      console.warn('Auth Middleware: Token validation failed by auth-service.', response.data?.message);
      return res.status(401).json({ message: response.data?.message || 'Invalid or expired token' });
    }

    // 3. Set user data from auth service response
    req.user = response.data.user;
    console.log(`Auth Middleware: Token validated successfully for user ID: ${req.user.id}`);
    next();

  } catch (error) {
    if (error.response) {
      // Auth service returned an error (e.g., 401, 500)
      console.error(`Auth Middleware: Auth service responded with error ${error.response.status}:`, error.response.data);
      return res.status(error.response.status || 401).json({ message: error.response.data?.message || 'Authentication failed' });
    } else if (error.request) {
       // Network error communicating with auth service
       console.error('Auth Middleware: Network error contacting auth service:', error.message);
       return res.status(503).json({ message: 'Authentication service unavailable (network error).' });
    } else if (error.message.includes('Consul discovery failed')) {
        // Specific error from our findService helper
        console.error('Auth Middleware: Consul discovery failed:', error.message);
        return res.status(503).json({ message: 'Authentication service unavailable (discovery failure).' });
    } else {
      // Other unexpected errors
      console.error('Auth Middleware: Unexpected error:', error);
      return res.status(500).json({ message: 'An internal error occurred during authentication.' });
    }
  }
};

module.exports = authMiddleware;