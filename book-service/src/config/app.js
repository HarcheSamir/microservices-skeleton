const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const bookRoutes = require('../modules/book/book.routes');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cors());
// Only use morgan in development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health Check Endpoint for Consul
app.get('/health', (req, res) => {
    // Add more checks if needed (e.g., DB connection)
    res.status(200).send('OK');
});

// // Root Route
// app.get('/', (req, res) => {
//     res.json({ message: 'Book Service API' });
// });

// API Routes
app.use('/', bookRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;