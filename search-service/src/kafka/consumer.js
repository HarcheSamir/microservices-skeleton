const { Kafka } = require('kafkajs');
const { client: esClient, BOOK_INDEX } = require('../config/elasticsearch');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'search-service'; // For consumer group id
const KAFKA_TOPIC = 'book_events'; // Topic to consume from

if (!KAFKA_BROKERS || KAFKA_BROKERS.length === 0) {
    console.error('FATAL: Missing required environment variable KAFKA_BROKERS');
    process.exit(1);
}

const kafka = new Kafka({
    clientId: SERVICE_NAME,
    brokers: KAFKA_BROKERS,
    retry: { // Add basic retry logic for robustness
       initialRetryTime: 300,
       retries: 5
    }
});

const consumer = kafka.consumer({ groupId: `${SERVICE_NAME}-group` }); // Unique group ID

const processMessage = async ({ topic, partition, message }) => {
    try {
        const event = JSON.parse(message.value.toString());
        console.log(`Received event: ${event.type} for book ID: ${event.payload?.id || event.payload}`); // Log payload ID or just payload if it's only ID

        switch (event.type) {
            case 'BOOK_CREATED':
            case 'BOOK_UPDATED':
                if (!event.payload || !event.payload.id) {
                    console.error('Invalid payload for CREATED/UPDATED event:', event.payload);
                    return; // Skip invalid message
                }
                console.log(`Indexing book ${event.payload.id}...`);
                await esClient.index({
                    index: BOOK_INDEX,
                    id: event.payload.id.toString(), // Use book ID as ES document ID
                    document: event.payload,
                });
                console.log(`Book ${event.payload.id} indexed successfully.`);
                break;

            case 'BOOK_DELETED':
                const bookId = event.payload; // Assuming payload is just the ID for delete
                 if (!bookId) {
                    console.error('Invalid payload for DELETED event:', event.payload);
                    return; // Skip invalid message
                }
                console.log(`Deleting book ${bookId} from index...`);
                try {
                    await esClient.delete({
                        index: BOOK_INDEX,
                        id: bookId.toString(),
                    });
                    console.log(`Book ${bookId} deleted from index.`);
                } catch (error) {
                    // Handle case where document might not exist (e.g., already deleted)
                    if (error.meta && error.meta.statusCode === 404) {
                        console.log(`Book ${bookId} not found in index for deletion (might be already deleted).`);
                    } else {
                        throw error; // Re-throw other errors
                    }
                }
                break;

            default:
                console.warn(`Received unknown event type: ${event.type}`);
        }
    } catch (error) {
        console.error('Error processing Kafka message:', error);
        // Implement proper error handling/retry/dead-letter queue for production
    }
};

const connectConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true }); // fromBeginning might process old messages on first start
        console.log(`Subscribed to Kafka topic: ${KAFKA_TOPIC}`);

        await consumer.run({
            eachMessage: processMessage,
        });
         console.log('Kafka consumer is running...');
    } catch (error) {
        console.error('Failed to connect or run Kafka consumer:', error);
        // Optionally retry connection or exit
        throw error; // Propagate error to index.js
    }
};

const disconnectConsumer = async () => {
    try {
        await consumer.disconnect();
        console.log('Kafka consumer disconnected.');
    } catch (error) {
        console.error('Error disconnecting Kafka consumer:', error);
    }
};

module.exports = { connectConsumer, disconnectConsumer };