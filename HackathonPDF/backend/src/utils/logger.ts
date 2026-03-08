/**
 * Structured logger for HackathonPDF backend
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
}

interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    [key: string]: unknown;
}

class Logger {
    private currentLevel: LogLevel;

    constructor() {
        const envLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
        const levelMap: Record<string, LogLevel> = {
            DEBUG: LogLevel.DEBUG,
            INFO: LogLevel.INFO,
            WARNING: LogLevel.WARNING,
            ERROR: LogLevel.ERROR,
        };
        this.currentLevel = levelMap[envLevel] ?? LogLevel.INFO;
    }

    private emit(level: LogLevel, levelName: string, message: string, context?: Record<string, unknown>): void {
        if (level < this.currentLevel) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: levelName,
            message,
            ...context,
        };

        const output = JSON.stringify(entry);

        if (level >= LogLevel.ERROR) {
            console.error(output);
        } else {
            console.log(output);
        }
    }

    debug(message: string, context?: Record<string, unknown>): void {
        this.emit(LogLevel.DEBUG, 'DEBUG', message, context);
    }

    info(message: string, context?: Record<string, unknown>): void {
        this.emit(LogLevel.INFO, 'INFO', message, context);
    }

    warning(message: string, context?: Record<string, unknown>): void {
        this.emit(LogLevel.WARNING, 'WARNING', message, context);
    }

    error(message: string, context?: Record<string, unknown>): void {
        this.emit(LogLevel.ERROR, 'ERROR', message, context);
    }
}

export const logger = new Logger();
