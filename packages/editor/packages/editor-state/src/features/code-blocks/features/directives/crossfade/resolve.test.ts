import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryTypes } from '@8f4e/compiler';

import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

import type { CodeBlockGraphicData, State } from '~/types';

import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
	setMockCodeBlockCode,
} from '~/pureHelpers/testingUtils/testUtils';

describe('crossfade directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'test-block',
			moduleId: 'test-block',
			code: ['float dry 0', 'float wet 0', '; @crossfade &dry &wet'],
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
							dry: {
								id: 'dry',
								wordAlignedAddress: 0,
								byteAddress: 0,
								numberOfElements: 1,
								elementWordSize: 1,
								type: MemoryTypes.float,
								wordAlignedSize: 1,
								default: 0,
								isInteger: false,
								isFloat64: false,
							},
							wet: {
								id: 'wet',
								wordAlignedAddress: 1,
								byteAddress: 4,
								numberOfElements: 1,
								elementWordSize: 1,
								type: MemoryTypes.float,
								wordAlignedSize: 1,
								default: 0,
								isInteger: false,
								isFloat64: false,
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

	it('adds a crossfade widget for two float scalars', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.crossfades).toHaveLength(1);
		expect(mockGraphicData.widgets.crossfades[0]).toMatchObject({
			leftId: 'dry',
			rightId: 'wet',
			leftWordAddress: 0,
			rightWordAddress: 1,
			handleWidth: 10,
			trackWidth: 160,
			centerX: 80,
			height: 40,
		});
	});

	it('does not add a crossfade when the bound memory is not float32 scalar', () => {
		mockState.compiler.compiledModules['test-block'].memoryMap.wet.isInteger = true;

		runDirectiveResolution();

		expect(mockGraphicData.widgets.crossfades).toHaveLength(0);
	});

	it('clears existing crossfades before resolving directive widgets', () => {
		mockGraphicData.widgets.crossfades.push({
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			leftId: 'oldLeft',
			rightId: 'oldRight',
			leftWordAddress: 0,
			rightWordAddress: 0,
			handleWidth: 0,
			trackWidth: 1,
			centerX: 0,
		});

		runDirectiveResolution();

		expect(mockGraphicData.widgets.crossfades).toHaveLength(1);
		expect(mockGraphicData.widgets.crossfades[0].leftId).toBe('dry');
	});

	it('ignores directives with unresolved memory ids', () => {
		setMockCodeBlockCode(mockGraphicData, ['; @crossfade &dry &missing']);

		runDirectiveResolution();

		expect(mockGraphicData.widgets.crossfades).toHaveLength(0);
	});
});
