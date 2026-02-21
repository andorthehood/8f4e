import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import keyboardMemoryEvents from './keyboardMemoryEvents';

import type { StateManager } from '@8f4e/state-manager';
import type { State } from '@8f4e/editor-state';

type WindowListener = (event: KeyboardEvent) => void;

interface MockWindow {
	addEventListener: (type: string, listener: WindowListener) => void;
	removeEventListener: (type: string, listener: WindowListener) => void;
	emit: (type: string, event: KeyboardEvent) => void;
}

function createMockWindow(): MockWindow {
	const listeners = new Map<string, Set<WindowListener>>();

	return {
		addEventListener: (type: string, listener: WindowListener) => {
			const group = listeners.get(type) ?? new Set<WindowListener>();
			group.add(listener);
			listeners.set(type, group);
		},
		removeEventListener: (type: string, listener: WindowListener) => {
			const group = listeners.get(type);
			group?.delete(listener);
		},
		emit: (type: string, event: KeyboardEvent) => {
			const group = listeners.get(type);
			if (!group) {
				return;
			}
			for (const listener of group) {
				listener(event);
			}
		},
	};
}

function createKeyboardEventLike(code: string, key: string, keyCode: number): KeyboardEvent {
	return { code, key, keyCode } as KeyboardEvent;
}

describe('keyboardMemoryEvents', () => {
	const originalWindow = globalThis.window;
	let mockWindow: MockWindow;

	beforeEach(() => {
		mockWindow = createMockWindow();
		Object.assign(globalThis, { window: mockWindow });
	});

	afterEach(() => {
		Object.assign(globalThis, { window: originalWindow });
	});

	it('writes keyCode and keyPressed values and tracks latest still-pressed key', () => {
		const setWordInMemory = vi.fn();
		const state = {
			compiledProjectConfig: {
				keyCodeMemoryId: 'keys.code',
				keyPressedMemoryId: 'keys.pressed',
			},
			compiler: {
				compiledModules: {
					keys: {
						memoryMap: {
							code: { wordAlignedAddress: 4 },
							pressed: { wordAlignedAddress: 5 },
						},
					},
				},
			},
			callbacks: {
				setWordInMemory,
			},
		} as unknown as State;

		const store = {
			getState: () => state,
		} as unknown as StateManager<State>;

		const cleanup = keyboardMemoryEvents(store);

		mockWindow.emit('keydown', createKeyboardEventLike('KeyA', 'a', 65));
		mockWindow.emit('keydown', createKeyboardEventLike('KeyB', 'b', 66));
		mockWindow.emit('keyup', createKeyboardEventLike('KeyB', 'b', 66));
		mockWindow.emit('keyup', createKeyboardEventLike('KeyA', 'a', 65));

		expect(setWordInMemory).toHaveBeenCalledWith(4, 4, true);
		expect(setWordInMemory).toHaveBeenCalledWith(5, 1, true);
		expect(setWordInMemory).toHaveBeenCalledWith(4, 5, true);
		expect(setWordInMemory).toHaveBeenCalledWith(4, 4, true);
		expect(setWordInMemory).toHaveBeenLastCalledWith(5, 0, true);

		cleanup();
	});

	it('clears pressed flag on blur and skips unresolved memory ids silently', () => {
		const setWordInMemory = vi.fn();
		const state = {
			compiledProjectConfig: {
				keyCodeMemoryId: 'missing.code',
				keyPressedMemoryId: 'keys.pressed',
			},
			compiler: {
				compiledModules: {
					keys: {
						memoryMap: {
							pressed: { wordAlignedAddress: 8 },
						},
					},
				},
			},
			callbacks: {
				setWordInMemory,
			},
		} as unknown as State;

		const store = {
			getState: () => state,
		} as unknown as StateManager<State>;

		const cleanup = keyboardMemoryEvents(store);

		mockWindow.emit('keydown', createKeyboardEventLike('Unidentified', 'c', 67));
		mockWindow.emit('blur', createKeyboardEventLike('', '', 0));

		expect(setWordInMemory).not.toHaveBeenCalledWith(undefined, expect.any(Number), true);
		expect(setWordInMemory).toHaveBeenCalledWith(8, 1, true);
		expect(setWordInMemory).toHaveBeenCalledWith(8, 0, true);
		expect(setWordInMemory).toHaveBeenLastCalledWith(8, 0, true);

		cleanup();
	});
});
