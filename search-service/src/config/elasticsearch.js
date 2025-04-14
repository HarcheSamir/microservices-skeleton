const { Client } = require('@elastic/elasticsearch');

const ELASTICSEARCH_NODE = process.env.ELASTICSEARCH_NODE || 'http://localhost:9200';
const BOOK_INDEX = 'books';

if (!ELASTICSEARCH_NODE) {
    console.error('FATAL: Missing required environment variable ELASTICSEARCH_NODE');
    process.exit(1);
}

const client = new Client({
    node: ELASTICSEARCH_NODE,
    requestTimeout: 5000
});

// --- Define Index Settings and Mappings ---
// Includes custom analyzer for stemming and synonyms
const indexSettingsAndMappings = {
    settings: {
        analysis: {
            analyzer: {
                custom_english_analyzer: { /* ... same as before ... */
                    type: "custom",
                    tokenizer: "standard",
                    filter: [
                        "lowercase",
                        "english_stopwords",
                        "english_synonyms",
                        "english_stemmer"
                    ]
                }
            },
            filter: {
                english_stemmer: { /* ... same as before ... */
                    type: "stemmer",
                    language: "english"
                 },
                english_synonyms: { /* ... same as before ... */
                    type: "synonym",
                    synonyms: [
                        "book, publication, tome, volume",
                        "code, software, program",
                        "art, technique",
                        "fast, quick, rapid",
                    ]
                 },
                english_stopwords: { /* ... same as before ... */
                     type: "stop",
                     stopwords: "_english_"
                 }
            }
        }
    },
    mappings: { /* ... same as before ... */
        properties: {
            title: { type: "text", analyzer: "custom_english_analyzer" },
            description: { type: "text", analyzer: "custom_english_analyzer" },
            author: { type: "text", analyzer: "standard" },
            id: { type: "integer" },
            publishedAt: { type: "date" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" }
        }
    }
};
// --- End Define Index Settings and Mappings ---


// Function to ensure the index exists WITH the correct settings and mappings (IDEMPOTENT)
const ensureIndexExists = async () => {
    try {
        console.log(`Attempting to create index "${BOOK_INDEX}" with custom settings/mappings if it doesn't exist...`);
        // Directly attempt to create the index with the desired settings/mappings
        await client.indices.create({
            index: BOOK_INDEX,
            body: indexSettingsAndMappings
        });
        console.log(`Index "${BOOK_INDEX}" created successfully.`);

    } catch (error) {
        // Check if the error is specifically 'resource_already_exists_exception'
        if (error.meta && error.meta.body && error.meta.body.error && error.meta.body.error.type === 'resource_already_exists_exception') {
            console.log(`Index "${BOOK_INDEX}" already exists. Verifying settings/mappings (optional step)...`);
            // *** OPTIONAL BUT RECOMMENDED: Verify existing mapping/settings ***
            // In a production scenario, you'd ideally check if the *existing* index actually has the settings/mappings
            // defined in indexSettingsAndMappings. If not, you'd need to update them (requires closing/reopening index).
            // For simplicity now, we just log that it exists.
            // Example check (pseudo-code):
            // currentSettings = await client.indices.getSettings({ index: BOOK_INDEX });
            // currentMapping = await client.indices.getMapping({ index: BOOK_INDEX });
            // if (!deepEqual(currentSettings, desiredSettings) || !deepEqual(currentMapping, desiredMapping)) {
            //    console.warn(`Index "${BOOK_INDEX}" exists but settings/mappings differ! Manual update may be required.`);
            // }
        } else {
            // If it's any other error, log it and re-throw to indicate a real problem.
            console.error(`Error creating or verifying index "${BOOK_INDEX}":`, error);
            if (error.meta && error.meta.body) {
                 console.error("Elasticsearch Error Body:", JSON.stringify(error.meta.body, null, 2));
            }
            throw error; // Re-throw other errors
        }
    }
};


// Function to connect and check status (calls the modified ensureIndexExists)
const connectClient = async () => {
    try {
        await client.ping();
        console.log('Elasticsearch client ping successful.');
        await ensureIndexExists(); // Ensure index exists or is created idempotently
        console.log('Elasticsearch client setup complete.');
    } catch (error) {
        console.error('Elasticsearch client connection or index setup failed:', error);
        throw error;
    }
};


module.exports = {
    client,
    connectClient,
    BOOK_INDEX
};