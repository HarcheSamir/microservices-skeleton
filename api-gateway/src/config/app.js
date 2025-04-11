const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const errorHandler = require('../middlewares/errorHandler');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL
const BOOK_SERVICE_URL = process.env.BOOK_SERVICE_URL
console.log({ AUTH_SERVICE_URL, BOOK_SERVICE_URL })
const app = express();



// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'API Gateway' });
});

// Setup proxies to microservices
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL, // "http://localhost:3001"
  pathRewrite: {
    '^/': '/auth/'
  },
  changeOrigin: true
}));


app.use('/api/users', createProxyMiddleware({ 
  target: AUTH_SERVICE_URL,
  pathRewrite: {'^/': '/users/'},
  changeOrigin: true
}));

app.use('/api/books', createProxyMiddleware({ 
  target: BOOK_SERVICE_URL,
  pathRewrite: {'^/': '/books/'},
  changeOrigin: true
}));

// Global Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Global Error Handler
app.use(errorHandler);

module.exports = app;