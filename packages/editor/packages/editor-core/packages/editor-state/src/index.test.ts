import type { EventDispatcher, PianoKeyboard } from '@8f4e/editor-state-types';
import { describe, expect, it, vi } from 'vitest';
import initState from './index';
import { createMockCodeBlock } from './pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from './pureHelpers/testingUtils/vitestTestUtils';

describe('editor state lifecycle', () => {
	it('initializes the requested editor mode and synchronizes editing', () => {
		const events = createMockEventDispatcherWithVitest();
		const store = initState(events, {
			callbacks: { loadSession: async () => null },
			initialEditorMode: 'edit',
			runtimeRegistry: {},
		});

		expect(store.getState().editorMode).toBe('edit');
		expect(store.getState().featureFlags.editing).toBe(true);

		store.dispose();
	});

	it('enables browser-local notes by default and allows disabling them at initialization', () => {
		const enabledEvents = createMockEventDispatcherWithVitest();
		const enabledStore = initState(enabledEvents, {
			callbacks: { loadSession: async () => null },
			runtimeRegistry: {},
		});
		const disabledEvents = createMockEventDispatcherWithVitest();
		const disabledStore = initState(disabledEvents, {
			callbacks: { loadSession: async () => null },
			runtimeRegistry: {},
			featureFlags: { browserLocalNotes: false },
		});

		expect(enabledStore.getState().featureFlags.browserLocalNotes).toBe(true);
		expect(enabledEvents.on).toHaveBeenCalledWith('projectCodeBlocksPopulated', expect.any(Function));
		expect(disabledStore.getState().featureFlags.browserLocalNotes).toBe(false);
		expect(disabledEvents.on).not.toHaveBeenCalledWith('projectCodeBlocksPopulated', expect.any(Function));

		enabledStore.dispose();
		disabledStore.dispose();
	});

	it('disposes initialized effects and their active runtime exactly once', async () => {
		const runtimeDestroyer = vi.fn();
		const runtimeFactory = vi.fn(() => runtimeDestroyer);
		const events = createMockEventDispatcherWithVitest();
		const store = initState(events, {
			callbacks: { loadSession: async () => null },
			runtimeRegistry: {
				TestRuntime: {
					id: 'TestRuntime',
					factory: runtimeFactory,
				},
			},
		});

		store.getState().editorConfig.runtime = 'TestRuntime';
		store.set('compiler.isCompiling', false);
		await Promise.resolve();
		store.dispose();
		store.dispose();

		expect(runtimeFactory).toHaveBeenCalledOnce();
		expect(runtimeDestroyer).toHaveBeenCalledOnce();
	});
	it.each([0, Infinity])(
		'consumes a menu click over a piano before saving or dismissing (highlighted item: %s)',
		highlightedItem => {
			const handlers = new Map<string, Array<(event: unknown) => void>>();
			const events: EventDispatcher = {
				on: (name, handler) => {
					handlers.set(name, [...(handlers.get(name) ?? []), handler as (event: unknown) => void]);
				},
				off: (name, handler) => {
					handlers.set(
						name,
						(handlers.get(name) ?? []).filter(candidate => candidate !== handler)
					);
				},
				dispatch: (name, event) => {
					for (const handler of handlers.get(name) ?? []) {
						if ((event as { stopPropagation?: boolean } | undefined)?.stopPropagation) break;
						handler(event);
					}
				},
			};
			const memory = new Map([
				[4, 2],
				[5, 3],
				[6, 2],
			]);
			const setWordInMemory = vi.fn((address: number, value: number) => memory.set(address, value));
			const store = initState(events, {
				callbacks: {
					loadSession: async () => null,
					getWordFromMemory: address => memory.get(address) ?? 0,
					setWordInMemory,
				},
				initialEditorMode: 'edit',
				runtimeRegistry: {},
			});
			const state = store.getState();
			const codeBlock = createMockCodeBlock({
				x: 0,
				y: 0,
				width: 192,
				height: 96,
				blockType: 'module',
				code: ['module synth', 'int[] notes 2 2 3', 'int count 2', '; @piano &notes &count', 'moduleEnd'],
			});
			codeBlock.widgets.pianoKeyboards = [
				{
					x: 0,
					y: 0,
					width: 192,
					height: 96,
					keyWidth: 8,
					lineNumber: 3,
					startingNumber: 0,
					keys: Array.from({ length: 24 }, (_, offset) => ({ offset })),
					pressedKeysListMemory: {
						id: 'notes',
						wordAlignedAddress: 4,
						numberOfElements: 2,
						elementWordSize: 4,
						isInteger: true,
					},
					pressedNumberOfKeysMemory: { id: 'count', wordAlignedAddress: 6, isInteger: true },
				} as PianoKeyboard,
			];
			state.viewport.x = 0;
			state.viewport.y = 0;
			state.codeBlockRendering.codeBlocks = [codeBlock];
			state.codeBlockRendering.selectedCodeBlock = codeBlock;
			state.contextMenu.open = true;
			state.contextMenu.highlightedItem = highlightedItem;
			state.contextMenu.items = [
				{
					title: 'Save slider and piano values to code',
					action: 'saveSliderValuesToCode',
					payload: { codeBlock },
					close: true,
				},
			];
			const onCodeBlockClick = vi.fn();
			events.on('codeBlockClick', onCodeBlockClick);
			const click = {
				x: 17,
				y: 1,
				movementX: 0,
				movementY: 0,
				buttons: 1,
				altKey: false,
				canvasWidth: 800,
				canvasHeight: 600,
				stopPropagation: false,
			};

			events.dispatch('mousedown', click);

			expect(state.contextMenu.open).toBe(false);
			expect(click.stopPropagation).toBe(true);
			expect(onCodeBlockClick).not.toHaveBeenCalled();
			expect(setWordInMemory).not.toHaveBeenCalled();
			expect(memory.get(4)).toBe(2);
			expect(memory.get(5)).toBe(3);
			expect(memory.get(6)).toBe(2);
			expect(codeBlock.code[1]).toBe('int[] notes 2 2 3');
			expect(state.codeBlockRendering.draggedCodeBlock).toBeUndefined();

			store.dispose();
		}
	);
});
