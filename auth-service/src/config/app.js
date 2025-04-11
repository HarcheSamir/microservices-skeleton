const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/user/user.routes');
const errorHandler = require('../middlewares/errorHandler');

const app = express();

// Global Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Auth Service API' });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;