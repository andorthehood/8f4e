import createStateManager from '@8f4e/state-manager';
import { describe, expect, it, type Mock, vi } from 'vitest';
import { EMPTY_DEFAULT_PROJECT } from '~/features/project-import/emptyDefaultProject';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import centerViewportOnCodeBlock from '../viewport/centerViewportOnCodeBlock';
import codeBlockRenderingEffect from './effect';

describe('code block rendering error mapping', () => {
	it('maps compiler errors by creationIndex', () => {
		const functionBlock = createMockCodeBlock({
			name: 'helper',
			creationIndex: 7,
			code: ['function helper', 'push 1', 'functionEnd'],
			blockType: 'function',
		});
		const state = createMockState({
			codeBlockRendering: {
				codeBlocks: [functionBlock],
			},
			codeErrors: {
				compilationErrors: [
					{
						lineNumber: 2,
						codeBlockId: 7,
						message: 'Memory access is not allowed in pure functions. (19)',
					},
				],
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		codeBlockRenderingEffect(store, events);

		expect(functionBlock.widgets.errorMessages).toHaveLength(1);
		expect(functionBlock.widgets.errorMessages[0].lineNumber).toBe(2);
		expect(functionBlock.widgets.errorMessages[0].message).toContain(' Error:');
	});
});

describe('code block rendering hidden directive', () => {
	it('shows a hidden block only while selected', () => {
		const hiddenBlock = createMockCodeBlock({
			code: ['module hidden', '; @hidden', 'moduleEnd'],
			parsedDirectives: [
				{ prefix: '@', name: 'hidden', args: [], rawRow: 1, isTrailing: false, sourceLine: '; @hidden' },
			],
		});
		const otherBlock = createMockCodeBlock({
			name: 'other',
			code: ['module other', 'moduleEnd'],
		});
		const state = createMockState({
			codeBlockRendering: {
				codeBlocks: [hiddenBlock, otherBlock],
			},
			spriteLookups: {
				fillColors: {},
				fontNumbers: {},
				fontCode: {},
				fontDisabledCode: {},
				fontLineNumber: {},
				fontCodeComment: {},
			} as never,
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		codeBlockRenderingEffect(store, events);
		store.set('codeBlockRendering.codeBlocks', state.codeBlockRendering.codeBlocks);

		expect(hiddenBlock.hidden).toBe(true);

		store.set('codeBlockRendering.selectedCodeBlock', hiddenBlock);
		expect(hiddenBlock.hidden).toBe(false);

		store.set('codeBlockRendering.selectedCodeBlock', otherBlock);
		expect(hiddenBlock.hidden).toBe(true);
	});
});

describe('code block rendering cursor selection', () => {
	it('updates the selected code block cursor through the store when a line is clicked', () => {
		const selectedBlock = createMockCodeBlock({
			code: ['zero', 'one', 'two'],
			lineNumberColumnWidth: 1,
		});
		const state = createMockState({
			featureFlags: {
				codeLineSelection: true,
			},
			codeBlockRendering: {
				codeBlocks: [selectedBlock],
				selectedCodeBlock: selectedBlock,
			},
			viewport: {
				vGrid: 8,
				hGrid: 16,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();
		const onSelectedRowChanged = vi.fn();

		store.subscribe('codeBlockRendering.selectedCodeBlock.cursor.row', onSelectedRowChanged);
		codeBlockRenderingEffect(store, events);

		const codeBlockClickHandler = (events.on as Mock).mock.calls.find(
			([eventName]) => eventName === 'codeBlockClick'
		)?.[1] as ((event: { relativeX: number; relativeY: number; codeBlock: typeof selectedBlock }) => void) | undefined;

		codeBlockClickHandler?.({
			relativeX: 0,
			relativeY: state.viewport.hGrid,
			codeBlock: selectedBlock,
		});

		expect(selectedBlock.cursor.row).toBe(1);
		expect(onSelectedRowChanged).toHaveBeenCalledWith(1);
	});
});

describe('code block rendering line numbers', () => {
	it('renders blank line-number gutters for pointer declaration instructions', () => {
		const pointerBlock = createMockCodeBlock({
			code: ['module demo', 'int* ptr &buffer', 'float* out &buffer', 'push 1', 'moduleEnd'],
		});
		const state = createMockState({
			codeBlockRendering: {
				codeBlocks: [pointerBlock],
			},
			spriteLookups: {
				fillColors: {},
				fontNumbers: {},
				fontCode: {},
				fontDisabledCode: {},
				fontLineNumber: {},
				fontCodeComment: {},
			} as never,
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		codeBlockRenderingEffect(store, events);
		store.set('codeBlockRendering.codeBlocks', state.codeBlockRendering.codeBlocks);

		const renderedLines = pointerBlock.codeToRender.map(line =>
			line.map(cell => String.fromCharCode(Number(cell))).join('')
		);

		expect(renderedLines[0]?.slice(0, 2)).toBe('0 ');
		expect(renderedLines[1]?.slice(0, 2)).toBe('  ');
		expect(renderedLines[2]?.slice(0, 2)).toBe('  ');
		expect(renderedLines[3]?.slice(0, 2)).toBe('3 ');
	});
});

describe('code block rendering home directive', () => {
	it('centers the initial viewport using the home alignment hint', () => {
		const state = createMockState({
			initialProjectState: {
				...EMPTY_DEFAULT_PROJECT,
				codeBlocks: [
					{
						code: ['module home', '; @home top', '; @pos 10 20', 'moduleEnd'],
						entry: 'main',
					},
				],
			},
			viewport: {
				x: 0,
				y: 0,
				width: 200,
				height: 200,
				roundedWidth: 200,
				roundedHeight: 200,
				vGrid: 8,
				hGrid: 16,
			},
			spriteLookups: {
				fillColors: {},
				fontNumbers: {},
				fontCode: {},
				fontDisabledCode: {},
				fontLineNumber: {},
				fontCodeComment: {},
			} as never,
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		codeBlockRenderingEffect(store, events);
		store.set('initialProjectState', state.initialProjectState);

		expect(state.codeBlockRendering.codeBlocks).toHaveLength(1);
		const [homeBlock] = state.codeBlockRendering.codeBlocks;
		expect(homeBlock.isHome).toBe(true);
		expect(homeBlock.homeAlignment).toBe('top');
		expect(state.codeBlockRendering.selectedCodeBlock).toBe(homeBlock);
		expect(centerViewportOnCodeBlock(state.viewport, homeBlock, { alignment: 'top' })).toEqual({
			x: state.viewport.x,
			y: state.viewport.y,
		});
	});

	it('keeps the selected home block centered after a font grid change', () => {
		const state = createMockState({
			initialProjectState: {
				...EMPTY_DEFAULT_PROJECT,
				codeBlocks: [
					{
						code: ['module home', '; @home', '; @pos 10 20', 'moduleEnd'],
						entry: 'main',
					},
				],
			},
			viewport: {
				x: 0,
				y: 0,
				width: 200,
				height: 200,
				roundedWidth: 200,
				roundedHeight: 200,
				vGrid: 8,
				hGrid: 16,
			},
			spriteLookups: {
				fillColors: {},
				fontNumbers: {},
				fontCode: {},
				fontDisabledCode: {},
				fontLineNumber: {},
				fontCodeComment: {},
			} as never,
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		codeBlockRenderingEffect(store, events);
		store.set('initialProjectState', state.initialProjectState);

		const [homeBlock] = state.codeBlockRendering.codeBlocks;
		expect(state.codeBlockRendering.selectedCodeBlock).toBe(homeBlock);

		state.viewport.vGrid = 6;
		state.viewport.hGrid = 12;
		const spriteSheetRerenderedHandler = (events.on as Mock).mock.calls.find(
			([eventName]) => eventName === 'spriteSheetRerendered'
		)?.[1] as (() => void) | undefined;
		spriteSheetRerenderedHandler?.();

		expect({ x: homeBlock.x, y: homeBlock.y }).toEqual({
			x: homeBlock.gridX * state.viewport.vGrid,
			y: homeBlock.gridY * state.viewport.hGrid,
		});
		expect(centerViewportOnCodeBlock(state.viewport, homeBlock)).toEqual({
			x: state.viewport.x,
			y: state.viewport.y,
		});
	});

	it('keeps the selected code block centered after a font grid change', () => {
		const selectedBlock = createMockCodeBlock({
			name: 'selected',
			code: ['module selected', '; @pos 10 20', 'moduleEnd'],
			gridX: 10,
			gridY: 20,
			x: 80,
			y: 320,
		});
		const state = createMockState({
			codeBlockRendering: {
				codeBlocks: [selectedBlock],
				selectedCodeBlock: selectedBlock,
			},
			spriteLookups: {
				fillColors: {},
				fontNumbers: {},
				fontCode: {},
				fontDisabledCode: {},
				fontLineNumber: {},
				fontCodeComment: {},
			} as never,
			viewport: {
				x: 0,
				y: 0,
				width: 200,
				height: 200,
				roundedWidth: 200,
				roundedHeight: 200,
				vGrid: 8,
				hGrid: 16,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		codeBlockRenderingEffect(store, events);
		state.viewport.vGrid = 6;
		state.viewport.hGrid = 12;
		const spriteSheetRerenderedHandler = (events.on as Mock).mock.calls.find(
			([eventName]) => eventName === 'spriteSheetRerendered'
		)?.[1] as (() => void) | undefined;
		spriteSheetRerenderedHandler?.();

		expect({ x: selectedBlock.x, y: selectedBlock.y }).toEqual({
			x: selectedBlock.gridX * state.viewport.vGrid,
			y: selectedBlock.gridY * state.viewport.hGrid,
		});
		expect(centerViewportOnCodeBlock(state.viewport, selectedBlock)).toEqual({
			x: state.viewport.x,
			y: state.viewport.y,
		});
	});
});
