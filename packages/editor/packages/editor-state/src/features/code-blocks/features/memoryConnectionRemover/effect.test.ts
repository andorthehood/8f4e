import type { EventDispatcher, State } from '@8f4e/editor-state-types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import memoryConnectionRemover from './effect';

describe('memory connection remover', () => {
	let mockState: State;
	let mockStore: { getState: () => State; set: (path: string, value: unknown) => void };
	let mockEvents: EventDispatcher;
	let onCallbacks: Map<string, (...args: unknown[]) => void>;

	beforeEach(() => {
		onCallbacks = new Map();
		mockState = createMockState();
		mockStore = {
			getState: vi.fn(() => mockState),
			set: vi.fn(),
		};
		mockEvents = {
			on: vi.fn((event: string, callback: (...args: unknown[]) => void) => {
				onCallbacks.set(event, callback);
			}),
			off: vi.fn(),
		} as unknown as EventDispatcher;
	});

	it('registers and unregisters the remove connections action', () => {
		const cleanup = memoryConnectionRemover(mockStore as any, mockEvents);

		expect(mockEvents.on).toHaveBeenCalledWith('removeConnections', expect.any(Function));

		cleanup();

		expect(mockEvents.off).toHaveBeenCalledWith('removeConnections', expect.any(Function));
	});

	it('removes intermodular memory defaults from the selected code block', () => {
		memoryConnectionRemover(mockStore as any, mockEvents);
		const removeConnectionsCallback = onCallbacks.get('removeConnections');
		const codeBlock = createMockCodeBlock({
			name: 'test-block',
			code: ['module test-block', 'float foo &module:bar', 'float local &bar', 'moduleEnd'],
		});

		removeConnectionsCallback?.({ codeBlock });

		expect(codeBlock.code).toEqual(['module test-block', 'float foo', 'float local &bar', 'moduleEnd']);
		expect(mockStore.set).toHaveBeenCalledWith('codeBlockRendering.selectedCodeBlockForProgrammaticEdit', codeBlock);
	});
});
