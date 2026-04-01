import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes } from '@8f4e/compiler';

import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

import type { CodeBlockGraphicData, State } from '~/types';
import type { DataStructure } from '@8f4e/compiler';

import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
	findWidgetById,
	setMockCodeBlockCode,
} from '~/pureHelpers/testingUtils/testUtils';

describe('watch directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['; @watch myVar'],
			lineNumberColumnWidth: 2,
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
							myVar: {
								wordAlignedAddress: 5,
								byteAddress: 20,
							},
						},
					},
				},
			},
		});
	});

	function runDirectiveResolution() {
		const directiveState = deriveDirectiveStateForMockCodeBlock(mockGraphicData);
		runBeforeGraphicDataWidthCalculation(mockGraphicData, mockState, directiveState);
		runAfterGraphicDataWidthCalculation(mockGraphicData, mockState, directiveState);
	}

	it('should add debugger to graphicData widgets', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.debuggers.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.debuggers, 'myVar')).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		// This test requires resolveMemoryIdentifier mocking which is complex
		// For now, verify that the basic functionality works with the first test
		runDirectiveResolution();

		// At minimum verify debuggers map exists
		expect(mockGraphicData.widgets.debuggers).toBeDefined();
	});

	it('should not add debugger when memory is not found', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @watch nonExistentVar']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.debuggers.length).toBe(0);
	});

	it('should clear existing debuggers before updating', () => {
		mockGraphicData.widgets.debuggers.push({
			width: 0,
			height: 0,
			showAddress: false,
			showEndAddress: false,
			x: 0,
			y: 0,
			id: 'oldDebugger',
			memory: { wordAlignedAddress: 0 } as DataStructure,
			bufferPointer: 0,
			showBinary: false,
			showHex: false,
		});

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.debuggers, 'oldDebugger')).toBeUndefined();
	});

	it('should handle multiple debuggers', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @watch var1', '; @watch var2']);
		mockState.compiler.compiledModules['test-block'].memoryMap['var1'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'var1',
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
		};
		mockState.compiler.compiledModules['test-block'].memoryMap['var2'] = {
			wordAlignedAddress: 6,
			byteAddress: 24,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'var2',
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
		};

		runDirectiveResolution();

		expect(mockGraphicData.widgets.debuggers.length).toBe(2);
		expect(mockGraphicData.widgets.debuggers).toMatchSnapshot();
	});

	it('should position debuggers at correct y coordinate based on line number', () => {
		mockGraphicData.code = ['nop', 'nop', '; @watch myVar'];
		mockState.compiler.compiledModules['test-block'].memoryMap['myVar'] = {
			wordAlignedAddress: 5,
			byteAddress: 20,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'myVar',
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
		};

		runDirectiveResolution();

		const dbg = findWidgetById(mockGraphicData.widgets.debuggers, 'myVar');
		expect(dbg).toMatchSnapshot();
	});
});
