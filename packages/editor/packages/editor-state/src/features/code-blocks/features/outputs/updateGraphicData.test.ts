import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes } from '@8f4e/compiler';

import updateOutputsGraphicData from './updateGraphicData';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { DataStructure } from '@8f4e/compiler';

import { createMockCodeBlock, createMockState, findWidgetById } from '~/pureHelpers/testingUtils/testUtils';

describe('updateOutputsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['module test-block', 'int output1'],
			width: 100,
			gaps: new Map(),
		});

		mockState = createMockState({
			graphicHelper: {
				viewport: {
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

	it('should add output to graphicData widgets', () => {
		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.outputs, 'output1')).toBeDefined();
	});

	it('should add output when declaration has a default value', () => {
		mockGraphicData.code = ['module test-block', 'int output1 0'];

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.outputs, 'output1')).toBeDefined();
		expect(mockState.graphicHelper.outputsByWordAddress.get(20)?.id).toBe('output1');
	});

	it('should calculate correct dimensions and position', () => {
		updateOutputsGraphicData(mockGraphicData, mockState);

		const output = findWidgetById(mockGraphicData.widgets.outputs, 'output1');
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
		mockGraphicData.code = ['int nonExistentOutput'];

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(0);
		expect(mockState.graphicHelper.outputsByWordAddress.size).toBe(0);
	});

	it('should not render outputs for private entities', () => {
		mockGraphicData.code = ['module test-block', 'int _privateOutput'];
		mockState.compiler.compiledModules['test-block'].memoryMap['_privateOutput'] = {
			wordAlignedAddress: 7,
			byteAddress: 28,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: '_privateOutput',
			isPointingToPointer: false,
		};

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(0);
		expect(mockState.graphicHelper.outputsByWordAddress.size).toBe(0);
	});

	it('should render bare anonymous scalar allocations', () => {
		mockGraphicData.code = ['module test-block', 'int'];
		mockState.compiler.compiledModules['test-block'].memoryMap['__anonymous__1'] = {
			wordAlignedAddress: 8,
			byteAddress: 32,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: '__anonymous__1',
			isPointingToPointer: false,
		};

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.outputs, '__anonymous__1')).toBeDefined();
		expect(mockState.graphicHelper.outputsByWordAddress.get(32)?.id).toBe('__anonymous__1');
	});

	it('should clear existing outputs before updating', () => {
		mockGraphicData.widgets.outputs.push({
			codeBlock: mockGraphicData,
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			wireX: 0,
			wireY: 0,
			id: 'oldOutput',
			calibratedMax: 1,
			calibratedMin: 0,
			memory: { wordAlignedAddress: 0 } as DataStructure,
		});

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(findWidgetById(mockGraphicData.widgets.outputs, 'oldOutput')).toBeUndefined();
	});

	it('should handle multiple outputs', () => {
		mockGraphicData.code = ['module test-block', 'int output1', 'float output2'];
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
			isPointingToPointer: false,
		};

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(2);
		expect(mockState.graphicHelper.outputsByWordAddress.size).toBe(2);

		// Exclude codeBlock and memory references from snapshot
		const entries = Object.entries(mockGraphicData.widgets.outputs).map(([key, value]) => {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const { codeBlock: _codeBlock, memory: _memory, ...rest } = value;
			return [key, rest];
		});
		expect(entries).toMatchSnapshot();
	});

	it('should position outputs at correct y coordinate based on line number', () => {
		mockGraphicData.code = ['nop', 'nop', 'int output1'];
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
			isPointingToPointer: false,
		};

		updateOutputsGraphicData(mockGraphicData, mockState);

		const output = findWidgetById(mockGraphicData.widgets.outputs, 'output1');
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { codeBlock: _codeBlock, memory: _memory, ...outputWithoutRefs } = output || {};
		expect(outputWithoutRefs).toMatchSnapshot();
	});

	it('should round wire coordinates to whole pixels', () => {
		mockState.viewport.vGrid = 9;
		mockState.viewport.hGrid = 17;
		mockGraphicData.width = 90;

		updateOutputsGraphicData(mockGraphicData, mockState);

		const output = findWidgetById(mockGraphicData.widgets.outputs, 'output1');
		expect(output?.wireX).toBe(77);
		expect(output?.wireY).toBe(26);
	});
});
