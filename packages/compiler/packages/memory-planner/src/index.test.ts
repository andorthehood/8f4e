import type {
	ArgumentCompileTimeExpression,
	CompilerASTLine,
	MemoryDeclarationLine,
	RegionLine,
	ShapeLine,
	ValidatedModuleAST,
	ValidatedPrototypeAST,
} from '@8f4e/language-spec';
import { ArgumentType } from '@8f4e/language-spec';
import { describe, expect, it } from 'vitest';
import { MemoryPlannerError, planProjectMemoryLayout } from './index';

function identifier(value: string) {
	return {
		type: ArgumentType.IDENTIFIER,
		value,
		referenceKind: 'plain',
		scope: 'local',
	} as const;
}

function literal(value: number) {
	return {
		type: ArgumentType.LITERAL,
		value,
		isInteger: true,
	} as const;
}

function expression(
	left: ReturnType<typeof literal>,
	operator: ArgumentCompileTimeExpression['operator'],
	right: ReturnType<typeof literal>
): ArgumentCompileTimeExpression {
	return {
		type: ArgumentType.COMPILE_TIME_EXPRESSION,
		left,
		operator,
		right,
		intermoduleIds: [],
	};
}

function shapeLine(id: string, lineNumber: number): ShapeLine {
	return {
		lineNumber,
		instruction: 'shape',
		arguments: [identifier(id)],
	};
}

function moduleLine(id: string, lineNumber: number) {
	return {
		lineNumber,
		instruction: 'module',
		arguments: [identifier(id)],
	} as const;
}

function validatedModuleAst(
	id: string,
	lineNumber: number,
	lines: readonly CompilerASTLine[],
	regionLine?: RegionLine
): ValidatedModuleAST {
	const line = moduleLine(id, lineNumber);

	return {
		type: 'module',
		id,
		lines: [line, ...(regionLine ? [regionLine] : []), ...lines],
		moduleLine: line,
		...(regionLine ? { regionLine } : {}),
		memoryDeclarationLines: [],
	} as ValidatedModuleAST;
}

function prototypeAst(
	id: string,
	lineNumber: number,
	memoryDeclarationLines: readonly MemoryDeclarationLine[]
): ValidatedPrototypeAST {
	const prototypeLine = {
		lineNumber,
		instruction: 'prototype',
		arguments: [identifier(id)],
	} as const;

	return {
		type: 'prototype',
		id,
		lines: [prototypeLine, ...memoryDeclarationLines],
		prototypeLine,
		memoryDeclarationLines,
	} as ValidatedPrototypeAST;
}

describe('planProjectMemoryLayout', () => {
	it('plans module start addresses and declaration addresses from ASTs', () => {
		const plan = planProjectMemoryLayout({
			prototypes: [],
			modules: [
				validatedModuleAst('first', 1, [
					{
						lineNumber: 2,
						instruction: 'int',
						hasExplicitMemoryDefault: false,
						arguments: [identifier('counter')],
					},
					{
						lineNumber: 3,
						instruction: 'int8[]',
						hasExplicitMemoryDefault: false,
						arguments: [identifier('bytes'), literal(5)],
					},
				]),
				validatedModuleAst('second', 10, [
					{
						lineNumber: 11,
						instruction: 'float64',
						hasExplicitMemoryDefault: false,
						arguments: [identifier('phase')],
					},
				]),
			],
			startingByteAddress: 4,
		});

		expect(plan.modules.first.byteAddress).toBe(4);
		expect(plan.modules.first.wordAlignedSize).toBe(3);
		expect(plan.modules.first.memory.counter.byteAddress).toBe(4);
		expect(plan.modules.first.memory.bytes.byteAddress).toBe(8);
		expect(plan.modules.second.byteAddress).toBe(16);
		expect(plan.modules.second.memory.phase.byteAddress).toBe(16);
		expect(plan.nextByteAddressByMemoryIndex[0]).toBe(24);
	});

	it('keeps module address cursors independent per memory region', () => {
		const audioRegionLine: RegionLine = {
			lineNumber: 10,
			instruction: '#region',
			arguments: [identifier('audio')],
			isBlockPrologue: true,
		};
		const plan = planProjectMemoryLayout({
			prototypes: [],
			modules: [
				validatedModuleAst('defaultModule', 1, [
					{
						lineNumber: 2,
						instruction: 'int[]',
						hasExplicitMemoryDefault: false,
						arguments: [identifier('values'), literal(3)],
					},
				]),
				validatedModuleAst(
					'audioModule',
					9,
					[
						{
							lineNumber: 11,
							instruction: 'float[]',
							hasExplicitMemoryDefault: false,
							arguments: [identifier('samples'), literal(2)],
						},
					],
					audioRegionLine
				),
			],
			startingByteAddress: 4,
			memoryRegions: ['audio'],
		});

		expect(plan.modules.defaultModule).toMatchObject({
			byteAddress: 4,
			memoryIndex: 0,
			wordAlignedSize: 3,
		});
		expect(plan.modules.audioModule).toMatchObject({
			byteAddress: 4,
			memoryIndex: 1,
			memoryRegionName: 'audio',
			wordAlignedSize: 2,
		});
		expect(plan.nextByteAddressByMemoryIndex).toEqual({
			0: 16,
			1: 12,
		});
	});

	it('plans compiler-normalized declaration lines', () => {
		const plan = planProjectMemoryLayout({
			prototypes: [],
			modules: [
				validatedModuleAst('main', 1, [
					{
						lineNumber: 2,
						instruction: 'int[]',
						hasExplicitMemoryDefault: false,
						arguments: [identifier('values'), literal(4)],
					},
				]),
			],
		});

		expect(plan.modules.main.memory.values.numberOfElements).toBe(4);
		expect(plan.modules.main.wordAlignedSize).toBe(4);
	});

	it('plans anonymous scalar declarations with generated ids', () => {
		const line = {
			lineNumber: 2,
			instruction: 'float',
			hasExplicitMemoryDefault: false,
			arguments: [],
		} as MemoryDeclarationLine;

		const plan = planProjectMemoryLayout({
			prototypes: [],
			modules: [validatedModuleAst('main', 1, [line])],
		});

		expect(plan.modules.main.declarations[0].id).toBe('__anonymous__2');
		expect(plan.modules.main.memory.__anonymous__2.byteAddress).toBe(4);
	});

	it('expands shape declarations into effective declaration sources', () => {
		const foo = {
			lineNumber: 2,
			instruction: 'int',
			hasExplicitMemoryDefault: false,
			arguments: [identifier('foo')],
		} satisfies MemoryDeclarationLine;
		const bar = {
			lineNumber: 3,
			instruction: 'float[]',
			hasExplicitMemoryDefault: false,
			arguments: [identifier('bar'), literal(2)],
		} satisfies MemoryDeclarationLine;
		const local = {
			lineNumber: 12,
			instruction: 'int',
			hasExplicitMemoryDefault: false,
			arguments: [identifier('local')],
		} satisfies MemoryDeclarationLine;

		const plan = planProjectMemoryLayout({
			prototypes: [prototypeAst('state', 1, [foo, bar])],
			modules: [validatedModuleAst('main', 1, [shapeLine('state', 11), local])],
			startingByteAddress: 4,
		});

		expect(plan.modules.main.declarations.map(declaration => declaration.id)).toEqual(['foo', 'bar', 'local']);
		expect(plan.modules.main.declarationSources).toEqual([
			{ line: { ...foo, lineNumber: 11 }, isInherited: true },
			{ line: { ...bar, lineNumber: 11 }, isInherited: true },
			{ line: local, isInherited: false },
		]);
		expect(plan.modules.main.memory.local.byteAddress).toBe(16);
	});

	it('rejects unknown shape declarations while planning layout', () => {
		expect(() =>
			planProjectMemoryLayout({
				prototypes: [],
				modules: [validatedModuleAst('main', 1, [shapeLine('missing', 11)])],
			})
		).toThrow(MemoryPlannerError);
	});
});

describe('planner input building', () => {
	it('builds planner-ready source from validated module and prototype ASTs', () => {
		const inherited = {
			lineNumber: 20,
			instruction: 'int',
			hasExplicitMemoryDefault: false,
			arguments: [identifier('inherited')],
		} satisfies MemoryDeclarationLine;
		const local = {
			lineNumber: 4,
			instruction: 'int[]',
			hasExplicitMemoryDefault: false,
			arguments: [identifier('values'), expression(literal(2), '*', literal(3))],
		} satisfies MemoryDeclarationLine;

		const plan = planProjectMemoryLayout({
			prototypes: [prototypeAst('state', 19, [inherited])],
			modules: [validatedModuleAst('main', 1, [shapeLine('state', 3), local])],
			startingByteAddress: 4,
		});

		expect(plan.modules.main.declarations.map(declaration => declaration.id)).toEqual(['inherited', 'values']);
		expect(plan.modules.main.memory.values.numberOfElements).toBe(6);
		expect(plan.modules.main.declarationSources).toEqual([
			{ line: { ...inherited, lineNumber: 3 }, isInherited: true },
			{
				line: {
					...local,
					arguments: [identifier('values'), literal(6)],
				},
				isInherited: false,
			},
		]);
	});

	it('rejects unresolved array declaration sizes while building planner input', () => {
		const line = {
			lineNumber: 4,
			instruction: 'int[]',
			hasExplicitMemoryDefault: false,
			arguments: [identifier('values'), identifier('missing')],
		} satisfies MemoryDeclarationLine;

		expect(() =>
			planProjectMemoryLayout({
				prototypes: [],
				modules: [validatedModuleAst('main', 1, [line])],
			})
		).toThrow(MemoryPlannerError);
	});

	it('rejects duplicate prototype ids while building planner input', () => {
		const first = prototypeAst('state', 1, []);
		const second = prototypeAst('state', 10, []);

		expect(() =>
			planProjectMemoryLayout({
				prototypes: [first, second],
				modules: [],
			})
		).toThrow(MemoryPlannerError);
	});
});
