import type { MemoryDeclarationLine, RegionLine, ValidatedModuleAST } from '@8f4e/compiler-spec';
import { ArgumentType } from '@8f4e/compiler-spec';
import { describe, expect, it } from 'vitest';
import { planMemoryLayout } from './index';

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
	memoryDeclarationLines: readonly MemoryDeclarationLine[],
	regionLine?: RegionLine
): ValidatedModuleAST {
	return {
		type: 'module',
		id,
		lines: [],
		moduleLine: {
			lineNumber,
			instruction: 'module',
			arguments: [identifier(id)],
		},
		...(regionLine ? { regionLine } : {}),
		memoryDeclarationLines,
	} as ValidatedModuleAST;
}

describe('planMemoryLayout', () => {
	it('plans module start addresses and declaration addresses from ASTs', () => {
		const plan = planMemoryLayout({
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
});
