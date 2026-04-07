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

describe('scan directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['; @scan buffer1 pointer1'],
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
							},
							pointer1: {
								wordAlignedAddress: 10,
								byteAddress: 40,
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

	it('adds a scanner to graphic data widgets', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayScanners).toHaveLength(1);
	});

	it('does not add a scanner when dependencies cannot be resolved', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @scan missing pointer1']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayScanners).toHaveLength(0);
	});

	it('clears existing scanners before resolving directive widgets', () => {
		mockGraphicData.widgets.arrayScanners.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			array: {
				memory: { wordAlignedAddress: 0 } as DataStructure,
				showAddress: false,
				showEndAddress: false,
				bufferPointer: 0,
				showBinary: false,
			} as MemoryIdentifier,
			pointer: {
				memory: { wordAlignedAddress: 10 } as DataStructure,
				showAddress: false,
				showEndAddress: false,
				bufferPointer: 0,
				showBinary: false,
			} as MemoryIdentifier,
		});

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayScanners).toHaveLength(1);
	});

	it('handles multiple scan directives', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @scan buffer1 pointer1', '; @scan buffer2 pointer2']);
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

		runDirectiveResolution();

		expect(mockGraphicData.widgets.arrayScanners).toHaveLength(2);
	});
});
