import type { ArrayMemoryDeclarationLine, MemoryDeclarationLine, ModuleLine, ShapeLine } from '@8f4e/compiler-spec';
import { ArgumentType, ErrorCode } from '@8f4e/compiler-spec';
import {
	type MemoryLayoutSourceModule,
	type MemoryLayoutSourcePrototype,
	planMemoryLayout,
} from '@8f4e/memory-planner';
import { describe, expect, it } from 'vitest';
import { MemoryDefaultResolverError, resolveMemoryDefaults } from './index';

const { classifyIdentifier } = await import('@8f4e/tokenizer');

function literal(value: number, isInteger = Number.isInteger(value)) {
	return {
		type: ArgumentType.LITERAL,
		value,
		isInteger,
	} as const;
}

function moduleLine(id: string, lineNumber = 1): ModuleLine {
	return {
		lineNumber,
		instruction: 'module',
		arguments: [classifyIdentifier(id)],
	};
}

function scalarLine(
	lineNumber: number,
	instruction: MemoryDeclarationLine['instruction'],
	args: MemoryDeclarationLine['arguments'],
	hasExplicitMemoryDefault = args.length > 1
): MemoryDeclarationLine {
	return {
		lineNumber,
		instruction,
		hasExplicitMemoryDefault,
		arguments: args,
	} as MemoryDeclarationLine;
}

function arrayLine(
	lineNumber: number,
	instruction: ArrayMemoryDeclarationLine['instruction'],
	args: ArrayMemoryDeclarationLine['arguments'],
	hasExplicitMemoryDefault = args.length > 2
): ArrayMemoryDeclarationLine {
	return {
		lineNumber,
		instruction,
		hasExplicitMemoryDefault,
		arguments: args,
	};
}

function moduleSource(id: string, lines: MemoryLayoutSourceModule['lines']): MemoryLayoutSourceModule {
	return {
		id,
		moduleLine: moduleLine(id),
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

describe('resolveMemoryDefaults', () => {
	it('resolves scalar and array declaration defaults', () => {
		const counter = scalarLine(2, 'int', [classifyIdentifier('counter'), literal(7)]);
		const values = arrayLine(3, 'float[]', [
			classifyIdentifier('values'),
			literal(3),
			literal(1.5, false),
			literal(2.5, false),
		]);
		const module = moduleSource('main', [counter, values]);
		const memoryPlan = planMemoryLayout({
			prototypes: [],
			modules: [module],
		});

		const result = resolveMemoryDefaults({
			memoryPlan,
		});

		expect(result.memoryDefaultsByModuleId.main).toEqual({
			counter: { value: 7, hasExplicitDefault: true, isInherited: false },
			values: { value: { 0: 1.5, 1: 2.5 }, hasExplicitDefault: true, isInherited: false },
		});
	});

	it('derives pointer metadata from address defaults', () => {
		const buffer = arrayLine(2, 'int[]', [classifyIdentifier('buffer'), literal(4)]);
		const pointer = scalarLine(3, 'int*', [classifyIdentifier('ptr'), classifyIdentifier('&buffer')]);
		const module = moduleSource('main', [buffer, pointer]);
		const memoryPlan = planMemoryLayout({
			prototypes: [],
			modules: [module],
			startingByteAddress: 4,
		});

		const result = resolveMemoryDefaults({
			memoryPlan,
		});

		expect(result.memoryDefaultsByModuleId.main.ptr).toMatchObject({
			value: memoryPlan.modules.main.memory.buffer.byteAddress,
			hasExplicitDefault: true,
			isInherited: false,
		});
		expect(result.pointerMetadataByModuleId.main.ptr).toEqual({
			pointeeMemoryIndex: 0,
			pointeeElementCount: 4,
		});
	});

	it('preserves inherited shape defaults until local declarations override them', () => {
		const prototypeFoo = scalarLine(2, 'int', [classifyIdentifier('foo'), literal(1)]);
		const prototypeBar = scalarLine(3, 'int', [classifyIdentifier('bar'), literal(3)]);
		const shape = {
			lineNumber: 11,
			instruction: 'shape',
			arguments: [classifyIdentifier('state')],
		} satisfies ShapeLine;
		const localFoo = scalarLine(12, 'int', [classifyIdentifier('foo'), literal(2)]);
		const prototype = prototypeSource('state', [prototypeFoo, prototypeBar]);
		const module = moduleSource('main', [shape, localFoo]);
		const memoryPlan = planMemoryLayout({
			prototypes: [prototype],
			modules: [module],
		});

		const result = resolveMemoryDefaults({
			memoryPlan,
		});

		expect(result.memoryDefaultsByModuleId.main).toEqual({
			foo: { value: 2, hasExplicitDefault: true, isInherited: false },
			bar: { value: 3, hasExplicitDefault: true, isInherited: true },
		});
	});

	it('rejects array initializers longer than the planned array', () => {
		const values = arrayLine(2, 'int[]', [
			classifyIdentifier('values'),
			literal(2),
			literal(1),
			literal(2),
			literal(3),
		]);
		const module = moduleSource('main', [values]);
		const memoryPlan = planMemoryLayout({
			prototypes: [],
			modules: [module],
		});

		expect(() =>
			resolveMemoryDefaults({
				memoryPlan,
			})
		).toThrow(MemoryDefaultResolverError);
		expect(() =>
			resolveMemoryDefaults({
				memoryPlan,
			})
		).toThrow(expect.objectContaining({ compilerErrorCode: ErrorCode.ARRAY_INITIALIZER_TOO_LONG }));
	});
});
