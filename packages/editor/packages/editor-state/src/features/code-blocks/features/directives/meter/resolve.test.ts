import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes, type DataStructure } from '@8f4e/compiler';

import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

import type { CodeBlockGraphicData, State, MemoryIdentifier } from '~/types';

import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
	setMockCodeBlockCode,
} from '~/pureHelpers/testingUtils/testUtils';

describe('meter directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['; @meter level'],
			gaps: new Map(),
			width: 100,
		});

		mockState = createMockState({
			viewport: {
				vGrid: 10,
				hGrid: 20,
			},
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
							level: {
								wordAlignedAddress: 0,
								byteAddress: 0,
								numberOfElements: 1,
								elementWordSize: 4,
								type: MemoryTypes.float,
								wordAlignedSize: 1,
								default: 0,
								isInteger: false,
								id: 'level',
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

	it('adds a meter widget for a scalar memory id', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayMeters).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayMeters[0].minValue).toBe(-1);
		expect(mockGraphicData.widgets.arrayMeters[0].maxValue).toBe(1);
		expect(mockGraphicData.widgets.arrayMeters[0].height).toBe(20);
	});

	it('uses explicit range overrides when provided', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @meter level 0 1']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayMeters).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayMeters[0].minValue).toBe(0);
		expect(mockGraphicData.widgets.arrayMeters[0].maxValue).toBe(1);
	});

	it('clears existing meters before resolving directive widgets', () => {
		mockGraphicData.widgets.arrayMeters.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			minValue: 0,
			maxValue: 1,
			memory: {
				memory: { wordAlignedAddress: 0 } as DataStructure,
				showAddress: false,
				showEndAddress: false,
				bufferPointer: 0,
				displayFormat: 'decimal',
			} as MemoryIdentifier,
			baseSampleShift: 2,
			valueType: 'float32',
		});

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayMeters).toHaveLength(1);
	});

	it('does not add a meter when the memory cannot be resolved', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @meter missing']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayMeters).toHaveLength(0);
	});

	it('infers the memory id from a trailing memory declaration comment', () => {
		setMockCodeBlockCode(mockGraphicData, ['float out ; @meter']);
		mockState.compiler.compiledModules['test-block'].memoryMap['out'] = {
			wordAlignedAddress: 4,
			byteAddress: 16,
			numberOfElements: 1,
			elementWordSize: 4,
			type: MemoryTypes.float,
			wordAlignedSize: 1,
			default: 0,
			isInteger: false,
			id: 'out',
			isPointingToPointer: false,
		};

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayMeters).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayMeters[0].memory.memory.id).toBe('out');
	});
});
