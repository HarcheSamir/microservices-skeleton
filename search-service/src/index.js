const app = require('./config/app');
const { registerService } = require('./config/consul');
const { connectConsumer, disconnectConsumer } = require('./kafka/consumer');
const { connectClient: connectElasticsearchClient } = require('./config/elasticsearch');

const PORT = process.env.PORT || 3003;

const startServer = async () => {
    try {
        // 1. Connect to Elasticsearch
        await connectElasticsearchClient();
        console.log('Elasticsearch client connected');

        // 2. Start Kafka Consumer
        await connectConsumer();
        console.log('Kafka consumer connected and running');

        // 3. Start Express Server
        const server = app.listen(PORT, async () => {
            console.log(`Search Service running on port ${PORT}`);
            try {
                // 4. Register with Consul AFTER server is listening and dependencies are up
                await registerService();
            } catch (err) {
                console.error('Failed to register service with Consul during startup:', err);
                // Consider shutting down if Consul registration is critical
                // server.close(() => process.exit(1));
            }
        });

        // Graceful shutdown handler
        const shutdown = async (signal) => {
            console.log(`${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                try {
                    await disconnectConsumer();
                    console.log('Kafka consumer disconnected.');
                    // Elasticsearch client doesn't typically need explicit disconnection here
                } catch (err) {
                    console.error('Error during Kafka disconnection:', err);
                }
                // Consul deregistration is handled by its own SIGINT/SIGTERM handler
                // process.exit(0); // Deregistration handles exit
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (error) {
        console.error('Failed to start Search Service:', error);
        process.exit(1);
    }
};

startServer();