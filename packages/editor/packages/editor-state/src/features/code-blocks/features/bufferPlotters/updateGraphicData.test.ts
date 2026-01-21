import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes } from '@8f4e/compiler';

import updateBufferPlottersGraphicData from './updateGraphicData';

import type { CodeBlockGraphicData, State, MemoryIdentifier } from '~/types';
import type { DataStructure } from '@8f4e/compiler';

import { createMockCodeBlock, createMockState } from '~/pureHelpers/testingUtils/testUtils';

describe('updateBufferPlottersGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['# plot buffer1 -10 10'],
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
						},
					},
				},
			},
		});
	});

	it('should add buffer plotter to graphicData extras', () => {
		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferPlotters.length).toBe(1);
		expect(mockGraphicData.extras.bufferPlotters[0]).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		const plotter = mockGraphicData.extras.bufferPlotters[0];
		expect(plotter).toMatchSnapshot();
	});

	it('should not add plotter when buffer memory is not found', () => {
		mockGraphicData.code = ['# plot nonExistentBuffer -10 10'];

		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferPlotters.length).toBe(0);
	});

	it('should clear existing plotters before updating', () => {
		mockGraphicData.extras.bufferPlotters.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			minValue: -8,
			maxValue: 8,
			buffer: {
				memory: { wordAlignedAddress: 0 } as DataStructure,
				showAddress: false,
				showEndAddress: false,
				bufferPointer: 0,
				showBinary: false,
			} as MemoryIdentifier,
			bufferLength: undefined,
		});

		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferPlotters.length).toBe(1);
	});

	it('should handle multiple buffer plotters', () => {
		mockGraphicData.code = ['# plot buffer1 -10 10', '# plot buffer2 0 100'];
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

		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferPlotters.length).toBe(2);
		expect(mockGraphicData.extras.bufferPlotters).toMatchSnapshot();
	});
});
