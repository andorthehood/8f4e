import { describe, expect, it, vi } from 'vitest';

import editorMode from './effect';

import type { StateManager } from '@8f4e/state-manager';
import type { EventDispatcher, State } from '~/types';

describe('editorMode', () => {
	function setup(editorModeValue: State['editorMode'] = 'view', editing = false) {
		const handlers = new Map<string, (() => void)[]>();
		const state = {
			featureFlags: {
				editing,
				codeLineSelection: false,
			},
			editorMode: editorModeValue,
		} as State;
		const store = {
			getState: () => state,
			set: vi.fn((path: string, value: unknown) => {
				if (path === 'editorMode') {
					state.editorMode = value as State['editorMode'];
				}
				if (path === 'featureFlags.editing') {
					state.featureFlags.editing = value as boolean;
				}
				if (path === 'featureFlags.codeLineSelection') {
					state.featureFlags.codeLineSelection = value as boolean;
				}
			}),
		} as unknown as StateManager<State>;
		const events = {
			on: vi.fn((name: string, callback: () => void) => {
				const group = handlers.get(name) ?? [];
				group.push(callback);
				handlers.set(name, group);
			}),
			off: vi.fn(),
			dispatch: vi.fn(),
		} as unknown as EventDispatcher;

		editorMode(store, events);

		return {
			state,
			store,
			emit(name: string) {
				handlers.get(name)?.forEach(callback => callback());
			},
		};
	}

	it('enters edit mode from view mode', () => {
		const { emit, state } = setup();

		emit('enterEditMode');

		expect(state.editorMode).toBe('edit');
		expect(state.featureFlags.editing).toBe(true);
		expect(state.featureFlags.codeLineSelection).toBe(true);
	});

	it('enters presentation mode from view mode', () => {
		const { emit, state } = setup();

		emit('enterPresentationMode');

		expect(state.editorMode).toBe('presentation');
		expect(state.featureFlags.editing).toBe(false);
		expect(state.featureFlags.codeLineSelection).toBe(false);
	});

	it('enters recording mode from view mode', () => {
		const { emit, state } = setup();

		emit('enterRecordingMode');

		expect(state.editorMode).toBe('recording');
		expect(state.featureFlags.editing).toBe(false);
		expect(state.featureFlags.codeLineSelection).toBe(false);
	});

	it('returns to view mode from presentation mode', () => {
		const { emit, state } = setup('presentation', false);

		emit('exitToViewMode');

		expect(state.editorMode).toBe('view');
		expect(state.featureFlags.editing).toBe(false);
		expect(state.featureFlags.codeLineSelection).toBe(false);
	});

	it('returns to view mode from recording mode', () => {
		const { emit, state } = setup('recording', false);

		emit('exitToViewMode');

		expect(state.editorMode).toBe('view');
		expect(state.featureFlags.editing).toBe(false);
		expect(state.featureFlags.codeLineSelection).toBe(false);
	});

	it('returns to view mode from edit mode', () => {
		const { emit, state } = setup('edit', true);

		emit('exitToViewMode');

		expect(state.editorMode).toBe('view');
		expect(state.featureFlags.editing).toBe(false);
		expect(state.featureFlags.codeLineSelection).toBe(false);
	});
});
