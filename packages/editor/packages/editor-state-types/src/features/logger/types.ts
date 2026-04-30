/**
 * Types for logger feature - internal logging and console overlay.
 */

/**
 * Individual log message entry.
 */
export interface LogMessage {
	level: 'log' | 'warn' | 'error' | 'info';
	category?: string;
	timestamp: string;
	message: string;
}

/**
 * Console state for internal logging buffer.
 */
export interface ConsoleState {
	logs: LogMessage[];
	maxLogs: number;
}
