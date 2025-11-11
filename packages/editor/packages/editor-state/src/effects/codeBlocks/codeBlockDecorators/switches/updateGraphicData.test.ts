import { describe, it, expect, beforeEach } from 'vitest';

import updateSwitchesGraphicData from './updateGraphicData';

import { createMockCodeBlock, createMockState } from '../../../../helpers/testUtils';

import type { CodeBlockGraphicData, State } from '../../../../types';

describe('updateSwitchesGraphicData', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			trimmedCode: ['switch sw1 0 1'],
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

	it('should add switch to graphicData extras', () => {
		updateSwitchesGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.switches.size).toBe(1);
		expect(mockGraphicData.extras.switches.has('sw1')).toBe(true);
	});

	it('should calculate correct dimensions and position', () => {
		updateSwitchesGraphicData(mockGraphicData, mockState);

		const sw = mockGraphicData.extras.switches.get('sw1');
		expect(sw).toMatchSnapshot();
	});

	it('should clear existing switches before updating', () => {
		mockGraphicData.extras.switches.set('oldSwitch', {
			width: 0,
			height: 0,
			x: 0,
			y: 0,
			id: 'oldSwitch',
			onValue: 1,
			offValue: 0,
		});

		updateSwitchesGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.switches.has('oldSwitch')).toBe(false);
	});

	it('should handle multiple switches', () => {
		mockGraphicData.trimmedCode = ['switch sw1 0 1', 'switch sw2 5 10'];

		updateSwitchesGraphicData(mockGraphicData, mockState);

		expect(mockGraphicData.extras.switches.size).toBe(2);
		expect(Array.from(mockGraphicData.extras.switches.entries())).toMatchSnapshot();
	});

	it('should position switches at correct y coordinate based on line number', () => {
		mockGraphicData.trimmedCode = ['nop', 'nop', 'switch sw1 0 1'];

		updateSwitchesGraphicData(mockGraphicData, mockState);

		const sw = mockGraphicData.extras.switches.get('sw1');
		expect(sw).toMatchSnapshot();
	});

	it('should handle switches with custom values', () => {
		mockGraphicData.trimmedCode = ['switch sw1 -5 100'];

		updateSwitchesGraphicData(mockGraphicData, mockState);

		const sw = mockGraphicData.extras.switches.get('sw1');
		expect(sw).toMatchSnapshot();
	});

	it('should position switches correctly with gaps', () => {
		mockGraphicData.gaps = new Map([[1, { size: 1 }]]); // Gap at line 1
		mockGraphicData.trimmedCode = ['switch sw1 0 1', 'nop', 'switch sw2 0 1'];

		updateSwitchesGraphicData(mockGraphicData, mockState);

		const sw1 = mockGraphicData.extras.switches.get('sw1');
		const sw2 = mockGraphicData.extras.switches.get('sw2');

		expect(sw1?.y).toBe(0); // First switch at line 0
		expect(sw2?.y).toBeGreaterThan(sw1!.y); // Second switch should be below
	});
});
