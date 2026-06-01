import createStateManager from '@8f4e/state-manager';
import { describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';
import tooltip from './effect';

function toCharacters(text: string): number[] {
	return [...text].map(char => char.charCodeAt(0));
}

describe('tooltip effect', () => {
	it('adds selected line stack analysis when compiler data is available', () => {
		const selectedBlock = createMockCodeBlock({
			code: ['push 1', 'push 2', 'add'],
			moduleId: 'test',
			cursor: {
				row: 2,
				col: 0,
				x: 0,
				y: 0,
			},
		});
		const state = createMockState({
			compiler: {
				compiledModules: {
					test: {
						stackAnalysis: [
							{
								lineNumber: 2,
								instruction: 'add',
								stackAnalysis: {
									stackBefore: [
										{ kind: 'value', valueType: 'int', knownIntegerValue: 1 },
										{ kind: 'value', valueType: 'int', knownIntegerValue: 2 },
									],
									consumedOperands: [
										{ kind: 'value', valueType: 'int', knownIntegerValue: 1 },
										{ kind: 'value', valueType: 'int', knownIntegerValue: 2 },
									],
									producedStackItems: [{ kind: 'value', valueType: 'int' }],
									stackAfter: [{ kind: 'value', valueType: 'int' }],
								},
							},
						],
					} as never,
				},
			},
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
			},
			tooltip: {
				text: [],
			},
		});
		const store = createStateManager(state);

		tooltip(store);

		expect(state.tooltip.text).toEqual([
			'add (T T -- T)',
			'Adds two numbers of the same',
			'type and pushes the result.',
			'before [-int=1, -int=2]',
			'after: [+int]',
		]);
		expect(state.tooltip.highlights).toEqual([
			{
				x: state.tooltip.layout.lineX + 8 * 8,
				y: state.tooltip.layout.y + 3 * 16,
				width: 6 * 8,
				height: 16,
				fillColor: 'tooltipConsumedHighlight',
			},
			{
				x: state.tooltip.layout.lineX + 16 * 8,
				y: state.tooltip.layout.y + 3 * 16,
				width: 6 * 8,
				height: 16,
				fillColor: 'tooltipConsumedHighlight',
			},
			{
				x: state.tooltip.layout.lineX + 8 * 8,
				y: state.tooltip.layout.y + 4 * 16,
				width: 4 * 8,
				height: 16,
				fillColor: 'tooltipAddedHighlight',
			},
		]);
	});

	it('adds selected function line stack analysis when compiler data is available', () => {
		const selectedBlock = createMockCodeBlock({
			id: 'function_helper',
			code: ['function helper', 'param int', 'param int', 'add', 'return', 'functionEnd'],
			blockType: 'function',
			cursor: {
				row: 3,
				col: 0,
				x: 0,
				y: 0,
			},
		});
		const state = createMockState({
			compiler: {
				compiledFunctions: {
					helper: {
						stackAnalysis: [
							{
								lineNumber: 3,
								instruction: 'add',
								stackAnalysis: {
									stackBefore: [
										{ kind: 'value', valueType: 'int', knownIntegerValue: 1 },
										{ kind: 'value', valueType: 'int', knownIntegerValue: 2 },
									],
									consumedOperands: [
										{ kind: 'value', valueType: 'int', knownIntegerValue: 1 },
										{ kind: 'value', valueType: 'int', knownIntegerValue: 2 },
									],
									producedStackItems: [{ kind: 'value', valueType: 'int' }],
									stackAfter: [{ kind: 'value', valueType: 'int' }],
								},
							},
						],
					} as never,
				},
			},
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
			},
			tooltip: {
				text: [],
			},
		});
		const store = createStateManager(state);

		tooltip(store);

		expect(state.tooltip.text).toEqual([
			'add (T T -- T)',
			'Adds two numbers of the same',
			'type and pushes the result.',
			'before [-int=1, -int=2]',
			'after: [+int]',
		]);
		expect(state.tooltip.highlights.map(highlight => highlight.fillColor)).toEqual([
			'tooltipConsumedHighlight',
			'tooltipConsumedHighlight',
			'tooltipAddedHighlight',
		]);
	});

	it('writes live value metadata for selected memory declarations', () => {
		const fontTooltipText = {};
		const fontTooltipHighlight = {};
		const selectedBlock = createMockCodeBlock({
			code: ['int value', 'add'],
			moduleId: 'test',
			cursor: {
				row: 0,
				col: 0,
				x: 0,
				y: 0,
			},
		});
		const state = createMockState({
			compiler: {
				compiledModules: {
					test: {
						memoryMap: {
							value: {
								id: 'value',
								numberOfElements: 1,
								byteAddress: 4,
								wordAlignedAddress: 1,
							},
						},
					} as never,
				},
			},
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
				spriteLookups: {
					fontTooltipText,
					fontTooltipHighlight,
				} as never,
			},
			tooltip: {
				text: [],
			},
		});
		const store = createStateManager(state);

		tooltip(store);

		expect(state.tooltip.text.slice(-2)).toEqual(['address: ', 'value: ']);
		expect(state.tooltip.characters.slice(-2)).toEqual([toCharacters('address: '), toCharacters('value: ')]);
		expect(state.tooltip.layout).toMatchObject({
			horizontalPadding: 8,
			height: state.tooltip.lineCount * 16,
			y: 0,
		});
		expect(state.tooltip.liveValues).toEqual([
			{
				x: state.tooltip.layout.lineX + 'address: '.length * 8,
				y: state.tooltip.layout.y + (state.tooltip.text.length - 2) * 16,
				source: { kind: 'memoryAddress', moduleId: 'test', memoryId: 'value' },
				color: fontTooltipHighlight,
			},
			{
				x: state.tooltip.layout.lineX + 'value: '.length * 8,
				y: state.tooltip.layout.y + (state.tooltip.text.length - 1) * 16,
				source: { kind: 'memoryValue', moduleId: 'test', memoryId: 'value', elementIndex: 0 },
				color: fontTooltipHighlight,
			},
		]);
		expect(state.tooltip.lineCount).toBe(state.tooltip.text.length);
		expect(state.tooltip.widthChars).toBeGreaterThanOrEqual(19);

		store.set('graphicHelper.selectedCodeBlock.cursor.row', 1);

		expect(state.tooltip.liveValues).toEqual([]);
	});

	it('writes documentation tooltip text when the selected line changes', () => {
		const selectedBlock = createMockCodeBlock({
			code: ['add', 'drop'],
			cursor: {
				row: 0,
				col: 0,
				x: 0,
				y: 0,
			},
		});
		const state = createMockState({
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
			},
			tooltip: {
				text: [],
			},
		});
		const store = createStateManager(state);

		tooltip(store);

		expect(state.tooltip.text).toEqual([
			'add (T T -- T)',
			'Adds two numbers of the same',
			'type and pushes the result.',
		]);

		store.set('graphicHelper.selectedCodeBlock.cursor.row', 1);

		expect(state.tooltip.text).toEqual(['drop (T -- )', 'Removes the top value from the', 'stack.']);
	});

	it('writes module execution order for selected module instructions', () => {
		const selectedBlock = createMockCodeBlock({
			id: 'module-b',
			moduleId: 'module-b',
			code: ['module module-b', 'push 1'],
			cursor: {
				row: 0,
				col: 0,
				x: 0,
				y: 0,
			},
		});
		const state = createMockState({
			compiler: {
				compiledModules: {
					'module-a': {} as never,
					'module-b': {} as never,
				},
			},
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
			},
			tooltip: {
				text: [],
			},
		});
		const store = createStateManager(state);

		tooltip(store);

		expect(state.tooltip.text).toEqual(['Starts a module block.', 'execution order: 2']);

		store.set('graphicHelper.selectedCodeBlock.cursor.row', 1);

		expect(state.tooltip.text).not.toContain('execution order: 2');
	});

	it('updates documentation tooltip text when the selected line text changes', () => {
		const selectedBlock = createMockCodeBlock({
			code: ['add'],
			cursor: {
				row: 0,
				col: 0,
				x: 0,
				y: 0,
			},
		});
		const state = createMockState({
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
			},
			tooltip: {
				text: [],
			},
		});
		const store = createStateManager(state);

		tooltip(store);

		store.set('graphicHelper.selectedCodeBlock.code', ['drop']);

		expect(state.tooltip.text).toEqual(['drop (T -- )', 'Removes the top value from the', 'stack.']);
	});

	it('clears tooltip text when line selection is disabled', () => {
		const selectedBlock = createMockCodeBlock();
		const state = createMockState({
			featureFlags: {
				codeLineSelection: false,
			},
			graphicHelper: {
				selectedCodeBlock: selectedBlock,
			},
			tooltip: {
				text: ['Old tooltip'],
			},
		});
		const store = createStateManager(state);

		tooltip(store);

		expect(state.tooltip.text).toEqual([]);
		expect(state.tooltip.highlights).toEqual([]);
		expect(state.tooltip.liveValues).toEqual([]);
	});
});
