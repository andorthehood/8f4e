import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import midiPlugin from './plugin';

import type { State } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext } from '../types';

function createContext(): EditorEnvironmentPluginContext {
	return {
		store: createStateManager({
			info: {},
			graphicHelper: {
				codeBlocks: [],
			},
			compiler: {
				isCompiling: false,
			},
		} as unknown as State),
		events: {} as never,
		window: {} as Window,
		navigator: {} as Navigator,
		memoryViews: {} as never,
		wasmExports: {
			getExports: vi.fn(async () => undefined),
			invalidate: vi.fn(),
		},
		setErrors: vi.fn(),
	};
}

describe('midiPlugin', () => {
	it('cleans up MIDI info and plugin-owned errors', () => {
		const context = createContext();
		const cleanup = midiPlugin(context);

		expect(context.store.getState().info.midi).toEqual({});

		cleanup();

		expect(context.store.getState().info.midi).toBeUndefined();
		expect(context.setErrors).toHaveBeenLastCalledWith([]);
	});
});
