import mongoose from 'mongoose';
import dns from 'dns';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

/**
 * Establish the MongoDB connection.
 *
 * During early phases the URI may be empty (credentials are supplied later); in
 * that case we skip the connection and warn rather than crash, so the rest of
 * the server (health checks, routing) can still be exercised. From Phase 3
 * onward a missing URI in production is treated as fatal.
 */
export async function connectDatabase(): Promise<void> {
  if (!env.MONGODB_URI) {
    if (env.isProduction) {
      logger.error('MONGODB_URI is required in production but was not provided.');
      process.exit(1);
    }
    logger.warn('MONGODB_URI not set — starting without a database connection (dev only).');
    return;
  }

  // Bypasses Node.js c-ares DNS resolution issues on Windows for mongodb+srv URIs
  if (env.MONGODB_URI.startsWith('mongodb+srv://')) {
    try {
      const urlWithoutScheme = env.MONGODB_URI.replace('mongodb+srv://', '');
      const host = urlWithoutScheme.split('/')[0].split('?')[0].split(':')[0];
      await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
    } catch (dnsErr) {
      logger.warn(
        `Node.js c-ares DNS SRV resolution failed (${(dnsErr as Error).message}). ` +
        `Overriding DNS servers to Google (8.8.8.8) and Cloudflare (1.1.1.1) public resolvers...`
      );
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
      } catch (setServersErr) {
        logger.error('Failed to override DNS servers', (setServersErr as Error).message);
      }
    }
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');
  } catch (error) {
    logger.error('❌ Failed to connect to MongoDB', (error as Error).message);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', err.message));
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}
