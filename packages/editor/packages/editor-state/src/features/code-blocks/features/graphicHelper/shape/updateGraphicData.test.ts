import { describe, expect, it } from 'vitest';
import { createCodeBlockGraphicData } from '../../../utils/createCodeBlockGraphicData';
import type { DirectiveDerivedState } from '../../directives/registry';
import shape from './updateGraphicData';

function createDirectiveState(): DirectiveDerivedState {
	return {
		blockState: { disabled: false, hidden: false, isHome: false, isFavorite: false, opacity: 1 },
		displayState: {},
		displayModel: {
			lines: [],
			displayRowToRawRow: [],
			rawRowToDisplayRow: [],
			isCollapsed: false,
		},
		layoutContributions: [],
		widgets: [],
	};
}

describe('shape', () => {
	it('contributes one layout row per inherited prototype declaration under shape lines', () => {
		const prototype = createCodeBlockGraphicData({
			blockType: 'prototype',
			code: [
				'prototype filterState',
				'float* input',
				'float cutoff',
				'float resonance',
				'float output',
				'prototypeEnd',
			],
		});
		const module = createCodeBlockGraphicData({
			blockType: 'module',
			code: ['module filterA', 'shape filterState', 'float cutoff 1200', 'moduleEnd'],
		});
		const directiveState = createDirectiveState();

		shape(module, [prototype, module], directiveState);

		expect(directiveState.layoutContributions).toEqual([{ rawRow: 1, rows: 4 }]);
	});

	it('skips unknown shapes and disabled prototypes', () => {
		const disabledPrototype = createCodeBlockGraphicData({
			blockType: 'prototype',
			disabled: true,
			code: ['prototype filterState', 'float* input', 'float output', 'prototypeEnd'],
		});
		const module = createCodeBlockGraphicData({
			blockType: 'module',
			code: ['module filterA', 'shape filterState', 'shape missingState', 'moduleEnd'],
		});
		const directiveState = createDirectiveState();

		shape(module, [disabledPrototype, module], directiveState);

		expect(directiveState.layoutContributions).toEqual([]);
	});
});
