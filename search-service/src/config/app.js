const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const searchRoutes = require('../modules/search/search.routes');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/health', (req, res) => {
    // TODO: Add checks for Kafka connection and Elasticsearch connection if needed
    res.status(200).send('OK');
});

// API Routes
app.use('/', searchRoutes); // Mount search routes under /search

// Root Route
app.get('/', (req, res) => {
    res.json({ message: 'Search Service API' });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;