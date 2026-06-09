import { ErrorCode } from '@8f4e/compiler-spec';
import { parseLine } from '@8f4e/tokenizer';
import { describe, expect, it } from 'vitest';
import createInstructionCompilerTestContext, { analyzeAndCompileInstruction } from '../utils/testUtils';
import asPointer from './asPointer';

describe('asPointer instruction compiler', () => {
	it('attaches pointer metadata without emitting bytecode', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true, knownIntegerValue: 64 });

		analyzeAndCompileInstruction(asPointer, parseLine('asPointer float*', 1), context);

		expect({
			stack: context.stack,
			byteCode: context.byteCode,
		}).toEqual({
			stack: [
				{
					kind: 'address',
					valueType: 'int',
					address: { memoryIndex: 0 },
					pointsTo: { baseType: 'float', memoryIndex: 0, pointerDepth: 1 },
					isNonZero: true,
					knownIntegerValue: 64,
				},
			],
			byteCode: [],
		});
	});

	it('preserves address memory metadata', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({
			kind: 'address',
			valueType: 'int',
			address: { memoryIndex: 2, memoryRegionName: 'heap' },
			isNonZero: true,
		});

		analyzeAndCompileInstruction(asPointer, parseLine('asPointer int**', 1), context);

		expect(context.stack).toEqual([
			{
				kind: 'address',
				valueType: 'int',
				address: { memoryIndex: 2, memoryRegionName: 'heap' },
				pointsTo: { baseType: 'int', memoryIndex: 2, memoryRegionName: 'heap', pointerDepth: 2 },
				isNonZero: true,
			},
		]);
		expect(context.byteCode).toEqual([]);
	});

	it('rejects scalar function types', () => {
		const context = createInstructionCompilerTestContext();
		context.stack.push({ kind: 'value', valueType: 'int', isNonZero: true });

		expect(() => analyzeAndCompileInstruction(asPointer, parseLine('asPointer int', 1), context)).toThrow(
			`${ErrorCode.AS_POINTER_REQUIRES_POINTER_TYPE}`
		);
	});
});
