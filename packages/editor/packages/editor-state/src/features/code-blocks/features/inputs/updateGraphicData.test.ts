import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes } from '@8f4e/compiler';

import updateInputsGraphicData from './updateGraphicData';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';

import { createMockCodeBlock, createMockState, findWidgetById } from '~/pureHelpers/testingUtils/testUtils';

describe('updateInputsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['module test-block', 'int* input1'],
			gaps: new Map(),
		});

		mockState = createMockState({
			graphicHelper: {
				viewport: {
					vGrid: 10,
					hGrid: 20,
				},
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							input1: {
								wordAlignedAddress: 5,
								byteAddress: 20,
							},
						},
					},
				},
			},
		});
	});

	it('should add input to graphicData widgets', () => {
		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.inputs, 'input1')).toBeDefined();
	});

	it('should add input when pointer declaration has a default reference', () => {
		mockGraphicData.code = ['module test-block', 'int* input1 &source:output1'];

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.inputs, 'input1')).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		updateInputsGraphicData(mockGraphicData, mockState);

		const input = findWidgetById(mockGraphicData.widgets.inputs, 'input1');
		// Exclude codeBlock from snapshot as it creates circular reference
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { codeBlock: _codeBlock, ...inputWithoutCodeBlock } = input || {};
		expect(inputWithoutCodeBlock).toMatchSnapshot();
		expect(input?.codeBlock).toBe(mockGraphicData);
	});

	it('should not add input when memory is not found', () => {
		mockGraphicData.code = ['int* nonExistentInput'];

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(0);
	});

	it('should clear existing inputs before updating', () => {
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

	it('should handle multiple inputs', () => {
		mockGraphicData.code = ['module test-block', 'int* input1', 'float* input2'];
		mockState.compiler.compiledModules['test-block'].memoryMap['input2'] = {
			wordAlignedAddress: 6,
			byteAddress: 24,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.float,
			wordAlignedSize: 1,
			default: 0,
			isInteger: false,
			id: 'input2',
			isPointingToPointer: false,
		};

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(2);
		// Exclude codeBlock references from snapshot
		const entries = Object.entries(mockGraphicData.widgets.inputs).map(([key, value]) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { codeBlock: _codeBlock, ...rest } = value;
			return [key, rest];
		});
		expect(entries).toMatchSnapshot();
	});

	it('should position inputs at correct y coordinate based on line number', () => {
		mockGraphicData.code = ['nop', 'nop', 'int* input1'];
		mockState.compiler.compiledModules['test-block'].memoryMap['input1'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'input1',
			isPointingToPointer: false,
		};

		updateInputsGraphicData(mockGraphicData, mockState);

		const input = findWidgetById(mockGraphicData.widgets.inputs, 'input1');
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { codeBlock: _codeBlock, ...inputWithoutCodeBlock } = input || {};
		expect(inputWithoutCodeBlock).toMatchSnapshot();
	});

	it('should round wire coordinates to whole pixels', () => {
		mockState.viewport.vGrid = 9;
		mockState.viewport.hGrid = 17;

		updateInputsGraphicData(mockGraphicData, mockState);

		const input = findWidgetById(mockGraphicData.widgets.inputs, 'input1');
		expect(input?.wireX).toBe(14);
		expect(input?.wireY).toBe(26);
	});
});
