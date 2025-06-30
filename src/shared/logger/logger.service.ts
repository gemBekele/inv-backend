import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: any, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: any, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: any, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: any, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: any, context?: string) {
    this.logger.verbose(message, { context });
  }

  logRequest(method: string, url: string, statusCode: number, responseTime: number) {
    this.logger.info(`${method} ${url} ${statusCode} - ${responseTime}ms`, {
      context: 'HTTP',
    });
  }

  logError(error: Error, context?: string) {
    this.logger.error(error.message, {
      trace: error.stack,
      context: context || 'Application',
    });
  }
}