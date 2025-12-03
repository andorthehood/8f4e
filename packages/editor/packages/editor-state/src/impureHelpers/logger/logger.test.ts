import { describe, it, expect, beforeEach } from 'vitest';

import { log, warn, error, info } from './logger';

import { createMockState } from '../../pureHelpers/testingUtils/testUtils';

import type { State } from '../../types';

describe('logger', () => {
	let mockState: State;

	beforeEach(() => {
		mockState = createMockState();
	});

	describe('log', () => {
		it('should add a log entry with level "log"', () => {
			log(mockState, 'Test message');

			expect(mockState.console.logs).toHaveLength(1);
			expect(mockState.console.logs[0].level).toBe('log');
			expect(mockState.console.logs[0].message).toBe('Test message');
			expect(mockState.console.logs[0].timestamp).toBeGreaterThan(0);
		});

		it('should handle multiple arguments', () => {
			log(mockState, 'Hello', 'World', 123);

			expect(mockState.console.logs[0].message).toBe('Hello World 123');
		});
	});

	describe('warn', () => {
		it('should add a log entry with level "warn"', () => {
			warn(mockState, 'Warning message');

			expect(mockState.console.logs[0].level).toBe('warn');
		});
	});

	describe('error', () => {
		it('should add a log entry with level "error"', () => {
			error(mockState, 'Error message');

			expect(mockState.console.logs[0].level).toBe('error');
		});

		it('should serialize Error objects', () => {
			const testError = new Error('Test error');
			error(mockState, 'Failed:', testError);

			expect(mockState.console.logs[0].message).toContain('Error: Test error');
		});
	});

	describe('info', () => {
		it('should add a log entry with level "info"', () => {
			info(mockState, 'Info message');

			expect(mockState.console.logs[0].level).toBe('info');
		});
	});

	describe('serialization', () => {
		it('should serialize null', () => {
			log(mockState, null);

			expect(mockState.console.logs[0].message).toBe('null');
		});

		it('should serialize undefined', () => {
			log(mockState, undefined);

			expect(mockState.console.logs[0].message).toBe('undefined');
		});

		it('should serialize numbers', () => {
			log(mockState, 42);

			expect(mockState.console.logs[0].message).toBe('42');
		});

		it('should serialize booleans', () => {
			log(mockState, true);

			expect(mockState.console.logs[0].message).toBe('true');
		});

		it('should serialize small arrays inline', () => {
			log(mockState, [1, 2, 3]);

			expect(mockState.console.logs[0].message).toBe('[1, 2, 3]');
		});

		it('should summarize large arrays', () => {
			log(mockState, [1, 2, 3, 4, 5]);

			expect(mockState.console.logs[0].message).toBe('[Array(5)]');
		});

		it('should serialize small objects inline', () => {
			log(mockState, { a: 1, b: 2 });

			expect(mockState.console.logs[0].message).toBe('{a: 1, b: 2}');
		});

		it('should summarize large objects', () => {
			log(mockState, { a: 1, b: 2, c: 3, d: 4, e: 5 });

			expect(mockState.console.logs[0].message).toBe('{Object(5 keys)}');
		});

		it('should serialize functions', () => {
			function testFunction() {}
			log(mockState, testFunction);

			expect(mockState.console.logs[0].message).toBe('[Function: testFunction]');
		});

		it('should serialize anonymous functions', () => {
			log(mockState, () => {});

			expect(mockState.console.logs[0].message).toBe('[Function: anonymous]');
		});
	});

	describe('circular buffer', () => {
		it('should limit logs to maxLogs', () => {
			mockState.console.maxLogs = 5;

			for (let i = 0; i < 10; i++) {
				log(mockState, `Message ${i}`);
			}

			expect(mockState.console.logs).toHaveLength(5);
			expect(mockState.console.logs[0].message).toBe('Message 5');
			expect(mockState.console.logs[4].message).toBe('Message 9');
		});
	});
});
