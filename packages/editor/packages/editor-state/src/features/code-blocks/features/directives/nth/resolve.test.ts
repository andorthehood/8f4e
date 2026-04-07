import { describe, it, expect, beforeEach } from 'vitest';

import { runAfterGraphicDataWidthCalculation, runBeforeGraphicDataWidthCalculation } from '../registry';

import type { CodeBlockGraphicData, State } from '~/types';

import {
	createMockCodeBlock,
	createMockState,
	deriveDirectiveStateForMockCodeBlock,
} from '~/pureHelpers/testingUtils/testUtils';

describe('nth directive widget resolution', () => {
	let mockGraphicData: CodeBlockGraphicData;
	let mockState: State;

	beforeEach(() => {
		mockGraphicData = createMockCodeBlock({
			id: 'module-b',
			moduleId: 'module-b',
			code: ['; @nth'],
			lineNumberColumnWidth: 2,
			gaps: new Map(),
		});

		mockState = createMockState({
			viewport: {
				vGrid: 10,
				hGrid: 20,
			},
			compiler: {
				compiledModules: {
					'module-a': {} as never,
					'module-b': {} as never,
					'module-c': {} as never,
				},
			},
		});
	});

	function runDirectiveResolution() {
		const directiveState = deriveDirectiveStateForMockCodeBlock(mockGraphicData);
		runBeforeGraphicDataWidthCalculation(mockGraphicData, mockState, directiveState);
		runAfterGraphicDataWidthCalculation(mockGraphicData, mockState, directiveState);
	}

	it('adds a debugger-style widget with the 1-based compiled module index', () => {
		runDirectiveResolution();

		expect(mockGraphicData.widgets.debuggers).toEqual([
			expect.objectContaining({
				width: 20,
				height: 20,
				y: 0,
				id: '__nth__',
				showAddress: false,
				showEndAddress: false,
				bufferPointer: 0,
				displayFormat: 'decimal',
				text: '2',
			}),
		]);
	});

	it('does not add a widget when the module is absent from compiledModules', () => {
		mockState.compiler.compiledModules = {
			'module-a': {} as never,
		};

		runDirectiveResolution();

		expect(mockGraphicData.widgets.debuggers).toEqual([]);
	});
});
