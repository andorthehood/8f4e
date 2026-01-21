import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes } from '@8f4e/compiler';

import updateBufferScannersGraphicData from './updateGraphicData';

import type { CodeBlockGraphicData, State, MemoryIdentifier } from '~/types';
import type { DataStructure } from '@8f4e/compiler';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

describe('updateBufferScannersGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['# scan buffer1 pointer1'],
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

	it('should add buffer scanner to graphicData extras', () => {
		updateBufferScannersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferScanners.length).toBe(1);
		expect(mockGraphicData.extras.bufferScanners[0]).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		updateBufferScannersGraphicData(mockGraphicData, mockState);

		const scanner = mockGraphicData.extras.bufferScanners[0];
		expect(scanner).toMatchSnapshot();
	});

	it('should not add scanner when buffer memory is not found', () => {
		mockGraphicData.code = ['# scan nonExistentBuffer pointer1'];

		updateBufferScannersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferScanners.length).toBe(0);
	});

	it('should not add scanner when pointer memory is not found', () => {
		mockGraphicData.code = ['# scan buffer1 nonExistentPointer'];

		updateBufferScannersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferScanners.length).toBe(0);
	});

	it('should clear existing scanners before updating', () => {
		mockGraphicData.extras.bufferScanners.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			buffer: {
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

		updateBufferScannersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferScanners.length).toBe(1);
	});

	it('should handle multiple buffer scanners', () => {
		mockGraphicData.code = ['# scan buffer1 pointer1', '# scan buffer2 pointer2'];
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
			isPointer: false,
			isPointingToInteger: false,
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
			isPointer: false,
			isPointingToInteger: false,
			isPointingToPointer: false,
		};

		updateBufferScannersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferScanners.length).toBe(2);
		expect(mockGraphicData.extras.bufferScanners).toMatchSnapshot();
	});
});
