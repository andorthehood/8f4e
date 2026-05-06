import { describe, expect, it } from 'vitest';
import { createMockCodeBlock, createMockState } from '@8f4e/editor-state-testing';

import {
	deriveDirectiveState,
	runAfterGraphicDataWidthCalculation,
	runBeforeGraphicDataWidthCalculation,
} from '../registry';

describe('info directive widget resolution', () => {
	it('adds an info panel sized from state.info entries', () => {
		const state = createMockState({
			info: {
				foo: {
					a: 1,
					bar: 'foo',
					foo: 'something longer',
				},
			},
		});
		const graphicData = createMockCodeBlock({
			code: ['module foo', '; @info foo', 'moduleEnd'],
			width: 240,
			lineNumberColumnWidth: 1,
			gaps: new Map([[1, { size: 3 }]]),
		});
		const directiveState = deriveDirectiveState(graphicData.code, graphicData.parsedDirectives, { state });

		runBeforeGraphicDataWidthCalculation(graphicData, state, directiveState);
		runAfterGraphicDataWidthCalculation(graphicData, state, directiveState);

		expect(graphicData.widgets.infoPanels).toEqual([
			{
				width: 216,
				height: 48,
				x: 24,
				y: 32,
				id: 'foo',
				rowCount: 3,
			},
		]);
	});

	it('uses rounded float values when calculating panel width', () => {
		const state = createMockState({
			info: {
				foo: {
					value: 1.234567,
				},
			},
		});
		const graphicData = createMockCodeBlock({
			code: ['module foo', '; @info foo', 'moduleEnd'],
			lineNumberColumnWidth: 1,
			gaps: new Map([[1, { size: 1 }]]),
		});
		const directiveState = deriveDirectiveState(graphicData.code, graphicData.parsedDirectives, { state });

		runBeforeGraphicDataWidthCalculation(graphicData, state, directiveState);

		expect(graphicData.minGridWidth).toBe(17);
	});
});
