const express = require('express');
const {
  createBook,
  createMultipleBooks,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
} = require('./book.controller');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

router.get('/', getBooks);
router.get('/:id', getBookById);
router.post('/', 
  // authMiddleware,
   createBook);
router.put('/:id', 
  // authMiddleware,
   updateBook);
router.delete('/:id', 
  // authMiddleware, 
  deleteBook);

router.post('/bulk', createMultipleBooks);



module.exports = router;