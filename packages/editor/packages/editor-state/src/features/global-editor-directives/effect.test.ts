import type { State } from '@8f4e/editor-state-types';
import createStateManager from '@8f4e/state-manager';
import { describe, expect, it, vi } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import runtimeEffect from '../runtime/effect';
import globalEditorDirectivesEffect from './effect';

describe('globalEditorDirectivesEffect', () => {
	it('keeps the runtime alive when the rendered project-group slice changes', async () => {
		const destroyRuntime = vi.fn();
		const runtimeFactory = vi.fn(() => destroyRuntime);
		const nestedCodeBlocks = [createMockCodeBlock({ code: ['module nested', 'moduleEnd'] })];
		const rootCodeBlocks = [
			createMockCodeBlock({
				code: ['module projectConfig', '; @config runtime WebWorkerRuntime', 'moduleEnd'],
			}),
			createMockCodeBlock({
				code: ['group nested', 'groupEnd'],
				nestedProjectCodeBlocks: nestedCodeBlocks,
			}),
		];
		const state = createMockState({
			runtimeRegistry: {
				WebWorkerRuntime: {
					id: 'WebWorkerRuntime',
					factory: runtimeFactory,
				},
			},
			codeBlockRendering: {
				rootCodeBlocks,
				codeBlocks: rootCodeBlocks,
			},
		});
		const store = createStateManager(state as State);
		const events = createMockEventDispatcherWithVitest();

		await runtimeEffect(store, events);
		globalEditorDirectivesEffect(store);
		store.set('codeBlockRendering.codeBlocks', rootCodeBlocks);
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(state.editorConfig.runtime).toBe('WebWorkerRuntime');
		expect(runtimeFactory).toHaveBeenCalledTimes(1);

		store.set('codeBlockRendering.codeBlocks', nestedCodeBlocks);
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(state.editorConfig.runtime).toBe('WebWorkerRuntime');
		expect(runtimeFactory).toHaveBeenCalledTimes(1);
		expect(destroyRuntime).not.toHaveBeenCalled();

		store.set('codeBlockRendering.codeBlocks', rootCodeBlocks);
		await new Promise(resolve => setTimeout(resolve, 0));

		expect(runtimeFactory).toHaveBeenCalledTimes(1);
		expect(destroyRuntime).not.toHaveBeenCalled();
	});
});
