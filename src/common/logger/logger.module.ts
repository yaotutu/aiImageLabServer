import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './logger.service';
import { HttpExceptionFilter } from '../filters/http-exception.filter';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';

@Global()
@Module({
  providers: [AppLoggerService, HttpExceptionFilter, LoggingInterceptor],
  exports: [AppLoggerService, HttpExceptionFilter, LoggingInterceptor],
})
export class LoggerModule {}
