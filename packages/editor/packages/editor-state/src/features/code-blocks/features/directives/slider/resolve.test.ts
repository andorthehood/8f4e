import { describe, it, expect, beforeEach } from 'vitest';

import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

import type { CodeBlockGraphicData, State } from '@8f4e/editor-state-types';

import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
	findWidgetById,
	setMockCodeBlockCode,
} from '~/pureHelpers/testingUtils/testUtils';

describe('slider directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['int mySlider 50', '; @slider &mySlider'],
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
								byteAddress: 0,
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
		const directiveState = deriveDirectiveStateForMockCodeBlock(mockGraphicData);
		runBeforeGraphicDataWidthCalculation(mockGraphicData, mockState, directiveState);
		runAfterGraphicDataWidthCalculation(mockGraphicData, mockState, directiveState);
	}

	it('adds a slider to graphic data widgets', () => {
		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.sliders, 'mySlider')).toBeDefined();
	});

	it('uses default integer range when min and max are not provided', () => {
		runDirectiveResolution();

		const slider = findWidgetById(mockGraphicData.widgets.sliders, 'mySlider');
		expect(slider?.min).toBe(0);
		expect(slider?.max).toBe(127);
	});

	it('uses custom min, max, and step when provided', () => {
		setMockCodeBlockCode(mockGraphicData, ['int mySlider 50', '; @slider &mySlider 0 100 5']);

		runDirectiveResolution();

		const slider = findWidgetById(mockGraphicData.widgets.sliders, 'mySlider');
		expect(slider?.min).toBe(0);
		expect(slider?.max).toBe(100);
		expect(slider?.step).toBe(5);
	});

	it('clears existing sliders before resolving directive widgets', () => {
		mockGraphicData.widgets.sliders.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldSlider',
			wordAlignedAddress: 0,
			byteAddress: 0,
			isInteger: true,
			min: 0,
			max: 100,
		});

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.sliders, 'oldSlider')).toBeUndefined();
	});
});
