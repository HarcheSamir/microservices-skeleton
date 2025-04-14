const prisma = require('../../config/prisma');
const { sendMessage } = require('../../kafka/producer'); // Import Kafka producer


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

        // Send event to Kafka AFTER successful DB operation
        await sendMessage('BOOK_CREATED', book);

        res.status(201).json(book);

    } catch (err) {
        next(err);
    }
};

// Retrieve list of books with pagination
const getBooks = async (req, res, next) => {
    try {
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

        // Ensure the book exists before updating (optional, Prisma update throws error if not found)
        const existingBook = await prisma.book.findUnique({ where: { id: parseInt(id) } });
        if (!existingBook) {
            return res.status(404).json({ message: 'Book not found for update' });
        }

        const book = await prisma.book.update({
            where: { id: parseInt(id) },
            data: {
                title,
                description,
                author,
                publishedAt: publishedAt ? new Date(publishedAt) : undefined, // Only update if provided
                // updatedAt will be handled automatically by Prisma
            },
        });

         // Send event to Kafka AFTER successful DB operation
        await sendMessage('BOOK_UPDATED', book);

        res.json(book);
    } catch (err) {
         // Handle potential Prisma errors like record not found during update
         if (err.code === 'P2025') { // Prisma code for record not found on update/delete
             return res.status(404).json({ message: 'Book not found for update' });
         }
        next(err);
    }
};

// Delete a book by ID
const deleteBook = async (req, res, next) => {
    try {
        const { id } = req.params;
        const bookIdInt = parseInt(id);

         // Ensure the book exists before deleting (optional, Prisma delete throws error if not found)
         const existingBook = await prisma.book.findUnique({ where: { id: bookIdInt } });
         if (!existingBook) {
             return res.status(404).json({ message: 'Book not found for deletion' });
         }

        await prisma.book.delete({ where: { id: bookIdInt } });

        // Send event to Kafka AFTER successful DB operation (send only the ID)
        await sendMessage('BOOK_DELETED', bookIdInt);

        res.status(204).end(); // No content response for successful delete
    } catch (err) {
         // Handle potential Prisma errors like record not found during delete
        if (err.code === 'P2025') {
             return res.status(404).json({ message: 'Book not found for deletion' });
         }
        next(err);
    }
};



const createMultipleBooks = async (req, res, next) => {
    // Expect req.body to be an array of book objects
    const booksData = req.body;

    // Basic Validation: Check if it's an array and not empty
    if (!Array.isArray(booksData) || booksData.length === 0) {
        return res.status(400).json({ message: 'Request body must be a non-empty array of book objects.' });
    }

    const createdBooks = [];
    const validationErrors = [];

    try {
        // Use a transaction to ensure all books are created or none are
        await prisma.$transaction(async (tx) => {
            console.log(`Starting transaction to create ${booksData.length} books.`);

            for (let i = 0; i < booksData.length; i++) {
                const bookData = booksData[i];

                // Per-item validation (Example: title is required)
                if (!bookData.title) {
                    // Collect validation errors instead of throwing immediately
                    validationErrors.push({ index: i, error: 'Missing required field: title' });
                    // Skip this item or throw to abort transaction? Let's throw to abort.
                    throw new Error(`Validation failed for book at index ${i}: Missing required field: title`);
                    // continue; // Alternative: skip this book if you want partial success
                }

                // Use the transaction client (tx) for operations within the transaction
                const newBook = await tx.book.create({
                    data: {
                        title: bookData.title,
                        description: bookData.description,
                        author: bookData.author,
                        publishedAt: bookData.publishedAt ? new Date(bookData.publishedAt) : null,
                    },
                });

                createdBooks.push(newBook); // Collect successfully created book

                // Send Kafka message for the *individual* book immediately after creation
                // If sendMessage fails here, the transaction will roll back.
                await sendMessage('BOOK_CREATED', newBook);
                console.log(`Sent BOOK_CREATED event for new book ID: ${newBook.id}`);
            }
            console.log(`Transaction successful. ${createdBooks.length} books created and events sent.`);
        }); // End of transaction

        // If the transaction succeeded without validation errors being thrown
        res.status(201).json({
             message: `Successfully created ${createdBooks.length} books.`,
             data: createdBooks // Return the array of created books with their IDs
         });

    } catch (err) {
         console.error("Error during bulk book creation transaction:", err);
         // Check if it was our validation error
         if (err.message.startsWith('Validation failed for book')) {
             // We already threw, catch block handles sending response
              res.status(400).json({
                 message: "Bulk creation failed due to validation errors.",
                 error: err.message // Send back the specific validation error that stopped the transaction
              });
         } else {
             // Handle other potential errors (DB connection, Kafka connection within sendMessage, etc.)
             // Pass to the generic error handler
             next(err);
         }
    }
};




module.exports = {
    createBook,
    createMultipleBooks,
    getBooks,
    getBookById,
    updateBook,
    deleteBook,
};