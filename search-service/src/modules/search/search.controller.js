const { client: esClient, BOOK_INDEX } = require('../../config/elasticsearch');

const searchBooks = async (req, res, next) => {
    try {
        const { q, limit = 10, page = 1 } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query parameter "q" is required' });
        }

        const size = parseInt(limit, 10);
        const from = (parseInt(page, 10) - 1) * size;

        console.log(`Searching index "${BOOK_INDEX}" for query: "${q}", page: ${page}, limit: ${size}`);

        // Execute the search - v8 client returns the body directly on success
        const searchResponse = await esClient.search({
            index: BOOK_INDEX,
            from: from,
            size: size,
            // The query structure itself goes inside the 'body' property of the request object
            body: {
                query: {
                    multi_match: {
                        query: q,
                        fields: ['title^3', 'author^2', 'description'],
                        fuzziness: "AUTO"
                    },
                },
            },
        });

        // --- Defensive Check ---
        // Verify that the response and the 'hits' property exist before proceeding
        if (!searchResponse || !searchResponse.hits) {
            console.error('Elasticsearch search response is missing expected "hits" property:', searchResponse);
            // Check if there was an error within the response body itself (less common for client v8 but possible)
             if (searchResponse && searchResponse.error) {
                 console.error('Elasticsearch reported an error within the response:', searchResponse.error);
                 throw new Error(`Elasticsearch error: ${searchResponse.error.type || 'Unknown type'} - ${searchResponse.error.reason || 'Unknown reason'}`);
             }
             // Throw a generic error if the structure is just wrong
            throw new Error('Invalid or unexpected response structure received from Elasticsearch');
        }
        // --- End Defensive Check ---

        // Access hits directly from the response object
        const totalHits = searchResponse.hits.total.value;
        const results = searchResponse.hits.hits.map(hit => hit._source); // Extract the source documents

        res.json({
            data: results,
            pagination: {
                total: totalHits,
                page: parseInt(page, 10),
                limit: size,
                totalPages: Math.ceil(totalHits / size),
            },
        });

    } catch (err) {
        // Log detailed error information for debugging
        console.error("Error during book search execution:");
        if (err.meta && err.meta.body) {
            // Log the body of the error response from ES if available
            console.error("Elasticsearch Client Error Body:", JSON.stringify(err.meta.body, null, 2));
        } else if (err.message) {
             console.error("Error Message:", err.message);
        }
        // Log the stack trace for internal debugging
        console.error("Stack Trace:", err.stack);


        // Determine appropriate status code, default to 500
        const statusCode = (err.meta && err.meta.statusCode) ? err.meta.statusCode : 500;

        // Pass a generic, safe error message to the client's error handler
        const clientError = new Error('An error occurred while searching for books.');
        clientError.statusCode = statusCode; // Pass status code to the error handler
        next(clientError);
    }
};

module.exports = { searchBooks };