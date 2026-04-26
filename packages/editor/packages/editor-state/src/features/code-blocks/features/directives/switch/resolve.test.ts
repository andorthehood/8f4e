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

describe('switch directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
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
			compiler: {
				compiledModules: {
					'test-block': {
						memoryMap: {
							sw1: {
								id: 'sw1',
								wordAlignedAddress: 5,
								isInteger: true,
							},
							sw2: {
								id: 'sw2',
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

	it('should add switch to graphicData widgets', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.switches.length).toBe(1);
		expect(findWidgetById(mockGraphicData.widgets.switches, 'sw1')).toBeDefined();
	});

	it('should calculate correct dimensions and position', () => {
		runDirectiveResolution();

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
			wordAlignedAddress: 0,
			isInteger: true,
			onValue: 1,
			offValue: 0,
		});

		runDirectiveResolution();

		expect(findWidgetById(mockGraphicData.widgets.switches, 'oldSwitch')).toBeUndefined();
	});

	it('should handle multiple switches', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @switch sw1 0 1', '; @switch sw2 5 10']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.switches.length).toBe(2);
		expect(mockGraphicData.widgets.switches).toMatchSnapshot();
	});

	it('should position switches at correct y coordinate based on line number', () => {
		setMockCodeBlockCode(mockGraphicData, ['nop', 'nop', '; @switch sw1 0 1']);

		runDirectiveResolution();

		const sw = findWidgetById(mockGraphicData.widgets.switches, 'sw1');
		expect(sw).toMatchSnapshot();
	});

	it('should handle switches with custom values', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @switch sw1 -5 100']);

		runDirectiveResolution();

		const sw = findWidgetById(mockGraphicData.widgets.switches, 'sw1');
		expect(sw).toMatchSnapshot();
	});

	it('should position switches correctly with gaps', () => {
		mockGraphicData.gaps = new Map([[1, { size: 1 }]]); // Gap at line 1
		setMockCodeBlockCode(mockGraphicData, ['; @switch sw1 0 1', 'nop', '; @switch sw2 0 1']);

		runDirectiveResolution();

		const sw1 = findWidgetById(mockGraphicData.widgets.switches, 'sw1');
		const sw2 = findWidgetById(mockGraphicData.widgets.switches, 'sw2');

		expect(sw1?.y).toBe(0); // First switch at line 0
		expect(sw2?.y).toBeGreaterThan(sw1!.y); // Second switch should be below
	});
});
