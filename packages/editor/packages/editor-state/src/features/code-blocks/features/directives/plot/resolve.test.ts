import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes, type DataStructure } from '@8f4e/compiler-types';

import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

import type { CodeBlockGraphicData, State, MemoryIdentifier } from '@8f4e/editor-state-types';

import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
	setMockCodeBlockCode,
} from '~/pureHelpers/testingUtils/testUtils';

describe('plot directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['; @plot &buffer1 count(buffer1)'],
			gaps: new Map(),
			width: 100,
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
							buffer1: {
								wordAlignedAddress: 0,
								byteAddress: 0,
								numberOfElements: 16,
								elementWordSize: 1,
								type: MemoryTypes.int,
								wordAlignedSize: 16,
								default: 0,
								isInteger: true,
								isUnsigned: false,
								id: 'buffer1',
								isPointingToPointer: false,
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

	it('adds a plotter to graphic data widgets', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayPlotters[0]).toBeDefined();
	});

	it('does not add a plotter when the array cannot be resolved', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @plot missing count(buffer1)']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(0);
	});

	it('clears existing plotters before resolving directive widgets', () => {
		mockGraphicData.widgets.arrayPlotters.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			minValue: -8,
			maxValue: 8,
			startAddress: {
				memory: { wordAlignedAddress: 0 } as DataStructure,
				showAddress: true,
				showEndAddress: false,
				bufferPointer: 0,
				displayFormat: 'decimal',
			} as MemoryIdentifier,
			baseSampleShift: 0,
			length: 16,
			valueType: 'int8',
		});

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(1);
	});

	it('handles multiple plot directives', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @plot &buffer1 count(buffer1)', '; @plot &buffer2 count(buffer2)']);
		mockState.compiler.compiledModules['test-block'].memoryMap['buffer2'] = {
			wordAlignedAddress: 1,
			byteAddress: 4,
			numberOfElements: 100,
			elementWordSize: 1,
			type: MemoryTypes['int*'],
			wordAlignedSize: 100,
			default: 0,
			isInteger: true,
			id: 'buffer2',
			isPointingToPointer: false,
		};

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(2);
	});

	it('derives float plot ranges as -1..1', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['floatBuffer'] = {
			wordAlignedAddress: 4,
			byteAddress: 16,
			numberOfElements: 16,
			elementWordSize: 4,
			type: MemoryTypes.float,
			wordAlignedSize: 16,
			default: 0,
			isInteger: false,
			id: 'floatBuffer',
			isPointingToPointer: false,
		};
		setMockCodeBlockCode(mockGraphicData, ['; @plot &floatBuffer count(floatBuffer)']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayPlotters[0].minValue).toBe(-1);
		expect(mockGraphicData.widgets.arrayPlotters[0].maxValue).toBe(1);
	});

	it('derives integer plot ranges from the array type', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayPlotters[0].minValue).toBe(-128);
		expect(mockGraphicData.widgets.arrayPlotters[0].maxValue).toBe(127);
	});

	it('does not add a plotter when the required length cannot be resolved', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @plot &buffer1 missingLength']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(0);
	});

	it('uses explicit range overrides when provided with a length', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @plot &buffer1 8 -10 10']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayPlotters[0].minValue).toBe(-10);
		expect(mockGraphicData.widgets.arrayPlotters[0].maxValue).toBe(10);
		expect(mockGraphicData.widgets.arrayPlotters[0].length).toBe(8);
	});

	it('supports pointer starts with count() lengths', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['bufferPtr'] = {
			wordAlignedAddress: 8,
			byteAddress: 32,
			numberOfElements: 1,
			elementWordSize: 4,
			type: MemoryTypes['int*'],
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'bufferPtr',
			pointeeBaseType: 'int8',
			isPointingToPointer: false,
		};
		setMockCodeBlockCode(mockGraphicData, ['; @plot bufferPtr count(buffer1)']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayPlotters).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayPlotters[0].length).toBe(16);
		expect(mockGraphicData.widgets.arrayPlotters[0].valueType).toBe('int8');
	});
});
