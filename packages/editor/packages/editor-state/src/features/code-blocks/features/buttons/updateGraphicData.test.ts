import { describe, it, expect, beforeEach } from 'vitest';

import updateButtonsGraphicData from './updateGraphicData';

import type { CodeBlockGraphicData, State } from '~/types';

import { createMockCodeBlock, createMockState, findWidgetById } from '~/pureHelpers/testingUtils/testUtils';

describe('updateButtonsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
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
		});
	});

	it('should add button to graphicData widgets', () => {
		updateButtonsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.buttons.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.buttons, 'btn1')).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		updateButtonsGraphicData(mockGraphicData, mockState);

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
			onValue: 1,
			offValue: 0,
		});

		updateButtonsGraphicData(mockGraphicData, mockState);

		expect(findWidgetById(mockGraphicData.widgets.buttons, 'oldButton')).toBeUndefined();
	});

	it('should handle multiple buttons', () => {
		mockGraphicData.code = ['; @button btn1 0 1', '; @button btn2 5 10'];

		updateButtonsGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.buttons.length).toBe(2);
		expect(mockGraphicData.widgets.buttons).toMatchSnapshot();
	});

	it('should position buttons at correct y coordinate based on line number', () => {
		mockGraphicData.code = ['nop', 'nop', '; @button btn1 0 1'];

		updateButtonsGraphicData(mockGraphicData, mockState);

		const btn = findWidgetById(mockGraphicData.widgets.buttons, 'btn1');
		expect(btn).toMatchSnapshot();
	});
});
