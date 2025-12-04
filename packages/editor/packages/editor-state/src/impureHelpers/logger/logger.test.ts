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
			expect(mockState.console.logs[0].message).toMatch(/^\[\d{2}:\d{2}:\d{2}\] Test message$/);
		});
	});

	describe('warn', () => {
		it('should add a log entry with level "warn"', () => {
			warn(mockState, 'Warning message');

			expect(mockState.console.logs[0].level).toBe('warn');
			expect(mockState.console.logs[0].message).toMatch(/^\[\d{2}:\d{2}:\d{2}\] Warning message$/);
		});
	});

	describe('error', () => {
		it('should add a log entry with level "error"', () => {
			error(mockState, 'Error message');

			expect(mockState.console.logs[0].level).toBe('error');
			expect(mockState.console.logs[0].message).toMatch(/^\[\d{2}:\d{2}:\d{2}\] Error message$/);
		});
	});

	describe('info', () => {
		it('should add a log entry with level "info"', () => {
			info(mockState, 'Info message');

			expect(mockState.console.logs[0].level).toBe('info');
			expect(mockState.console.logs[0].message).toMatch(/^\[\d{2}:\d{2}:\d{2}\] Info message$/);
		});
	});

	describe('circular buffer', () => {
		it('should limit logs to maxLogs', () => {
			mockState.console.maxLogs = 5;

			for (let i = 0; i < 10; i++) {
				log(mockState, `Message ${i}`);
			}

			expect(mockState.console.logs).toHaveLength(5);
			expect(mockState.console.logs[0].message).toMatch(/^\[\d{2}:\d{2}:\d{2}\] Message 5$/);
			expect(mockState.console.logs[4].message).toMatch(/^\[\d{2}:\d{2}:\d{2}\] Message 9$/);
		});
	});
});
