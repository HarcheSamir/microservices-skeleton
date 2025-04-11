const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const bookRoutes = require('../modules/book/book.routes');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Book Service API' });
});

// API Routes
app.use('/books', bookRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;