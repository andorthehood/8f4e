import type { MemoryDeclarationLine, RegionLine, ShapeLine } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import {
	type MemoryLayoutSourceModule,
	type MemoryLayoutSourcePrototype,
	MemoryPlannerError,
	planMemoryLayout,
} from './index';

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

function moduleAst(
	id: string,
	lineNumber: number,
	lines: MemoryLayoutSourceModule['lines'],
	regionLine?: RegionLine
): MemoryLayoutSourceModule {
	return {
		id,
		moduleLine: {
			lineNumber,
			instruction: 'module',
			arguments: [identifier(id)],
		},
		...(regionLine ? { regionLine } : {}),
		lines,
	};
}

function prototypeSource(
	id: string,
	memoryDeclarationLines: readonly MemoryDeclarationLine[]
): MemoryLayoutSourcePrototype {
	return {
		id,
		memoryDeclarationLines,
	};
}

function shapeLine(id: string, lineNumber: number): ShapeLine {
	return {
		lineNumber,
		instruction: 'shape',
		arguments: [identifier(id)],
	};
}

describe('planMemoryLayout', () => {
	it('plans module start addresses and declaration addresses from ASTs', () => {
		const plan = planMemoryLayout({
			prototypes: [],
			modules: [
				moduleAst('first', 1, [
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
				moduleAst('second', 10, [
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
		const plan = planMemoryLayout({
			prototypes: [],
			modules: [
				moduleAst('defaultModule', 1, [
					{
						lineNumber: 2,
						instruction: 'int[]',
						hasExplicitMemoryDefault: false,
						arguments: [identifier('values'), literal(3)],
					},
				]),
				moduleAst(
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
		const plan = planMemoryLayout({
			prototypes: [],
			modules: [
				moduleAst('main', 1, [
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

		const plan = planMemoryLayout({
			prototypes: [prototypeSource('state', [foo, bar])],
			modules: [moduleAst('main', 1, [shapeLine('state', 11), local])],
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
			planMemoryLayout({
				prototypes: [],
				modules: [moduleAst('main', 1, [shapeLine('missing', 11)])],
			})
		).toThrow(MemoryPlannerError);
	});
});
