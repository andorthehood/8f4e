import { describe, expect, it, vi } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import { createEditorEnvironmentPluginManager } from './manager';

import type { CodeBlockGraphicData, EventDispatcher, State } from '@8f4e/editor-state-types';
import type { EditorEnvironmentPluginContext, EditorEnvironmentPluginRegistryEntry } from './types';

function createState(codeBlocks: CodeBlockGraphicData[] = []): State {
	return {
		graphicHelper: {
			codeBlocks,
		},
		codeErrors: {
			compilationErrors: [],
			globalEditorDirectiveErrors: [],
			editorEnvironmentPluginErrors: {},
			shaderErrors: [],
			runtimeDirectiveErrors: [],
		},
	} as unknown as State;
}

function createCodeBlockWithEditorDirective(name: string): CodeBlockGraphicData {
	return {
		parsedDirectives: [
			{
				prefix: '@',
				name,
				args: [],
				rawRow: 0,
				isTrailing: false,
			},
		],
	} as unknown as CodeBlockGraphicData;
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe('editor environment plugin manager', () => {
	const events = {
		on: vi.fn(),
		off: vi.fn(),
		dispatch: vi.fn(),
	} as EventDispatcher;
	const windowMock = {} as Window;
	const navigatorMock = {} as Navigator;

	it('lazy-loads a plugin when one of its editor directives appears', async () => {
		const dispose = vi.fn();
		const start = vi.fn(() => dispose);
		const load = vi.fn(async () => ({ default: { start } }));
		const registry: EditorEnvironmentPluginRegistryEntry[] = [
			{
				id: 'test-plugin',
				editorDirectives: ['testDirective'],
				load,
			},
		];
		const store = createStateManager(createState());

		const cleanup = createEditorEnvironmentPluginManager(store, events, {
			window: windowMock,
			navigator: navigatorMock,
			registry,
		});

		expect(load).not.toHaveBeenCalled();

		store.set('graphicHelper.codeBlocks', [createCodeBlockWithEditorDirective('testDirective')]);
		await flushPromises();

		expect(load).toHaveBeenCalledTimes(1);
		expect(start).toHaveBeenCalledTimes(1);
		expect(start).toHaveBeenCalledWith(
			expect.objectContaining({
				store,
				events,
				window: windowMock,
				navigator: navigatorMock,
			})
		);

		cleanup();
	});

	it('disposes an active plugin when its trigger directives disappear', async () => {
		const dispose = vi.fn();
		const start = vi.fn(() => dispose);
		const registry: EditorEnvironmentPluginRegistryEntry[] = [
			{
				id: 'test-plugin',
				editorDirectives: ['testDirective'],
				load: vi.fn(async () => ({ default: { start } })),
			},
		];
		const store = createStateManager(createState([createCodeBlockWithEditorDirective('testDirective')]));

		createEditorEnvironmentPluginManager(store, events, {
			window: windowMock,
			navigator: navigatorMock,
			registry,
		});
		await flushPromises();

		store.set('graphicHelper.codeBlocks', []);

		expect(dispose).toHaveBeenCalledTimes(1);
	});

	it('lets plugins own and clear their scoped errors', async () => {
		const pluginError = {
			codeBlockId: 'test-block',
			lineNumber: 1,
			message: 'Plugin-specific directive error',
		};
		const start = vi.fn((context: EditorEnvironmentPluginContext) => {
			context.setErrors([pluginError]);
			return () => {};
		});
		const registry: EditorEnvironmentPluginRegistryEntry[] = [
			{
				id: 'test-plugin',
				editorDirectives: ['testDirective'],
				load: vi.fn(async () => ({ default: { start } })),
			},
		];
		const store = createStateManager(createState([createCodeBlockWithEditorDirective('testDirective')]));

		createEditorEnvironmentPluginManager(store, events, {
			window: windowMock,
			navigator: navigatorMock,
			registry,
		});
		await flushPromises();

		expect(store.getState().codeErrors.editorEnvironmentPluginErrors).toEqual({
			'test-plugin': [pluginError],
		});

		store.set('graphicHelper.codeBlocks', []);

		expect(store.getState().codeErrors.editorEnvironmentPluginErrors).toEqual({});
	});

	it('ignores a stale plugin import if the directive disappears before loading finishes', async () => {
		const start = vi.fn();
		let resolveLoad: (value: { default: { start: typeof start } }) => void = () => {};
		const load = vi.fn(
			() =>
				new Promise<{ default: { start: typeof start } }>(resolve => {
					resolveLoad = resolve;
				})
		);
		const registry: EditorEnvironmentPluginRegistryEntry[] = [
			{
				id: 'test-plugin',
				editorDirectives: ['testDirective'],
				load,
			},
		];
		const store = createStateManager(createState());

		createEditorEnvironmentPluginManager(store, events, {
			window: windowMock,
			navigator: navigatorMock,
			registry,
		});

		store.set('graphicHelper.codeBlocks', [createCodeBlockWithEditorDirective('testDirective')]);
		store.set('graphicHelper.codeBlocks', []);

		resolveLoad({ default: { start } });
		await flushPromises();

		expect(start).not.toHaveBeenCalled();
	});
});
