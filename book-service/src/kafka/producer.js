const { Kafka } = require('kafkajs');

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const SERVICE_NAME = process.env.SERVICE_NAME || 'book-service'; // For producer client id
const KAFKA_TOPIC = 'book_events'; // Topic to publish to

if (!KAFKA_BROKERS || KAFKA_BROKERS.length === 0) {
    console.error('FATAL: Missing required environment variable KAFKA_BROKERS');
    process.exit(1); // Or handle differently if Kafka is optional
}

const kafka = new Kafka({
    clientId: `${SERVICE_NAME}-producer`,
    brokers: KAFKA_BROKERS,
    retry: { // Add basic retry logic for robustness
       initialRetryTime: 300,
       retries: 5
    }
});

const producer = kafka.producer({
    // Options like idempotence can be added here for stronger guarantees if needed
    // allowAutoTopicCreation: true // Allow topic creation from producer (dev only)
});
let isConnected = false;

const connectProducer = async () => {
    if (isConnected) return;
    try {
        await producer.connect();
        isConnected = true;
        console.log('Kafka producer connected successfully.');
    } catch (error) {
        console.error('Failed to connect Kafka producer:', error);
        // Implement retry logic or handle connection failure appropriately
        isConnected = false;
        // Optionally re-throw or set a flag to prevent sending messages
    }
};

const disconnectProducer = async () => {
    if (!isConnected) return;
    try {
        await producer.disconnect();
        isConnected = false;
        console.log('Kafka producer disconnected.');
    } catch (error) {
        console.error('Error disconnecting Kafka producer:', error);
    }
};

const sendMessage = async (type, payload) => {
    if (!isConnected) {
        console.error('Kafka producer is not connected. Message not sent.');
        // Attempt to reconnect or queue the message? For simplicity, we just log now.
        // await connectProducer(); // Simple reconnect attempt (might not be ideal)
        // if (!isConnected) return; // If still not connected, bail
        return;
    }

    try {
        const message = {
            type: type, // e.g., 'BOOK_CREATED', 'BOOK_UPDATED', 'BOOK_DELETED'
            payload: payload, // The book object or just the ID for delete
        };

        await producer.send({
            topic: KAFKA_TOPIC,
            messages: [
                // Use book ID as key for potential partitioning consistency
                { key: (payload.id || payload)?.toString(), value: JSON.stringify(message) },
            ],
        });
         console.log(`Message sent to Kafka topic ${KAFKA_TOPIC}: ${type}`);
    } catch (error) {
        console.error(`Failed to send message to Kafka topic ${KAFKA_TOPIC}:`, error);
        // Implement error handling (e.g., retry, dead-letter queue)
    }
};

// Connect producer on startup (call this from index.js or before first use)
// Handle graceful shutdown (call disconnectProducer on SIGINT/SIGTERM)

module.exports = {
    connectProducer,
    disconnectProducer,
    sendMessage,
};