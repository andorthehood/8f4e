import { describe, it, expect, beforeEach } from 'vitest';

import updateOutputsGraphicData from './updateGraphicData';

import { createMockCodeBlock, createMockState } from '../../../../helpers/testUtils';

import type { CodeBlockGraphicData, State } from '../../../../types';
import type { DataStructure } from '@8f4e/compiler';
import { MemoryTypes } from '@8f4e/compiler';

describe('updateOutputsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['module test-block', 'int output1'],
			trimmedCode: ['int output1'],
			width: 100,
			gaps: new Map(),
		});

		mockState = createMockState({
			graphicHelper: {
				globalViewport: {
					vGrid: 10,
					hGrid: 20,
				},
				outputsByWordAddress: new Map(),
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							output1: {
								wordAlignedAddress: 5,
								byteAddress: 20,
							},
						},
					},
				},
			},
		});
	});

	it('should add output to graphicData extras', () => {
		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.outputs.size).toBe(1);
		expect(mockGraphicData.extras.outputs.has('output1')).toBe(true);
	});

	it('should calculate correct dimensions and position', () => {
		updateOutputsGraphicData(mockGraphicData, mockState);

		const output = mockGraphicData.extras.outputs.get('output1');
		// Exclude codeBlock and memory from snapshot as they create circular references
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { codeBlock: _codeBlock, memory: _memory, ...outputWithoutRefs } = output || {};
		expect(outputWithoutRefs).toMatchSnapshot();
		expect(output?.codeBlock).toBe(mockGraphicData);
	});

	it('should register output in outputsByWordAddress', () => {
		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockState.graphicHelper.outputsByWordAddress.size).toBe(1);
		expect(mockState.graphicHelper.outputsByWordAddress.has(20)).toBe(true);

		const output = mockState.graphicHelper.outputsByWordAddress.get(20);
		expect(output?.id).toBe('output1');
	});

	it('should not add output when memory is not found', () => {
		mockGraphicData.trimmedCode = ['int nonExistentOutput'];

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.outputs.size).toBe(0);
		expect(mockState.graphicHelper.outputsByWordAddress.size).toBe(0);
	});

	it('should clear existing outputs before updating', () => {
		mockGraphicData.extras.outputs.set('oldOutput', {
			codeBlock: mockGraphicData,
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldOutput',
			calibratedMax: 1,
			calibratedMin: 0,
			memory: { wordAlignedAddress: 0 } as DataStructure,
		});

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.outputs.has('oldOutput')).toBe(false);
	});

	it('should handle multiple outputs', () => {
		mockGraphicData.trimmedCode = ['int output1', 'float output2'];
		mockState.compiler.compiledModules['test-block'].memoryMap['output2'] = {
			wordAlignedAddress: 6,
			byteAddress: 24,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.float,
			wordAlignedSize: 1,
			default: 0,
			isInteger: false,
			id: 'output2',
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
		};

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.outputs.size).toBe(2);
		expect(mockState.graphicHelper.outputsByWordAddress.size).toBe(2);

		// Exclude codeBlock and memory references from snapshot
		const entries = Array.from(mockGraphicData.extras.outputs.entries()).map(([key, value]) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { codeBlock: _codeBlock, memory: _memory, ...rest } = value;
			return [key, rest];
		});
		expect(entries).toMatchSnapshot();
	});

	it('should position outputs at correct y coordinate based on line number', () => {
		mockGraphicData.trimmedCode = ['nop', 'nop', 'int output1'];
		mockState.compiler.compiledModules['test-block'].memoryMap['output1'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'output1',
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
		};

		updateOutputsGraphicData(mockGraphicData, mockState);

		const output = mockGraphicData.extras.outputs.get('output1');
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { codeBlock: _codeBlock, memory: _memory, ...outputWithoutRefs } = output || {};
		expect(outputWithoutRefs).toMatchSnapshot();
	});
});
