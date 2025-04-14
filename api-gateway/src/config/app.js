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
                // Throw an error that the error handler can catch
                 const serviceUnavailableError = new Error(`Service '${serviceName}' unavailable.`);
                 serviceUnavailableError.statusCode = 503; // Service Unavailable
                 throw serviceUnavailableError;
            }
            console.log(`[API Gateway] Routing to ${serviceName} at ${targetUrl}`);
            return targetUrl;
        },
        changeOrigin: true,
        logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
        onError: (err, req, res, next) => { // Pass error to next middleware (our errorHandler)
             console.error(`[API Gateway] Proxy Error for ${serviceName}:`, err.message);
             // Enhance error message for clarity
             const proxyError = new Error(`Error proxying request to ${serviceName}: ${err.message}`);
             proxyError.statusCode = err.statusCode || 503; // Default to 503 if service is down
             next(proxyError); // Pass to the global error handler
        }
    });
};

// Setup dynamic proxies
app.use('/api/auth', createDynamicProxy('auth-service'));
app.use('/api/book', createDynamicProxy('book-service'));
app.use('/api/search', createDynamicProxy('search-service')); // <-- ADDED search route

// Global Error Handler - Placed AFTER proxy routes
app.use(errorHandler);

module.exports = app;