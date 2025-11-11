import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes } from '@8f4e/compiler';

import updateInputsGraphicData from './updateGraphicData';

import { createMockCodeBlock, createMockState } from '../../../../helpers/testUtils';

import type { CodeBlockGraphicData, State } from '../../../../types';

describe('updateInputsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['module test-block', 'int* input1'],
			trimmedCode: ['int* input1'],
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

	it('should add input to graphicData extras', () => {
		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.inputs.size).toBe(1);
		expect(mockGraphicData.extras.inputs.has('input1')).toBe(true);
	});

	it('should calculate correct dimensions and position', () => {
		updateInputsGraphicData(mockGraphicData, mockState);

		const input = mockGraphicData.extras.inputs.get('input1');
		// Exclude codeBlock from snapshot as it creates circular reference
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { codeBlock: _codeBlock, ...inputWithoutCodeBlock } = input || {};
		expect(inputWithoutCodeBlock).toMatchSnapshot();
		expect(input?.codeBlock).toBe(mockGraphicData);
	});

	it('should not add input when memory is not found', () => {
		mockGraphicData.trimmedCode = ['int* nonExistentInput'];

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.inputs.size).toBe(0);
	});

	it('should clear existing inputs before updating', () => {
		mockGraphicData.extras.inputs.set('oldInput', {
			codeBlock: mockGraphicData,
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldInput',
			wordAlignedAddress: 0,
		});

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.inputs.has('oldInput')).toBe(false);
	});

	it('should handle multiple inputs', () => {
		mockGraphicData.trimmedCode = ['int* input1', 'float* input2'];
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
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
		};

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.inputs.size).toBe(2);
		// Exclude codeBlock references from snapshot
		const entries = Array.from(mockGraphicData.extras.inputs.entries()).map(([key, value]) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { codeBlock: _codeBlock, ...rest } = value;
			return [key, rest];
		});
		expect(entries).toMatchSnapshot();
	});

	it('should position inputs at correct y coordinate based on line number', () => {
		mockGraphicData.trimmedCode = ['nop', 'nop', 'int* input1'];
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
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
		};

		updateInputsGraphicData(mockGraphicData, mockState);

		const input = mockGraphicData.extras.inputs.get('input1');
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { codeBlock: _codeBlock, ...inputWithoutCodeBlock } = input || {};
		expect(inputWithoutCodeBlock).toMatchSnapshot();
	});
});
