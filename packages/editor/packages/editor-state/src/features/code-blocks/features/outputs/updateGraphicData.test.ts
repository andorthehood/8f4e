import type { DataStructure } from '@8f4e/compiler-spec';
import { MemoryTypes } from '@8f4e/compiler-spec';
import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState, findWidgetById } from '~/pureHelpers/testingUtils/testUtils';
import updateOutputsGraphicData from './updateGraphicData';

function createMemory(overrides: Partial<DataStructure> = {}): DataStructure {
	return {
		id: 'output1',
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes.int,
		memoryIndex: 0,
		byteAddress: 20,
		wordAlignedAddress: 5,
		wordAlignedSize: 1,
		default: 0,
		lineNumber: 1,
		isInteger: true,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};
}

describe('updateOutputsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			name: 'test-block',
			code: ['module test-block', 'int output1'],
			width: 100,
			gaps: new Map(),
		});

		mockState = createMockState({
			codeBlockRendering: {
				outputsByWordAddress: new Map(),
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							output1: createMemory(),
						},
					},
				},
			},
		});
	});

	it('adds output widgets from non-pointer scalar memory metadata', () => {
		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.outputs, 'output1')).toBeDefined();
	});

	it('adds output widgets from non-pointer array memory metadata', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['output1'] = createMemory({
			type: MemoryTypes.int,
			numberOfElements: 4,
			wordAlignedSize: 4,
		});

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.outputs, 'output1')).toBeDefined();
	});

	it('ignores pointer memory metadata', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['output1'] = createMemory({
			type: MemoryTypes['int*'],
			pointerDepth: 1,
		});

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(0);
		expect(mockState.codeBlockRendering.outputsByWordAddress.size).toBe(0);
	});

	it('calculates dimensions and position from metadata', () => {
		updateOutputsGraphicData(mockGraphicData, mockState);

		const output = findWidgetById(mockGraphicData.widgets.outputs, 'output1');
		const { codeBlock: _codeBlock, memory: _memory, ...outputWithoutRefs } = output || {};
		expect(outputWithoutRefs).toMatchSnapshot();
		expect(output?.codeBlock).toBe(mockGraphicData);
	});

	it('registers output in outputsByWordAddress', () => {
		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockState.codeBlockRendering.outputsByWordAddress.size).toBe(1);
		expect(mockState.codeBlockRendering.outputsByWordAddress.has(20)).toBe(true);

		const output = mockState.codeBlockRendering.outputsByWordAddress.get(20);
		expect(output?.id).toBe('output1');
	});

	it('does not add outputs when compiled module metadata is missing', () => {
		mockState.compiler.compiledModules = {};

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(0);
		expect(mockState.codeBlockRendering.outputsByWordAddress.size).toBe(0);
	});

	it('does not render outputs for private entities', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['_privateOutput'] = createMemory({
			id: '_privateOutput',
			wordAlignedAddress: 7,
			byteAddress: 28,
		});
		delete mockState.compiler.compiledModules['test-block'].memoryMap['output1'];

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(0);
		expect(mockState.codeBlockRendering.outputsByWordAddress.size).toBe(0);
	});

	it('renders anonymous scalar allocations from metadata', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['__anonymous__1'] = createMemory({
			id: '__anonymous__1',
			wordAlignedAddress: 8,
			byteAddress: 32,
		});
		delete mockState.compiler.compiledModules['test-block'].memoryMap['output1'];

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.outputs, '__anonymous__1')).toBeDefined();
		expect(mockState.codeBlockRendering.outputsByWordAddress.get(32)?.id).toBe('__anonymous__1');
	});

	it('clears existing outputs before updating', () => {
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
			memory: createMemory({ id: 'oldOutput' }),
		});

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(findWidgetById(mockGraphicData.widgets.outputs, 'oldOutput')).toBeUndefined();
	});

	it('handles multiple outputs in line-number order', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['output2'] = createMemory({
			id: 'output2',
			type: MemoryTypes.float,
			wordAlignedAddress: 6,
			byteAddress: 24,
			lineNumber: 2,
			isInteger: false,
		});

		updateOutputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.outputs.length).toBe(2);
		expect(mockState.codeBlockRendering.outputsByWordAddress.size).toBe(2);

		const entries = Object.entries(mockGraphicData.widgets.outputs).map(([key, value]) => {
			const { codeBlock: _codeBlock, memory: _memory, ...rest } = value;
			return [key, rest];
		});
		expect(entries).toMatchSnapshot();
	});

	it('positions outputs at the metadata line number', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['output1'] = createMemory({ lineNumber: 2 });

		updateOutputsGraphicData(mockGraphicData, mockState);

		const output = findWidgetById(mockGraphicData.widgets.outputs, 'output1');
		const { codeBlock: _codeBlock, memory: _memory, ...outputWithoutRefs } = output || {};
		expect(outputWithoutRefs).toMatchSnapshot();
	});

	it('rounds wire coordinates to whole pixels', () => {
		mockState.viewport.vGrid = 9;
		mockState.viewport.hGrid = 17;
		mockGraphicData.width = 90;

		updateOutputsGraphicData(mockGraphicData, mockState);

		const output = findWidgetById(mockGraphicData.widgets.outputs, 'output1');
		expect(output?.wireX).toBe(77);
		expect(output?.wireY).toBe(26);
	});
});
