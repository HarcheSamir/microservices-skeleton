const Consul = require('consul');

const CONSUL_AGENT_HOST = process.env.CONSUL_AGENT_HOST || '127.0.0.1';

// Input validation
if (!CONSUL_AGENT_HOST) {
  console.error('FATAL: Missing required environment variable CONSUL_AGENT_HOST');
  process.exit(1);
}

const consul = new Consul({
  host: CONSUL_AGENT_HOST,
  port: 8500,
  promisify: true,
});

// Helper function to find a healthy service instance
// Returns target URL like 'http://address:port' or null
const findService = async (serviceName) => {
  try {
    const services = await consul.health.service({
      service: serviceName,
      passing: true, // Only get healthy instances
    });

    if (!services || services.length === 0) {
      console.warn(`CONSUL DISCOVERY: No healthy instances found for service: ${serviceName}`);
      return null;
    }

    // Simple load balancing: Randomly pick one healthy instance
    const instance = services[Math.floor(Math.random() * services.length)];
    const address = instance.Service.Address;
    const port = instance.Service.Port;
    const target = `http://${address}:${port}`;
    console.log(`CONSUL DISCOVERY: Routing to ${serviceName} at ${target}`);
    return target;

  } catch (error) {
    console.error(`CONSUL DISCOVERY: Error finding service ${serviceName}:`, error);
    // Re-throw or return null based on desired failure behavior
    // Throwing ensures the proxy request fails clearly if discovery fails
    throw new Error(`Consul discovery failed for ${serviceName}`);
  }
};

module.exports = {
  consul,
  findService,
};