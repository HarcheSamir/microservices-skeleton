const prisma = require('../../config/prisma');

// Create a new book
const createBook = async (req, res, next) => {
  try {
    const { title, description, author, publishedAt } = req.body;
    
    const book = await prisma.book.create({
      data: {
        title,
        description,
        author,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
};

// Retrieve list of books with pagination
const getBooks = async (req, res, next) => {
  try {
    // Pagination parameters: page & limit
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.book.count(),
    ]);
    
    res.json({
      data: books,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get a single book by ID
const getBookById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({ where: { id: parseInt(id) } });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    next(err);
  }
};

// Update a book by ID
const updateBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, author, publishedAt } = req.body;
    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        author,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      },
    });
    res.json(book);
  } catch (err) {
    next(err);
  }
};

// Delete a book by ID
const deleteBook = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.book.delete({ where: { id: parseInt(id) } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
};