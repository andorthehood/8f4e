import { describe, it, expect, beforeEach } from 'vitest';

import updateBufferPlottersGraphicData from './updateGraphicData';

import { createMockCodeBlock, createMockState } from '../../../../helpers/testUtils';

import type { CodeBlockGraphicData, State } from '../../../../types';

describe('updateBufferPlottersGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			trimmedCode: ['plot buffer1 -10 10'],
			gaps: new Map(),
			width: 100,
		});

		mockState = createMockState({
			graphicHelper: {
				globalViewport: {
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
		} as any);
	});

	it('should add buffer plotter to graphicData extras', () => {
		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferPlotters.size).toBe(1);
		expect(mockGraphicData.extras.bufferPlotters.has('buffer1')).toBe(true);
	});

	it('should calculate correct dimensions and position', () => {
		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		const plotter = mockGraphicData.extras.bufferPlotters.get('buffer1');
		expect(plotter).toMatchSnapshot();
	});

	it('should not add plotter when buffer memory is not found', () => {
		mockGraphicData.trimmedCode = ['plot nonExistentBuffer -10 10'];

		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferPlotters.size).toBe(0);
	});

	it('should clear existing plotters before updating', () => {
		mockGraphicData.extras.bufferPlotters.set('oldPlotter', {} as any);

		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferPlotters.has('oldPlotter')).toBe(false);
	});

	it('should handle multiple buffer plotters', () => {
		mockGraphicData.trimmedCode = ['plot buffer1 -10 10', 'plot buffer2 0 100'];
		mockState.compiler.compiledModules['test-block'].memoryMap['buffer2'] = {
			wordAlignedAddress: 1,
			byteAddress: 4,
		} as any;

		updateBufferPlottersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.bufferPlotters.size).toBe(2);
		expect(Array.from(mockGraphicData.extras.bufferPlotters.entries())).toMatchSnapshot();
	});
});
