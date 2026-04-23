import { describe, it, expect } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import graphicHelperEffect from './effect';

import centerViewportOnCodeBlock from '../../../viewport/centerViewportOnCodeBlock';

import { createMockState, createMockCodeBlock } from '~/pureHelpers/testingUtils/testUtils';
import { createMockEventDispatcherWithVitest } from '~/pureHelpers/testingUtils/vitestTestUtils';
import { EMPTY_DEFAULT_PROJECT } from '~/types';

describe('graphic helper error mapping', () => {
	it('maps typed compiler errors to function blocks', () => {
		const functionBlock = createMockCodeBlock({
			id: 'function_helper',
			code: ['function helper', 'push 1', 'functionEnd'],
			blockType: 'function',
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [functionBlock],
			},
			codeErrors: {
				compilationErrors: [
					{
						lineNumber: 2,
						codeBlockId: 'helper',
						codeBlockType: 'function',
						message: 'Memory access is not allowed in pure functions. (19)',
					},
				],
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		graphicHelperEffect(store, events);

		expect(functionBlock.widgets.errorMessages).toHaveLength(1);
		expect(functionBlock.widgets.errorMessages[0].lineNumber).toBe(2);
		expect(functionBlock.widgets.errorMessages[0].message).toContain(' Error:');
	});
});

describe('graphic helper hidden directive', () => {
	it('shows a hidden block only while selected', () => {
		const hiddenBlock = createMockCodeBlock({
			code: ['module hidden', '; @hidden', 'moduleEnd'],
			parsedDirectives: [
				{ prefix: '@', name: 'hidden', args: [], rawRow: 1, isTrailing: false, sourceLine: '; @hidden' },
			],
		});
		const otherBlock = createMockCodeBlock({
			id: 'other',
			code: ['module other', 'moduleEnd'],
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [hiddenBlock, otherBlock],
				spriteLookups: {
					fillColors: {},
					fontNumbers: {},
					fontCode: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
				} as never,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		graphicHelperEffect(store, events);
		store.set('graphicHelper.codeBlocks', state.graphicHelper.codeBlocks);

		expect(hiddenBlock.hidden).toBe(true);

		store.set('graphicHelper.selectedCodeBlock', hiddenBlock);
		expect(hiddenBlock.hidden).toBe(false);

		store.set('graphicHelper.selectedCodeBlock', otherBlock);
		expect(hiddenBlock.hidden).toBe(true);
	});
});

describe('graphic helper line numbers', () => {
	it('renders blank line-number gutters for pointer declaration instructions', () => {
		const pointerBlock = createMockCodeBlock({
			code: ['module demo', 'int* ptr &buffer', 'float* out &buffer', 'push 1', 'moduleEnd'],
		});
		const state = createMockState({
			graphicHelper: {
				codeBlocks: [pointerBlock],
				spriteLookups: {
					fillColors: {},
					fontNumbers: {},
					fontCode: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
				} as never,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		graphicHelperEffect(store, events);
		store.set('graphicHelper.codeBlocks', state.graphicHelper.codeBlocks);

		const renderedLines = pointerBlock.codeToRender.map(line =>
			line.map(cell => String.fromCharCode(Number(cell))).join('')
		);

		expect(renderedLines[0]?.slice(0, 2)).toBe('0 ');
		expect(renderedLines[1]?.slice(0, 2)).toBe('  ');
		expect(renderedLines[2]?.slice(0, 2)).toBe('  ');
		expect(renderedLines[3]?.slice(0, 2)).toBe('3 ');
	});
});

describe('graphic helper home directive', () => {
	it('centers the initial viewport using the home alignment hint', () => {
		const state = createMockState({
			initialProjectState: {
				...EMPTY_DEFAULT_PROJECT,
				codeBlocks: [
					{
						code: ['module home', '; @home top', '; @pos 10 20', 'moduleEnd'],
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
			graphicHelper: {
				spriteLookups: {
					fillColors: {},
					fontNumbers: {},
					fontCode: {},
					fontDisabledCode: {},
					fontLineNumber: {},
					fontCodeComment: {},
				} as never,
			},
		});
		const store = createStateManager(state);
		const events = createMockEventDispatcherWithVitest();

		graphicHelperEffect(store, events);
		store.set('initialProjectState', state.initialProjectState);

		expect(state.graphicHelper.codeBlocks).toHaveLength(1);
		const [homeBlock] = state.graphicHelper.codeBlocks;
		expect(homeBlock.isHome).toBe(true);
		expect(homeBlock.homeAlignment).toBe('top');
		expect(centerViewportOnCodeBlock(state.viewport, homeBlock, { alignment: 'top' })).toEqual({
			x: state.viewport.x,
			y: state.viewport.y,
		});
	});
});
