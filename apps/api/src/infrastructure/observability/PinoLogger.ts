import type { FastifyBaseLogger } from 'fastify';
import type { ILogger } from '#src/use-cases/ports/ILogger.js';

export class PinoLogger implements ILogger {
  constructor(private readonly logger: FastifyBaseLogger) {}

  error(message: string, err: unknown): void {
    this.logger.error(err, message);
  }
}
