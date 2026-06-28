import { createApp } from '@/app';
import { env } from '@/config/env';
import { connectDatabase, disconnectDatabase } from '@/config/db';
import { logger } from '@/utils/logger';

/**
 * Process bootstrap: connect the database, start the HTTP server, and wire
 * graceful shutdown + last-resort crash handlers.
 */
async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Force-exit if shutdown stalls.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason instanceof Error ? reason.stack : reason);
  });
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', error.stack);
    process.exit(1);
  });
}

void bootstrap();
