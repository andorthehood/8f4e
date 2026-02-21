import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import keyboardEvents from './keyboardEvents';

import type { StateManager } from '@8f4e/state-manager';
import type { State } from '@8f4e/editor-state';
import type { EventDispatcher } from '.';

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
			listeners.get(type)?.delete(listener);
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

function createKeyboardEventLike(key: string): KeyboardEvent {
	return {
		key,
		preventDefault: vi.fn(),
		altKey: false,
		ctrlKey: false,
		metaKey: false,
		shiftKey: false,
	} as unknown as KeyboardEvent;
}

describe('keyboardEvents mode switching', () => {
	const originalWindow = globalThis.window;
	let mockWindow: MockWindow;
	let featureFlags: State['featureFlags'];
	let set: ReturnType<typeof vi.fn>;
	let events: EventDispatcher;
	let store: StateManager<State>;

	beforeEach(() => {
		mockWindow = createMockWindow();
		Object.assign(globalThis, { window: mockWindow });

		featureFlags = {
			contextMenu: true,
			infoOverlay: true,
			moduleDragging: true,
			codeLineSelection: false,
			viewportDragging: true,
			viewportAnimations: false,
			editing: false,
			modeToggling: true,
			demoMode: false,
			historyTracking: true,
			consoleOverlay: true,
			positionOffsetters: true,
		};

		set = vi.fn((path: string, value: unknown) => {
			if (path === 'featureFlags.editing') {
				featureFlags.editing = value as boolean;
			}
			if (path === 'featureFlags.codeLineSelection') {
				featureFlags.codeLineSelection = value as boolean;
			}
			if (path === 'featureFlags.positionOffsetters') {
				featureFlags.positionOffsetters = value as boolean;
			}
		});

		events = {
			on: vi.fn(),
			off: vi.fn(),
			dispatch: vi.fn(),
		};

		store = {
			getState: () => ({ featureFlags }) as State,
			set,
		} as unknown as StateManager<State>;
	});

	afterEach(() => {
		Object.assign(globalThis, { window: originalWindow });
	});

	it('enters edit mode when i is pressed in view mode', () => {
		const cleanup = keyboardEvents(events, store);
		const event = createKeyboardEventLike('i');

		mockWindow.emit('keydown', event);

		expect(set).toHaveBeenCalledWith('featureFlags.editing', true);
		expect(set).toHaveBeenCalledWith('featureFlags.codeLineSelection', true);
		expect(event.preventDefault as ReturnType<typeof vi.fn>).toHaveBeenCalled();
		expect(events.dispatch).not.toHaveBeenCalled();
		cleanup();
	});

	it('returns to view mode when Escape is pressed in edit mode', () => {
		featureFlags.editing = true;
		const cleanup = keyboardEvents(events, store);
		const event = createKeyboardEventLike('Escape');

		mockWindow.emit('keydown', event);

		expect(set).toHaveBeenCalledWith('featureFlags.editing', false);
		expect(set).toHaveBeenCalledWith('featureFlags.codeLineSelection', false);
		expect(event.preventDefault as ReturnType<typeof vi.fn>).toHaveBeenCalled();
		cleanup();
	});

	it('keeps i as text insertion while already in edit mode', () => {
		featureFlags.editing = true;
		const cleanup = keyboardEvents(events, store);
		const event = createKeyboardEventLike('i');

		mockWindow.emit('keydown', event);

		expect(set).not.toHaveBeenCalledWith('featureFlags.editing', true);
		expect(events.dispatch).toHaveBeenCalledWith('insertText', { text: 'i' });
		cleanup();
	});

	it('does not toggle modes when modeToggling is disabled', () => {
		featureFlags.modeToggling = false;
		const cleanup = keyboardEvents(events, store);
		const enterEditEvent = createKeyboardEventLike('i');

		mockWindow.emit('keydown', enterEditEvent);

		expect(set).not.toHaveBeenCalledWith('featureFlags.editing', true);
		expect(set).not.toHaveBeenCalledWith('featureFlags.codeLineSelection', true);

		featureFlags.editing = true;
		const exitEditEvent = createKeyboardEventLike('Escape');
		mockWindow.emit('keydown', exitEditEvent);

		expect(set).not.toHaveBeenCalledWith('featureFlags.editing', false);
		expect(set).not.toHaveBeenCalledWith('featureFlags.codeLineSelection', false);
		cleanup();
	});
});
