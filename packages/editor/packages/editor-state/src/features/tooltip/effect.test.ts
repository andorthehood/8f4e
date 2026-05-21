import { describe, expect, it } from 'vitest';
import createStateManager from '@8f4e/state-manager';

import tooltip, {
	TOOLTIP_WRAP_WIDTH,
	getInstructionNameFromSourceLine,
	getInstructionSpecFromSourceLine,
	getMemoryDeclarationIdFromSourceLine,
	getSelectedLineTooltipContent,
	getSelectedLineTooltipText,
	getStackAnalysisTooltipText,
	getStackSignatureFromSourceLine,
	wrapTooltipText,
} from './effect';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

function toCharacters(text: string): number[] {
	return [...text].map(char => char.charCodeAt(0));
}

describe('tooltip effect', () => {
	it('reads the instruction name from source text', () => {
		expect(getInstructionNameFromSourceLine('  add')).toBe('add');
		expect(getInstructionNameFromSourceLine('push 1')).toBe('push');
	});

	it('wraps tooltip text to the configured maximum length', () => {
		expect(wrapTooltipText('one two three four', 7)).toEqual(['one two', 'three', 'four']);
	});

	it('generates stack signatures from instruction specs', () => {
		expect(getStackSignatureFromSourceLine('add')).toBe('add (T T -- T)');
		expect(getStackSignatureFromSourceLine('drop')).toBe('drop (T -- )');
		expect(getStackSignatureFromSourceLine('branchIfTrue 1')).toBe('branchIfTrue (int -- )');
		expect(getStackSignatureFromSourceLine('load')).toBe('load (ptr -- int)');
		expect(getStackSignatureFromSourceLine('store')).toBe('store (ptr T -- )');
		expect(getStackSignatureFromSourceLine('storeBytes 3')).toBe('storeBytes (ptr int int int -- )');
		expect(getStackSignatureFromSourceLine('int value')).toBe('int ( -- )');
	});

	it('resolves compiler spec documentation from a source line', () => {
		expect(getInstructionSpecFromSourceLine('add')?.docs?.shortDescription).toBe(
			'Adds two numbers of the same type and pushes the result.'
		);
		expect(getInstructionSpecFromSourceLine('int value')?.docs?.shortDescription).toBe(
			'Declares memory storage for values used by the module.'
		);
		expect(getInstructionSpecFromSourceLine('; add')?.docs).toBeUndefined();
		expect(getInstructionSpecFromSourceLine('@pos 1 2')?.docs).toBeUndefined();
	});

	it('extracts named memory declaration ids from selected source lines', () => {
		expect(getMemoryDeclarationIdFromSourceLine('int value 1')).toBe('value');
		expect(getMemoryDeclarationIdFromSourceLine('int[] buffer 4 48 50')).toBe('buffer');
		expect(getMemoryDeclarationIdFromSourceLine('int 1')).toBeUndefined();
		expect(getMemoryDeclarationIdFromSourceLine('add')).toBeUndefined();
	});

	it('wraps selected line documentation', () => {
		expect(getSelectedLineTooltipText('push 1', 24)).toEqual([
			'push ( -- T)',
			'Pushes a literal, memory',
			'value, local value,',
			'address, or constant',
			'onto the stack.',
		]);
	});

	it('generates tooltip color transitions for instructions and stack values', () => {
		const fontTooltipText = {};
		const fontTooltipHighlight = {};
		const content = getSelectedLineTooltipContent(
			'add',
			TOOLTIP_WRAP_WIDTH,
			{
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'add',
				stackAnalysis: {
					stackBefore: [
						{ isInteger: true, knownIntegerValue: 1 },
						{ isInteger: true, knownIntegerValue: 2 },
					],
					consumedOperands: [
						{ isInteger: true, knownIntegerValue: 1 },
						{ isInteger: true, knownIntegerValue: 2 },
					],
					producedStackItems: [{ isInteger: true }],
					stackAfter: [{ isInteger: true }],
				},
			},
			{
				fontTooltipText,
				fontTooltipHighlight,
			} as never
		);

		expect(content.text).toEqual([
			'add (T T -- T)',
			'Adds two numbers of the same',
			'type and pushes the result.',
			'before [int=1, int=2]',
			'after: [int]',
		]);
		expect(content.characters[0]).toEqual(toCharacters('add (T T -- T)'));
		expect(content.lineCount).toBe(5);
		expect(content.widthChars).toBe('Adds two numbers of the same'.length);
		expect(content.colors[0][0]).toBe(fontTooltipHighlight);
		expect(content.colors[0][3]).toBeUndefined();
		expect(content.colors[3][0]).toBe(fontTooltipText);
		expect(content.colors[3][7]).toBe(fontTooltipHighlight);
		expect(content.colors[3][12]).toBeUndefined();
		expect(content.colors[4][0]).toBe(fontTooltipText);
		expect(content.colors[4][7]).toBe(fontTooltipHighlight);
	});

	it('formats selected line stack analysis', () => {
		expect(
			getStackAnalysisTooltipText({
				lineNumberBeforeMacroExpansion: 2,
				lineNumberAfterMacroExpansion: 2,
				instruction: 'add',
				stackAnalysis: {
					stackBefore: [
						{ isInteger: true, knownIntegerValue: 1 },
						{ isInteger: true, knownIntegerValue: 2 },
					],
					consumedOperands: [
						{ isInteger: true, knownIntegerValue: 1 },
						{ isInteger: true, knownIntegerValue: 2 },
					],
					producedStackItems: [{ isInteger: true }],
					stackAfter: [{ isInteger: true }],
				},
			})
		).toEqual(['before [int=1, int=2]', 'after: [int]']);
	});

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
								lineNumberBeforeMacroExpansion: 2,
								lineNumberAfterMacroExpansion: 2,
								instruction: 'add',
								stackAnalysis: {
									stackBefore: [
										{ isInteger: true, knownIntegerValue: 1 },
										{ isInteger: true, knownIntegerValue: 2 },
									],
									consumedOperands: [
										{ isInteger: true, knownIntegerValue: 1 },
										{ isInteger: true, knownIntegerValue: 2 },
									],
									producedStackItems: [{ isInteger: true }],
									stackAfter: [{ isInteger: true }],
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
			'before [int=1, int=2]',
			'after: [int]',
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
		expect(state.tooltip.liveValues).toEqual([]);
	});
});
