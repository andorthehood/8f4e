import { describe, expect, it } from 'vitest';

import { createSessionStore, parseArgs } from './server';

describe('parseArgs', () => {
	it('parses url and browser channel overrides', () => {
		expect(parseArgs(['--url', 'http://localhost:3000', '--channel', 'chromium'])).toEqual({
			url: 'http://localhost:3000',
			channel: 'chromium',
		});
	});

	it('uses chrome against the hosted editor by default', () => {
		expect(parseArgs([])).toEqual({
			url: 'https://editor.8f4e.com',
			channel: 'chrome',
		});
	});
});

describe('createSessionStore', () => {
	it('opens explicit sessions and reuses them by session id', async () => {
		let callCount = 0;
		const mockSession = {
			page: {} as never,
			listCodeBlocks: async () => [],
			close: async () => undefined,
		};

		const store = createSessionStore({ url: 'https://editor.8f4e.com', channel: 'chrome' }, async () => {
			callCount += 1;
			return mockSession;
		});

		expect(callCount).toBe(0);
		const sessionId = await store.openSession();
		expect(sessionId).toBe('session-1');
		expect(await store.getSession(sessionId)).toBe(mockSession);
		expect(await store.getSession(sessionId)).toBe(mockSession);
		expect(callCount).toBe(1);
	});

	it('closes sessions by session id', async () => {
		let closed = 0;
		const store = createSessionStore({ url: 'https://editor.8f4e.com', channel: 'chrome' }, async () => ({
			page: {} as never,
			listCodeBlocks: async () => [],
			close: async () => {
				closed += 1;
			},
		}));

		const sessionId = await store.openSession();
		expect(await store.closeSession(sessionId)).toBe(true);
		expect(closed).toBe(1);
		expect(await store.closeSession(sessionId)).toBe(false);
	});

	it('drops failed session opens so a later open can retry cleanly', async () => {
		let shouldFail = true;
		const store = createSessionStore({ url: 'https://editor.8f4e.com', channel: 'chrome' }, async () => {
			if (shouldFail) {
				throw new Error('failed to open');
			}

			return {
				page: {} as never,
				listCodeBlocks: async () => [],
				close: async () => undefined,
			};
		});

		await expect(store.openSession()).rejects.toThrow('failed to open');
		shouldFail = false;
		await expect(store.openSession()).resolves.toBe('session-2');
	});
});
