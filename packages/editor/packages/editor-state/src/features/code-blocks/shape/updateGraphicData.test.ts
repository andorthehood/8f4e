import type { CompiledModule } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import { createMockState } from '../../../pureHelpers/testingUtils/testUtils';
import type { DirectiveDerivedState } from '../features/directives/registry';
import { createCodeBlockGraphicData } from '../utils/createCodeBlockGraphicData';
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

function createCompiledModule(shapeExpansions: NonNullable<CompiledModule['shapeExpansions']>): CompiledModule {
	return {
		shapeExpansions,
	} as CompiledModule;
}

function createMemoryDeclarationLines(
	count: number
): NonNullable<CompiledModule['shapeExpansions']>[number]['memoryDeclarationLines'] {
	return Array.from({ length: count }, (_, lineNumber) => ({
		lineNumber,
		instruction: 'float',
		arguments: [],
	})) as NonNullable<CompiledModule['shapeExpansions']>[number]['memoryDeclarationLines'];
}

describe('shape', () => {
	it('contributes one layout row per compiler-reported inherited declaration under shape lines', () => {
		const module = createCodeBlockGraphicData({
			blockType: 'module',
			code: ['module filterA', 'shape filterState', 'float cutoff 1200', 'moduleEnd'],
		});
		const state = createMockState({
			compiler: {
				compiledModules: {
					filterA: createCompiledModule([
						{
							lineNumber: 1,
							prototypeId: 'filterState',
							memoryDeclarationLines: createMemoryDeclarationLines(4),
						},
					]),
				},
			},
		});
		const directiveState = createDirectiveState();

		shape(module, state, directiveState);

		expect(directiveState.layoutContributions).toEqual([{ rawRow: 1, rows: 4 }]);
	});

	it('skips modules without compiler-reported shape expansions', () => {
		const module = createCodeBlockGraphicData({
			blockType: 'module',
			code: ['module filterA', 'shape filterState', 'shape missingState', 'moduleEnd'],
		});
		const state = createMockState({
			compiler: {
				compiledModules: {
					filterA: createCompiledModule([]),
				},
			},
		});
		const directiveState = createDirectiveState();

		shape(module, state, directiveState);

		expect(directiveState.layoutContributions).toEqual([]);
	});
});
