const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { findService } = require('./consul'); // Import discovery helper
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(morgan('dev'));

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'API Gateway' });
});

// Create proxy configuration dynamically 
const createDynamicProxy = (serviceName) => {
  return createProxyMiddleware({
    router: async (req) => {
      const targetUrl = await findService(serviceName);
      if (!targetUrl) {
        throw new Error(`Service '${serviceName}' unavailable.`);
      }
      return targetUrl;
    },
    // Remove pathRewrite so the incoming path remains unchanged
    changeOrigin: true,
    logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    onError: (err, req, res) => {
      console.error(`Proxy Error for ${serviceName}:`, err.message);
      if (!res.headersSent) {
        res.writeHead(503, { 'Content-Type': 'application/json' });
      }
      if (!res.writableEnded) {
        res.end(JSON.stringify({
          message: `Service ${serviceName} unavailable or errored.`,
          error: err.message
        }));
      }
    }
  });
};

// Setup dynamic proxies without rewriting paths
app.use('/api/auth', createDynamicProxy('auth-service'));
// Remove the separate /api/users mapping because the auth service now handles both `/auth/*` and `/users/*` internally.
// Adjust the mount points in your auth service if needed.
app.use('/api/book', createDynamicProxy('book-service'));  // Note: Use `/api/book` per your requirement

app.use(express.json());

// Global Error Handler
app.use(errorHandler);

module.exports = app;
