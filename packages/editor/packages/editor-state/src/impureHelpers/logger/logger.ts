import type { State, LogMessage } from '../../types';

type LogLevel = LogMessage['level'];

function serializeValue(value: unknown): string {
	if (value === null) {
		return 'null';
	}
	if (value === undefined) {
		return 'undefined';
	}
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' || typeof value === 'boolean') {
		return String(value);
	}
	if (typeof value === 'function') {
		return `[Function: ${value.name || 'anonymous'}]`;
	}
	if (value instanceof Error) {
		return `${value.name}: ${value.message}`;
	}
	if (Array.isArray(value)) {
		if (value.length <= 3) {
			return `[${value.map(serializeValue).join(', ')}]`;
		}
		return `[Array(${value.length})]`;
	}
	if (typeof value === 'object') {
		const keys = Object.keys(value);
		if (keys.length <= 3) {
			const pairs = keys.map(k => `${k}: ${serializeValue((value as Record<string, unknown>)[k])}`);
			return `{${pairs.join(', ')}}`;
		}
		return `{Object(${keys.length} keys)}`;
	}
	return String(value);
}

function formatMessage(...args: unknown[]): string {
	return args.map(serializeValue).join(' ');
}

function addLogEntry(state: State, level: LogLevel, ...args: unknown[]): void {
	const message = formatMessage(...args);
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

export function log(state: State, ...args: unknown[]): void {
	addLogEntry(state, 'log', ...args);
}

export function warn(state: State, ...args: unknown[]): void {
	addLogEntry(state, 'warn', ...args);
}

export function error(state: State, ...args: unknown[]): void {
	addLogEntry(state, 'error', ...args);
}

export function info(state: State, ...args: unknown[]): void {
	addLogEntry(state, 'info', ...args);
}
