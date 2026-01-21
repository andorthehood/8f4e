import { describe, it, expect, beforeEach } from 'vitest';

import updateSlidersGraphicData from './updateGraphicData';

import type { CodeBlockGraphicData, State } from '~/types';

import { createMockCodeBlock, createMockState, findExtrasById } from '~/pureHelpers/testingUtils/testUtils';

describe('updateSlidersGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['int mySlider 50', '# slider mySlider'],
			width: 200,
			gaps: new Map(),
		});

		mockState = createMockState({
			viewport: {
				vGrid: 10,
				hGrid: 20,
			},
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							mySlider: {
								id: 'mySlider',
								wordAlignedAddress: 0,
								isInteger: true,
								numberOfElements: 1,
								elementWordSize: 1,
							},
						},
					},
				},
			},
		});
	});

	it('should add slider to graphicData extras', () => {
		updateSlidersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.sliders.length).toBe(1);
		expect(findExtrasById(mockGraphicData.extras.sliders, 'mySlider')).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		updateSlidersGraphicData(mockGraphicData, mockState);

		const slider = findExtrasById(mockGraphicData.extras.sliders, 'mySlider');
		expect(slider).toMatchSnapshot();
	});

	it('should use default range for integers (0..127) when min/max not provided', () => {
		updateSlidersGraphicData(mockGraphicData, mockState);

		const slider = findExtrasById(mockGraphicData.extras.sliders, 'mySlider');
		expect(slider?.min).toBe(0);
		expect(slider?.max).toBe(127);
		expect(slider?.step).toBeUndefined();
	});

	it('should use default range for floats (0..1) when min/max not provided', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap.mySlider.isInteger = false;

		updateSlidersGraphicData(mockGraphicData, mockState);

		const slider = findExtrasById(mockGraphicData.extras.sliders, 'mySlider');
		expect(slider?.min).toBe(0);
		expect(slider?.max).toBe(1);
		expect(slider?.step).toBeUndefined();
	});

	it('should use custom min/max when provided', () => {
		mockGraphicData.code = ['int mySlider 50', '# slider mySlider 10 200'];

		updateSlidersGraphicData(mockGraphicData, mockState);

		const slider = findExtrasById(mockGraphicData.extras.sliders, 'mySlider');
		expect(slider?.min).toBe(10);
		expect(slider?.max).toBe(200);
	});

	it('should include step when provided', () => {
		mockGraphicData.code = ['int mySlider 50', '# slider mySlider 0 100 5'];

		updateSlidersGraphicData(mockGraphicData, mockState);

		const slider = findExtrasById(mockGraphicData.extras.sliders, 'mySlider');
		expect(slider?.min).toBe(0);
		expect(slider?.max).toBe(100);
		expect(slider?.step).toBe(5);
	});

	it('should clear existing sliders before updating', () => {
		mockGraphicData.extras.sliders.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldSlider',
			min: 0,
			max: 100,
		});

		updateSlidersGraphicData(mockGraphicData, mockState);

		expect(findExtrasById(mockGraphicData.extras.sliders, 'oldSlider')).toBeUndefined();
	});

	it('should handle multiple sliders', () => {
		mockGraphicData.code = ['int slider1 0', '# slider slider1', 'int slider2 50', '# slider slider2 0 100'];
		mockState.compiler.compiledModules['test-block'].memoryMap.slider1 = {
			id: 'slider1',
			wordAlignedAddress: 0,
			isInteger: true,
			numberOfElements: 1,
			elementWordSize: 1,
		};
		mockState.compiler.compiledModules['test-block'].memoryMap.slider2 = {
			id: 'slider2',
			wordAlignedAddress: 1,
			isInteger: true,
			numberOfElements: 1,
			elementWordSize: 1,
		};

		updateSlidersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.sliders.length).toBe(2);
		expect(mockGraphicData.extras.sliders).toMatchSnapshot();
	});

	it('should position sliders at correct y coordinate based on line number', () => {
		mockGraphicData.code = ['nop', 'int mySlider 50', '# slider mySlider'];

		updateSlidersGraphicData(mockGraphicData, mockState);

		const slider = findExtrasById(mockGraphicData.extras.sliders, 'mySlider');
		expect(slider).toMatchSnapshot();
	});

	it('should position sliders correctly with gaps', () => {
		mockGraphicData.gaps = new Map([[1, { size: 1 }]]);
		mockGraphicData.code = ['int slider1 0', '# slider slider1', 'nop', 'int slider2 50', '# slider slider2'];
		mockState.compiler.compiledModules['test-block'].memoryMap.slider1 = {
			id: 'slider1',
			wordAlignedAddress: 0,
			isInteger: true,
			numberOfElements: 1,
			elementWordSize: 1,
		};
		mockState.compiler.compiledModules['test-block'].memoryMap.slider2 = {
			id: 'slider2',
			wordAlignedAddress: 1,
			isInteger: true,
			numberOfElements: 1,
			elementWordSize: 1,
		};

		updateSlidersGraphicData(mockGraphicData, mockState);

		const slider1 = findExtrasById(mockGraphicData.extras.sliders, 'slider1');
		const slider2 = findExtrasById(mockGraphicData.extras.sliders, 'slider2');

		expect(slider1?.y).toBeLessThan(slider2!.y);
	});

	it('should skip sliders with undefined memory', () => {
		mockGraphicData.code = ['# slider unknownSlider'];

		updateSlidersGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.sliders.length).toBe(0);
	});
});
