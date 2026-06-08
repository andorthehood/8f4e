import type { CompiledModule, DataStructure, ValidatedModuleAST } from '@8f4e/compiler-spec';
import { MemoryTypes } from '@8f4e/compiler-spec';
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

function createMemory(overrides: Partial<DataStructure> = {}): DataStructure {
	return {
		id: 'memory',
		numberOfElements: 1,
		elementWordSize: 4,
		type: MemoryTypes.float,
		memoryIndex: 0,
		byteAddress: 20,
		wordAlignedAddress: 5,
		wordAlignedSize: 1,
		default: 0,
		lineNumber: 1,
		isInteger: false,
		pointerDepth: 0,
		isUnsigned: false,
		...overrides,
	};
}

function createCompiledModule(memoryMap: CompiledModule['memoryMap'] = {}): CompiledModule {
	return {
		ast: createModuleAst(),
		memoryMap,
	} as CompiledModule;
}

function createInheritedMemoryMap(count: number): CompiledModule['memoryMap'] {
	return Object.fromEntries(
		Array.from({ length: count }, (_, index) => [
			`memory${index}`,
			createMemory({ id: `memory${index}`, lineNumber: 1, isInherited: true }),
		])
	);
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
					filterA: createCompiledModule(createInheritedMemoryMap(4)),
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
					filterA: createCompiledModule(),
				},
			},
		});
		const directiveState = createDirectiveState();

		shape(module, state, directiveState);

		expect(directiveState.layoutContributions).toEqual([]);
	});
});
