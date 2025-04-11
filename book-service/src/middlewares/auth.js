const axios = require('axios');
const  API_GATEWAY_URL  = process.env.API_GATEWAY_URL;

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }

    // Validate token with Auth service
    const response = await axios.post(`${API_GATEWAY_URL}/api/auth/validate`, { token });
    
    if (!response.data.valid) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Set user data from auth service
    req.user = response.data.user;
    next();
  } catch (error) {
    if (error.response) {
      // Auth service returned an error
      return res.status(401).json({ message: 'Authentication failed' });
    }
    // Network or other error
    console.error('Auth service error:', error.message);
    return res.status(500).json({ message: 'Authentication service unavailable' });
  }
};

module.exports = authMiddleware;