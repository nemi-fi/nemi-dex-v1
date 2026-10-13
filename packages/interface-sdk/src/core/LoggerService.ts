export class LoggerService {
  info(...args: unknown[]) {
    console.info(...args);
  }

  log(...args: unknown[]) {
    console.log(...args);
  }

  warn(...args: unknown[]) {
    console.warn(...args);
  }

  error(...args: unknown[]) {
    console.error(...args);
  }
}
