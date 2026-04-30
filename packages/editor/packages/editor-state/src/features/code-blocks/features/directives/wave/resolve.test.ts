import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes, type DataStructure } from '@8f4e/compiler';

import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

import type { CodeBlockGraphicData, State, MemoryIdentifier } from '@8f4e/editor-state-types';

import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
	setMockCodeBlockCode,
} from '~/pureHelpers/testingUtils/testUtils';

describe('wave directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['; @wave bufferAddress 16 pointer1'],
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
								type: MemoryTypes['int*'],
								wordAlignedSize: 16,
								default: 0,
								isInteger: true,
								id: 'buffer1',
								isPointingToPointer: false,
							},
							bufferAddress: {
								wordAlignedAddress: 5,
								byteAddress: 20,
								numberOfElements: 1,
								elementWordSize: 4,
								type: MemoryTypes['int*'],
								wordAlignedSize: 1,
								default: 0,
								isInteger: true,
								id: 'bufferAddress',
								pointeeBaseType: 'int8',
								isPointingToPointer: false,
							},
							pointer1: {
								wordAlignedAddress: 10,
								byteAddress: 40,
								numberOfElements: 1,
								elementWordSize: 4,
								type: MemoryTypes.int,
								wordAlignedSize: 1,
								default: 0,
								isInteger: true,
								id: 'pointer1',
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

	it('adds a wave to graphic data widgets', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayWaves[0].height).toBe(32);
	});

	it('does not add a wave when dependencies cannot be resolved', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @wave missingStart 16 pointer1']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(0);
	});

	it('clears existing waves before resolving directive widgets', () => {
		mockGraphicData.widgets.arrayWaves.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			startAddress: {
				memory: { wordAlignedAddress: 0 } as DataStructure,
				showAddress: true,
				showEndAddress: false,
				bufferPointer: 0,
				displayFormat: 'decimal',
			} as unknown as MemoryIdentifier,
			elementByteSize: 1,
			inverseElementByteSize: 1,
			baseSampleShift: 0,
			length: 16,
			pointer: {
				memory: { wordAlignedAddress: 10 } as DataStructure,
				showAddress: false,
				showEndAddress: false,
				bufferPointer: 0,
				displayFormat: 'decimal',
			} as unknown as MemoryIdentifier,
			valueType: 'int8',
			minValue: -128,
			maxValue: 127,
			inverseValueRange: 1 / 255,
		});

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(1);
	});

	it('adds a waveform-only wave when the pointer is omitted', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @wave bufferAddress 16']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayWaves[0].pointer).toBeUndefined();
	});

	it('renders wave2 at double height', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @wave2 bufferAddress 16 pointer1']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayWaves[0].height).toBe(64);
	});

	it('handles multiple wave directives', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @wave bufferAddress 16 pointer1', '; @wave &buffer2 len2 pointer2']);
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
		mockState.compiler.compiledModules['test-block'].memoryMap['buffer2Address'] = {
			wordAlignedAddress: 2,
			byteAddress: 8,
			numberOfElements: 1,
			elementWordSize: 4,
			type: MemoryTypes['int*'],
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'buffer2Address',
			pointeeBaseType: 'int8',
			isPointingToPointer: false,
		};
		mockState.compiler.compiledModules['test-block'].memoryMap['len2'] = {
			wordAlignedAddress: 15,
			byteAddress: 60,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'len2',
			isPointingToPointer: false,
		};
		mockState.compiler.compiledModules['test-block'].memoryMap['pointer2'] = {
			wordAlignedAddress: 20,
			byteAddress: 80,
			numberOfElements: 1,
			elementWordSize: 1,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'pointer2',
			isPointingToPointer: false,
		};

		setMockCodeBlockCode(mockGraphicData, ['; @wave &buffer1 16 pointer1', '; @wave buffer2Address len2 pointer2']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(2);
	});

	it('does not add a wave when the length memory cannot be resolved', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @wave bufferAddress missingLength pointer1']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(0);
	});

	it('resolves count() length expressions directly from the target memory', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @wave &buffer1 count(buffer1)']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(1);
		expect(mockGraphicData.widgets.arrayWaves[0].length).toBe(16);
		expect(mockGraphicData.widgets.arrayWaves[0].pointer).toBeUndefined();
	});

	it('does not add a wave when the start memory does not encode element size', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap['plainInt'] = {
			wordAlignedAddress: 30,
			byteAddress: 120,
			numberOfElements: 1,
			elementWordSize: 4,
			type: MemoryTypes.int,
			wordAlignedSize: 1,
			default: 0,
			isInteger: true,
			id: 'plainInt',
			isPointingToPointer: false,
		};
		setMockCodeBlockCode(mockGraphicData, ['; @wave plainInt 16 pointer1']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayWaves).toHaveLength(0);
	});
});
