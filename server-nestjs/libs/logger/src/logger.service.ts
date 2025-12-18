import { Injectable, LoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context = 'App';

  setContext(context: string) {
    this.context = context;
    return this;
  }

  log(message: any, ...optionalParams: any[]) {
    console.log(`[${this.context}] ${message}`, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    console.error(`[${this.context}] ERROR: ${message}`, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    console.warn(`[${this.context}] WARN: ${message}`, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] DEBUG: ${message}`, ...optionalParams);
    }
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.context}] VERBOSE: ${message}`, ...optionalParams);
    }
  }
}
