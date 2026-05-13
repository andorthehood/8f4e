import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import serialPlugin from './plugin';

import type { State } from '@8f4e/editor-state-types';
import type { MemoryViews } from '@8f4e/web-ui';
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
				compiledModules: {},
			},
		} as unknown as State),
		events: {} as never,
		window: {} as Window,
		navigator: {} as Navigator,
		memoryViews: { uint8: new Uint8Array(16) } as MemoryViews,
		services: {
			getWasmExports: vi.fn(),
		},
		setErrors: vi.fn(),
	};
}

describe('serialPlugin', () => {
	it('cleans up serial info and plugin-owned errors', () => {
		const context = createContext();
		const cleanup = serialPlugin(context);

		expect(context.store.getState().info.serial).toEqual({});

		cleanup();

		expect(context.store.getState().info.serial).toBeUndefined();
		expect(context.setErrors).toHaveBeenLastCalledWith([]);
	});
});
