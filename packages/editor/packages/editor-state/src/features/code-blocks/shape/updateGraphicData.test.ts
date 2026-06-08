import type { CompiledModule, CompilerCache, MemoryDeclarationLine, ValidatedModuleAST } from '@8f4e/compiler-spec';
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

function createCompiledModule(ast: ValidatedModuleAST): CompiledModule {
	return {
		ast,
	} as CompiledModule;
}

function createModuleAst(): ValidatedModuleAST {
	return {
		type: 'module',
		id: 'filterA',
		lines: [
			{ lineNumber: 0, instruction: 'module', arguments: [{ value: 'filterA' }] },
			{ lineNumber: 1, instruction: 'shape', arguments: [{ value: 'filterState' }] },
			{ lineNumber: 2, instruction: 'float', arguments: [{ value: 'cutoff' }, { value: 1200 }] },
			{ lineNumber: 3, instruction: 'moduleEnd', arguments: [] },
		],
		memoryDeclarationLines: [],
	} as unknown as ValidatedModuleAST;
}

function createMemoryDeclarationLines(count: number): readonly MemoryDeclarationLine[] {
	return Array.from({ length: count }, (_, lineNumber) => ({
		lineNumber,
		instruction: 'float',
		arguments: [],
	})) as readonly MemoryDeclarationLine[];
}

function createCompilerCache(memoryDeclarationLines: readonly MemoryDeclarationLine[]): CompilerCache {
	return {
		ast: {
			stats: { hits: 0, misses: 0 },
			entries: new Map([
				[
					'prototype:0',
					{
						lineCount: memoryDeclarationLines.length + 2,
						ast: {
							type: 'prototype',
							id: 'filterState',
							lines: [],
							memoryDeclarationLines,
						},
					},
				],
			]),
		},
	} as unknown as CompilerCache;
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
					filterA: createCompiledModule(createModuleAst()),
				},
				cache: createCompilerCache(createMemoryDeclarationLines(4)),
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
					filterA: createCompiledModule(createModuleAst()),
				},
				cache: createCompilerCache([]),
			},
		});
		const directiveState = createDirectiveState();

		shape(module, state, directiveState);

		expect(directiveState.layoutContributions).toEqual([]);
	});
});
