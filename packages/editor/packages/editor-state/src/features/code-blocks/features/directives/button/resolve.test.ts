import { describe, it, expect, beforeEach } from 'vitest';

import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

import type { CodeBlockGraphicData, State } from '~/types';

import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
	findWidgetById,
	setMockCodeBlockCode,
} from '~/pureHelpers/testingUtils/testUtils';

describe('button directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['; @button btn1 0 1'],
			width: 100,
			gaps: new Map(),
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
							btn1: {
								id: 'btn1',
								wordAlignedAddress: 5,
								isInteger: true,
							},
							btn2: {
								id: 'btn2',
								wordAlignedAddress: 6,
								isInteger: true,
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

	it('should add button to graphicData widgets', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.buttons.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.buttons, 'btn1')).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		runDirectiveResolution();

		const btn = findWidgetById(mockGraphicData.widgets.buttons, 'btn1');
		expect(btn).toMatchSnapshot();
	});

	it('should clear existing buttons before updating', () => {
		mockGraphicData.widgets.buttons.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldButton',
			wordAlignedAddress: 0,
			isInteger: true,
			onValue: 1,
			offValue: 0,
		});

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.buttons, 'oldButton')).toBeUndefined();
	});

	it('should handle multiple buttons', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @button btn1 0 1', '; @button btn2 5 10']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.buttons.length).toBe(2);
		expect(mockGraphicData.widgets.buttons).toMatchSnapshot();
	});

	it('should position buttons at correct y coordinate based on line number', () => {
		setMockCodeBlockCode(mockGraphicData, ['nop', 'nop', '; @button btn1 0 1']);

		runDirectiveResolution();

		const btn = findWidgetById(mockGraphicData.widgets.buttons, 'btn1');
		expect(btn).toMatchSnapshot();
	});
});
