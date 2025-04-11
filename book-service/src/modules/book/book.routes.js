const express = require('express');
const {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require('./book.controller');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

router.get('/', getBooks);
router.get('/:id', authMiddleware, getBookById);
router.post('/', authMiddleware, createBook);
router.put('/:id', authMiddleware, updateBook);
router.delete('/:id', authMiddleware, deleteBook);

module.exports = router;