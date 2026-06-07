import type { State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { describe, expect, it, vi } from 'vitest';
import type { EditorEnvironmentPluginContext } from '../types';
import midiPlugin from './plugin';

function createContext(): EditorEnvironmentPluginContext {
	return {
		store: createStateManager({
			info: {},
			codeBlockRendering: {
				codeBlocks: [],
			},
			compiler: {
				isCompiling: false,
			},
			editorConfig: {},
		} as unknown as State),
		events: {} as never,
		window: {} as Window,
		navigator: {} as Navigator,
		memoryViews: {} as never,
		services: {
			getWasmExports: vi.fn(),
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
