import { describe, it, expect, beforeEach } from 'vitest';

import { deriveDirectiveState, prepareDirectiveGraphicData, resolveDirectiveWidgets } from '../registry';

import type { CodeBlockGraphicData, State } from '~/types';

import { createMockCodeBlock, createMockState, findExtrasById } from '~/pureHelpers/testingUtils/testUtils';

describe('slider directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['int mySlider 50', '; @slider mySlider'],
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

	function runDirectiveResolution() {
		const directiveState = deriveDirectiveState(mockGraphicData.code);
		prepareDirectiveGraphicData(mockGraphicData, mockState, directiveState);
		resolveDirectiveWidgets(mockGraphicData, mockState, directiveState);
	}

	it('adds a slider to graphic data extras', () => {
		runDirectiveResolution();

		expect(findExtrasById(mockGraphicData.extras.sliders, 'mySlider')).toBeDefined();
	});

	it('uses default integer range when min and max are not provided', () => {
		runDirectiveResolution();

		const slider = findExtrasById(mockGraphicData.extras.sliders, 'mySlider');
		expect(slider?.min).toBe(0);
		expect(slider?.max).toBe(127);
	});

	it('uses custom min, max, and step when provided', () => {
		mockGraphicData.code = ['int mySlider 50', '; @slider mySlider 0 100 5'];

		runDirectiveResolution();

		const slider = findExtrasById(mockGraphicData.extras.sliders, 'mySlider');
		expect(slider?.min).toBe(0);
		expect(slider?.max).toBe(100);
		expect(slider?.step).toBe(5);
	});

	it('clears existing sliders before resolving directive widgets', () => {
		mockGraphicData.extras.sliders.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldSlider',
			min: 0,
			max: 100,
		});

		runDirectiveResolution();

		expect(findExtrasById(mockGraphicData.extras.sliders, 'oldSlider')).toBeUndefined();
	});
});
