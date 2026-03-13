import { describe, it, expect, beforeEach } from 'vitest';

import updateSwitchesGraphicData from './updateGraphicData';

import type { CodeBlockGraphicData, State } from '~/types';

import { createMockCodeBlock, createMockState, findWidgetById } from '~/pureHelpers/testingUtils/testUtils';

describe('updateSwitchesGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			code: ['; @switch sw1 0 1'],
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

	it('should add switch to graphicData widgets', () => {
		updateSwitchesGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.switches.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.switches, 'sw1')).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		updateSwitchesGraphicData(mockGraphicData, mockState);

		const sw = findWidgetById(mockGraphicData.widgets.switches, 'sw1');
		expect(sw).toMatchSnapshot();
	});

	it('should clear existing switches before updating', () => {
		mockGraphicData.widgets.switches.push({
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldSwitch',
			onValue: 1,
			offValue: 0,
		});

		updateSwitchesGraphicData(mockGraphicData, mockState);

		expect(findWidgetById(mockGraphicData.widgets.switches, 'oldSwitch')).toBeUndefined();
	});

	it('should handle multiple switches', () => {
		mockGraphicData.code = ['; @switch sw1 0 1', '; @switch sw2 5 10'];

		updateSwitchesGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.widgets.switches.length).toBe(2);
		expect(mockGraphicData.widgets.switches).toMatchSnapshot();
	});

	it('should position switches at correct y coordinate based on line number', () => {
		mockGraphicData.code = ['nop', 'nop', '; @switch sw1 0 1'];

		updateSwitchesGraphicData(mockGraphicData, mockState);

		const sw = findWidgetById(mockGraphicData.widgets.switches, 'sw1');
		expect(sw).toMatchSnapshot();
	});

	it('should handle switches with custom values', () => {
		mockGraphicData.code = ['; @switch sw1 -5 100'];

		updateSwitchesGraphicData(mockGraphicData, mockState);

		const sw = findWidgetById(mockGraphicData.widgets.switches, 'sw1');
		expect(sw).toMatchSnapshot();
	});

	it('should position switches correctly with gaps', () => {
		mockGraphicData.gaps = new Map([[1, { size: 1 }]]); // Gap at line 1
		mockGraphicData.code = ['; @switch sw1 0 1', 'nop', '; @switch sw2 0 1'];

		updateSwitchesGraphicData(mockGraphicData, mockState);

		const sw1 = findWidgetById(mockGraphicData.widgets.switches, 'sw1');
		const sw2 = findWidgetById(mockGraphicData.widgets.switches, 'sw2');

		expect(sw1?.y).toBe(0); // First switch at line 0
		expect(sw2?.y).toBeGreaterThan(sw1!.y); // Second switch should be below
	});
});
