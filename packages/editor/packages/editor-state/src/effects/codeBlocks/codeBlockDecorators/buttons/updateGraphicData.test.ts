import { describe, it, expect, beforeEach } from 'vitest';

import updateButtonsGraphicData from './updateGraphicData';

import { createMockCodeBlock, createMockState } from '../../../../helpers/testUtils';

import type { CodeBlockGraphicData, State } from '../../../../types';

describe('updateButtonsGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['button btn1 0 1'],
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

	it('should add button to graphicData extras', () => {
		updateButtonsGraphicData(mockGraphicData, mockState);

		expect(Object.keys(mockGraphicData.extras.buttons).length).toBe(1);
		expect('btn1' in mockGraphicData.extras.buttons).toBe(true);
	});

	it('should calculate correct dimensions and position', () => {
		updateButtonsGraphicData(mockGraphicData, mockState);

		const btn = mockGraphicData.extras.buttons['btn1'];
		expect(btn).toMatchSnapshot();
	});

	it('should clear existing buttons before updating', () => {
		mockGraphicData.extras.buttons['oldButton'] = {
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldButton',
			onValue: 1,
			offValue: 0,
		};

		updateButtonsGraphicData(mockGraphicData, mockState);

		expect('oldButton' in mockGraphicData.extras.buttons).toBe(false);
	});

	it('should handle multiple buttons', () => {
		mockGraphicData.code = ['button btn1 0 1', 'button btn2 5 10'];

		updateButtonsGraphicData(mockGraphicData, mockState);

		expect(Object.keys(mockGraphicData.extras.buttons).length).toBe(2);
		expect(mockGraphicData.extras.buttons).toMatchSnapshot();
	});

	it('should position buttons at correct y coordinate based on line number', () => {
		mockGraphicData.code = ['nop', 'nop', 'button btn1 0 1'];

		updateButtonsGraphicData(mockGraphicData, mockState);

		const btn = mockGraphicData.extras.buttons['btn1'];
		expect(btn).toMatchSnapshot();
	});
});
