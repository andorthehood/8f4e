import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';
import type { MemoryDefaults, PlannedMemoryDeclaration } from '@8f4e/language-spec';
import { MemoryTypes } from '@8f4e/language-spec';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState, findWidgetById } from '~/pureHelpers/testingUtils/testUtils';
import updateInputsGraphicData from './updateGraphicData';

function createMemory(overrides: Partial<PlannedMemoryDeclaration> = {}): PlannedMemoryDeclaration {
	return {
		id: 'input1',
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes['int*'],
		memoryIndex: 0,
		byteAddress: 20,
		wordAlignedAddress: 5,
		wordAlignedSize: 1,
		lineNumber: 1,
		isInteger: true,
		pointerDepth: 1,
		isUnsigned: false,
		...overrides,
	};
}

function setModuleMemory(
	state: State,
	memory: Record<string, PlannedMemoryDeclaration>,
	memoryDefaults: MemoryDefaults
): void {
	const plannedModule = {
		id: 'test-block',
		lineNumber: 0,
		memoryIndex: 0,
		byteAddress: 0,
		wordAlignedSize: 1,
		wordAlignedByteLength: 4,
		endByteAddress: 4,
		endAddressSafeByteLength: 0,
		memory,
		declarations: Object.values(memory),
		declarationSources: [],
	};
	state.compiler.memoryPlan.modules['test-block'] = plannedModule;
	state.compiler.memoryPlan.moduleList = [plannedModule];
	state.compiler.memoryDefaultsByModuleId['test-block'] = memoryDefaults;
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

		mockState = createMockState();
		setModuleMemory(mockState, { input1: createMemory() }, { input1: { value: 0, isInherited: false } });
	});

	it('adds input widgets from pointer scalar memory metadata', () => {
		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.inputs, 'input1')).toBeDefined();
	});

	it('ignores non-pointer memory metadata', () => {
		mockState.compiler.memoryPlan.modules['test-block']!.memory['input1'] = createMemory({
			type: MemoryTypes.int,
			pointerDepth: 0,
		});

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(0);
	});

	it('adds input widgets from pointer array memory metadata', () => {
		mockState.compiler.memoryPlan.modules['test-block']!.memory['input1'] = createMemory({
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
		mockState.compiler.memoryPlan.modules = {};

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
		mockState.compiler.memoryPlan.modules['test-block']!.memory['input2'] = createMemory({
			id: 'input2',
			type: MemoryTypes['float*'],
			wordAlignedAddress: 6,
			byteAddress: 24,
			lineNumber: 2,
			isInteger: false,
		});
		mockState.compiler.memoryDefaultsByModuleId['test-block']!.input2 = { value: 0, isInherited: false };

		updateInputsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.inputs.length).toBe(2);
		const entries = Object.entries(mockGraphicData.widgets.inputs).map(([key, value]) => {
			const { codeBlock: _codeBlock, ...rest } = value;
			return [key, rest];
		});
		expect(entries).toMatchSnapshot();
	});

	it('positions inputs at the metadata line number', () => {
		mockState.compiler.memoryPlan.modules['test-block']!.memory['input1'] = createMemory({ lineNumber: 2 });

		updateInputsGraphicData(mockGraphicData, mockState);

		const input = findWidgetById(mockGraphicData.widgets.inputs, 'input1');
		const { codeBlock: _codeBlock, ...inputWithoutCodeBlock } = input || {};
		expect(inputWithoutCodeBlock).toMatchSnapshot();
	});

	it('positions shape-sourced inputs below the shape instruction', () => {
		mockGraphicData.gaps = new Map([[1, { size: 1 }]]);
		mockState.compiler.memoryPlan.modules['test-block']!.memory['input1'] = createMemory({
			lineNumber: 1,
		});
		mockState.compiler.memoryDefaultsByModuleId['test-block'] = {
			input1: { value: 0, isInherited: true },
		};

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
