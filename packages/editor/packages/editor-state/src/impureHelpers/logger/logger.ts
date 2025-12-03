import type { State, LogMessage } from '../../types';

type LogLevel = LogMessage['level'];

function addLogEntry(state: State, level: LogLevel, message: string): void {
	const logEntry: LogMessage = {
		level,
		message,
		timestamp: Date.now(),
	};

	state.console.logs.push(logEntry);

	if (state.console.logs.length > state.console.maxLogs) {
		state.console.logs = state.console.logs.slice(-state.console.maxLogs);
	}
}

export function log(state: State, message: string): void {
	addLogEntry(state, 'log', message);
}

export function warn(state: State, message: string): void {
	addLogEntry(state, 'warn', message);
}

export function error(state: State, message: string): void {
	addLogEntry(state, 'error', message);
}

export function info(state: State, message: string): void {
	addLogEntry(state, 'info', message);
}
