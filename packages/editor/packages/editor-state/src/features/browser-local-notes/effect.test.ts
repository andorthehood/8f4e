import createStateManager from '@8f4e/state-manager';
import { describe, expect, it, vi } from 'vitest';
import { EMPTY_DEFAULT_PROJECT } from '~/features/project-import/emptyDefaultProject';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import browserLocalNotes from './effect';

function getPopulateHandler(events: ReturnType<typeof createMockEventDispatcherWithVitest>) {
	const handler = events.on.mock.calls.find(([eventName]) => eventName === 'projectCodeBlocksPopulated')?.[1];
	expect(handler).toBeTypeOf('function');
	return handler;
}

function getEventHandler(events: ReturnType<typeof createMockEventDispatcherWithVitest>, eventName: string) {
	const handler = events.on.mock.calls.find(([candidate]) => candidate === eventName)?.[1];
	expect(handler).toBeTypeOf('function');
	return handler;
}

describe('browser-local note placement', () => {
	it('moves colliding browser-local notes to the first free y positions for their x span', async () => {
		const existingTopBlock = createMockCodeBlock({
			id: 'top',
			gridX: 0,
			gridY: 0,
			width: 32 * 8,
			height: 4 * 16,
			code: ['module top', 'moduleEnd'],
		});
		const existingBottomBlock = createMockCodeBlock({
			id: 'bottom',
			gridX: 0,
			gridY: 8,
			width: 32 * 8,
			height: 3 * 16,
			code: ['module bottom', 'moduleEnd'],
		});
		const loadBrowserLocalNotes = vi.fn(async () => [
			{
				code: ['note local.editorConfig', '; config', 'noteEnd'],
				gridCoordinates: { x: 0, y: 0 },
			},
			{
				code: ['note local.scratchpad', '; scratch', 'noteEnd'],
				gridCoordinates: { x: 0, y: 0 },
			},
		]);
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadBrowserLocalNotes,
			},
			codeBlockRendering: {
				codeBlocks: [existingTopBlock, existingBottomBlock],
				nextCodeBlockCreationIndex: 2,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		browserLocalNotes(store, events);

		await getPopulateHandler(events)();

		expect(loadBrowserLocalNotes).toHaveBeenCalledOnce();
		expect(state.codeBlockRendering.codeBlocks).toHaveLength(4);
		expect(state.codeBlockRendering.codeBlocks[2].gridX).toBe(0);
		expect(state.codeBlockRendering.codeBlocks[2].gridY).toBe(13);
		expect(state.codeBlockRendering.codeBlocks[2].code).toContain('; @pos 0 13');
		expect(state.codeBlockRendering.codeBlocks[3].gridX).toBe(0);
		expect(state.codeBlockRendering.codeBlocks[3].gridY).toBe(18);
		expect(state.codeBlockRendering.codeBlocks[3].code).toContain('; @pos 0 18');
	});

	it('preserves stored coordinates when the preferred slot is already free', async () => {
		const loadBrowserLocalNotes = vi.fn(async () => [
			{
				code: ['note local.editorConfig', '; config', 'noteEnd'],
				gridCoordinates: { x: 20, y: 7 },
			},
		]);
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadBrowserLocalNotes,
			},
			codeBlockRendering: {
				codeBlocks: [
					createMockCodeBlock({
						id: 'existing',
						gridX: 0,
						gridY: 0,
						width: 32 * 8,
						height: 4 * 16,
						code: ['module existing', 'moduleEnd'],
					}),
				],
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		browserLocalNotes(store, events);

		await getPopulateHandler(events)();

		expect(state.codeBlockRendering.codeBlocks[1].gridX).toBe(20);
		expect(state.codeBlockRendering.codeBlocks[1].gridY).toBe(7);
		expect(state.codeBlockRendering.codeBlocks[1].code).toContain('; @pos 20 7');
	});

	it('does not reposition viewport-anchored browser-local notes', async () => {
		const loadBrowserLocalNotes = vi.fn(async () => [
			{
				code: ['note local.toolbar', '; @viewport top-right', '; @pos 4 5', 'noteEnd'],
				gridCoordinates: { x: 4, y: 5 },
			},
		]);
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadBrowserLocalNotes,
			},
			codeBlockRendering: {
				codeBlocks: [
					createMockCodeBlock({
						id: 'existing',
						gridX: 4,
						gridY: 5,
						width: 32 * 8,
						height: 4 * 16,
						code: ['module existing', 'moduleEnd'],
					}),
				],
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		browserLocalNotes(store, events);

		await getPopulateHandler(events)();

		expect(state.codeBlockRendering.codeBlocks[1].viewportAnchor).toBe('top-right');
		expect(state.codeBlockRendering.codeBlocks[1].gridX).toBe(4);
		expect(state.codeBlockRendering.codeBlocks[1].gridY).toBe(5);
		expect(state.codeBlockRendering.codeBlocks[1].code).toContain('; @pos 4 5');
	});

	it('uses the default local editor config note when storage has no valid local notes', async () => {
		const loadBrowserLocalNotes = vi.fn(async () => [
			{
				code: ['module editorConfig', '; old config', 'moduleEnd'],
				gridCoordinates: { x: 0, y: 0 },
			},
		]);
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadBrowserLocalNotes,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		browserLocalNotes(store, events);

		await getPopulateHandler(events)();

		expect(state.codeBlockRendering.codeBlocks).toHaveLength(1);
		expect(state.codeBlockRendering.codeBlocks[0].code[0]).toBe('note local.editorConfig');
	});
});

describe('browser-local note persistence', () => {
	it('does not save an empty local note list before local notes are populated for a project', () => {
		const saveBrowserLocalNotes = vi.fn(async () => undefined);
		const state = createMockState({
			callbacks: {
				saveBrowserLocalNotes,
			},
			codeBlockRendering: {
				codeBlocks: [],
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		browserLocalNotes(store, events);
		store.set('codeBlockRendering.codeBlocks', [
			createMockCodeBlock({
				code: ['module projectBlock', 'moduleEnd'],
			}),
		]);

		expect(saveBrowserLocalNotes).not.toHaveBeenCalled();
	});

	it('does not overwrite stored local notes when project code blocks are replaced during project load', async () => {
		let storedBlocks = [
			{
				code: ['note local.scratchpad', 'keep me', 'noteEnd'],
				gridCoordinates: { x: 10, y: 20 },
			},
		];
		const loadBrowserLocalNotes = vi.fn(async () => storedBlocks);
		const saveBrowserLocalNotes = vi.fn(async nextBlocks => {
			storedBlocks = nextBlocks;
		});
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadBrowserLocalNotes,
				saveBrowserLocalNotes,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		browserLocalNotes(store, events);
		const populateBrowserLocalNotes = getPopulateHandler(events);
		await populateBrowserLocalNotes();
		saveBrowserLocalNotes.mockClear();

		store.set('codeBlockRendering.codeBlocks', [
			createMockCodeBlock({
				code: ['module projectOnly', 'moduleEnd'],
			}),
		]);
		expect(saveBrowserLocalNotes).not.toHaveBeenCalled();

		await populateBrowserLocalNotes();

		expect(state.codeBlockRendering.codeBlocks.map(block => block.code[0])).toEqual([
			'module projectOnly',
			'note local.scratchpad',
		]);
	});

	it('saves browser-local notes when a local note is edited without compiler triggers', async () => {
		const saveBrowserLocalNotes = vi.fn(async () => undefined);
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadBrowserLocalNotes: vi.fn(async () => [
					{
						code: ['note local.editorConfig', '; @pos 1 2', 'noteEnd'],
						gridCoordinates: { x: 1, y: 2 },
					},
				]),
				saveBrowserLocalNotes,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		browserLocalNotes(store, events);
		await getPopulateHandler(events)();
		saveBrowserLocalNotes.mockClear();

		const codeBlock = state.codeBlockRendering.codeBlocks[0];
		state.codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger = codeBlock;
		codeBlock.code = ['note local.editorConfig', '; @pos 3 4', 'noteEnd'];
		codeBlock.gridX = 3;
		codeBlock.gridY = 4;
		store.set('codeBlockRendering.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code', codeBlock.code);

		expect(saveBrowserLocalNotes).toHaveBeenCalledWith([
			{
				code: ['note local.editorConfig', '; @pos 3 4', 'noteEnd'],
				disabled: false,
				gridCoordinates: { x: 3, y: 4 },
			},
		]);
	});

	it('saves an empty local note list when local notes are deleted', async () => {
		const saveBrowserLocalNotes = vi.fn(async () => undefined);
		const state = createMockState({
			initialProjectState: { ...EMPTY_DEFAULT_PROJECT },
			callbacks: {
				loadBrowserLocalNotes: vi.fn(async () => [
					{
						code: ['note local.editorConfig', '; @pos 1 2', 'noteEnd'],
						gridCoordinates: { x: 1, y: 2 },
					},
				]),
				saveBrowserLocalNotes,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		browserLocalNotes(store, events);
		await getPopulateHandler(events)();
		saveBrowserLocalNotes.mockClear();

		const codeBlock = state.codeBlockRendering.codeBlocks[0];
		store.set('codeBlockRendering.codeBlocks', []);
		getEventHandler(events, 'deleteCodeBlock')({ codeBlock });

		expect(saveBrowserLocalNotes).toHaveBeenCalledWith([]);
	});
});
