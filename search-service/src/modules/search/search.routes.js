const express = require('express');
const { searchBooks } = require('./search.controller');

const router = express.Router();

// GET /search/books?q=<query_term>
router.get('/books', searchBooks);

module.exports = router;