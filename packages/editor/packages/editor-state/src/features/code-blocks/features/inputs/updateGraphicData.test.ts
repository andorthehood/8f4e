import type { CompilerCache, DataStructure, MemoryDeclarationLine, ValidatedModuleAST } from '@8f4e/compiler-spec';
import { MemoryTypes } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState, findWidgetById } from '~/pureHelpers/testingUtils/testUtils';
import updateInputsGraphicData from './updateGraphicData';

function createMemory(overrides: Partial<DataStructure> = {}): DataStructure {
	return {
		id: 'input1',
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes['int*'],
		memoryIndex: 0,
		byteAddress: 20,
		wordAlignedAddress: 5,
		wordAlignedSize: 1,
		default: 0,
		lineNumber: 1,
		isInteger: true,
		pointerDepth: 1,
		isUnsigned: false,
		...overrides,
	};
}

function createModuleAst(lines: ValidatedModuleAST['lines']): ValidatedModuleAST {
	return {
		type: 'module',
		id: 'test-block',
		lines,
		memoryDeclarationLines: lines.filter(
			line => line.instruction !== 'shape'
		) as ValidatedModuleAST['memoryDeclarationLines'],
	} as unknown as ValidatedModuleAST;
}

function createMemoryDeclarationLine(id: string, instruction = 'int*'): MemoryDeclarationLine {
	return {
		lineNumber: 10,
		instruction,
		arguments: [{ value: id }],
	} as MemoryDeclarationLine;
}

function createCompilerCache(memoryDeclarationLines: readonly MemoryDeclarationLine[]): CompilerCache {
	return {
		ast: {
			stats: { hits: 0, misses: 0 },
			entries: new Map([
				[
					'prototype:0',
					{
						lineCount: memoryDeclarationLines.length + 2,
						ast: {
							type: 'prototype',
							id: 'filterState',
							lines: [],
							memoryDeclarationLines,
						},
					},
				],
			]),
		},
	} as unknown as CompilerCache;
}

describe('updateInputsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			name: 'test-block',
			code: ['module test-block', 'int* input1'],
			gaps: new Map(),
		});

		mockState = createMockState({
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							input1: createMemory(),
						},
					},
				},
			},
		});
	});

	it('adds input widgets from pointer scalar memory metadata', () => {
		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.inputs, 'input1')).toBeDefined();
	});

	it('ignores non-pointer memory metadata', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['input1'] = createMemory({
			type: MemoryTypes.int,
			pointerDepth: 0,
		});

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(0);
	});

	it('adds input widgets from pointer array memory metadata', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['input1'] = createMemory({
			type: MemoryTypes['float*'],
			pointerDepth: 1,
		});

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.inputs, 'input1')).toBeDefined();
	});

	it('calculates dimensions and position from metadata', () => {
		updateInputsGraphicData(mockGraphicData, mockState);

		const input = findWidgetById(mockGraphicData.widgets.inputs, 'input1');
		const { codeBlock: _codeBlock, ...inputWithoutCodeBlock } = input || {};
		expect(inputWithoutCodeBlock).toMatchSnapshot();
		expect(input?.codeBlock).toBe(mockGraphicData);
	});

	it('does not add inputs when compiled module metadata is missing', () => {
		mockState.compiler.compiledModules = {};

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(0);
	});

	it('clears existing inputs before updating', () => {
		mockGraphicData.widgets.inputs.push({
			codeBlock: mockGraphicData,
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			wireX: 0,
			wireY: 0,
			id: 'oldInput',
			wordAlignedAddress: 0,
		});

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(findWidgetById(mockGraphicData.widgets.inputs, 'oldInput')).toBeUndefined();
	});

	it('handles multiple inputs in line-number order', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['input2'] = createMemory({
			id: 'input2',
			type: MemoryTypes['float*'],
			wordAlignedAddress: 6,
			byteAddress: 24,
			lineNumber: 2,
			isInteger: false,
		});

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(2);
		const entries = Object.entries(mockGraphicData.widgets.inputs).map(([key, value]) => {
			const { codeBlock: _codeBlock, ...rest } = value;
			return [key, rest];
		});
		expect(entries).toMatchSnapshot();
	});

	it('positions inputs at the metadata line number', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['input1'] = createMemory({ lineNumber: 2 });

		updateInputsGraphicData(mockGraphicData, mockState);

		const input = findWidgetById(mockGraphicData.widgets.inputs, 'input1');
		const { codeBlock: _codeBlock, ...inputWithoutCodeBlock } = input || {};
		expect(inputWithoutCodeBlock).toMatchSnapshot();
	});

	it('positions shape-sourced inputs below the shape instruction', () => {
		mockGraphicData.gaps = new Map([[1, { size: 1 }]]);
		mockState.compiler.cache = createCompilerCache([createMemoryDeclarationLine('input1')]);
		mockState.compiler.compiledModules['test-block'].memoryMap['input1'] = createMemory({ lineNumber: 10 });
		mockState.compiler.compiledModules['test-block'].ast = createModuleAst([
			{ lineNumber: 0, instruction: 'module', arguments: [{ value: 'test-block' }] },
			{ lineNumber: 1, instruction: 'shape', arguments: [{ value: 'filterState' }] },
			{ lineNumber: 2, instruction: 'moduleEnd', arguments: [] },
		] as unknown as ValidatedModuleAST['lines']);

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(findWidgetById(mockGraphicData.widgets.inputs, 'input1')?.y).toBe(32);
	});

	it('rounds wire coordinates to whole pixels', () => {
		mockState.viewport.vGrid = 9;
		mockState.viewport.hGrid = 17;

		updateInputsGraphicData(mockGraphicData, mockState);

		const input = findWidgetById(mockGraphicData.widgets.inputs, 'input1');
		expect(input?.wireX).toBe(14);
		expect(input?.wireY).toBe(26);
	});
});
