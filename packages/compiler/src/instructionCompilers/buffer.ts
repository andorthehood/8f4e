import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler, MemoryTypes } from '../types';

/**
 * Instruction compiler for `int[]` and `float[]`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const buffer: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		if (!line.arguments[0] || !line.arguments[1]) {
			throw getError(ErrorCode.MISSING_ARGUMENT, line, context);
		}

		if (line.arguments[0].type === ArgumentType.LITERAL) {
			throw getError(ErrorCode.EXPECTED_IDENTIFIER, line, context);
		}

		let wordAlignedAddress = calculateWordAlignedSizeOfMemory(context.namespace.memory);

		let numberOfElements = 1;
		// float64 elements are 8 bytes each; all others fall back to 4 bytes (int/float/pointer),
		// 2 bytes (int16), or 1 byte (int8). The global grid stays at 4 bytes.
		const elementWordSize = line.instruction.includes('8')
			? 1
			: line.instruction.includes('16')
				? 2
				: line.instruction.includes('64')
					? 8
					: 4;
		const isUnsigned = line.instruction.endsWith('u[]');

		if (line.arguments[1].type === ArgumentType.LITERAL) {
			numberOfElements = line.arguments[1].value;
		} else {
			const constant = context.namespace.consts[line.arguments[1].value];

			if (!constant) {
				throw getError(ErrorCode.UNDECLARED_IDENTIFIER, line, context);
			}

			numberOfElements = constant.value;
		}

		// float64 requires 8-byte start alignment. On the 4-byte word grid this means the word
		// offset from the module's startingByteAddress must be even. If the current word offset
		// would produce an odd byte-address / 4 result, advance by one padding word so that
		// (startingByteAddress + wordAlignedAddress * 4) % 8 === 0.
		if (elementWordSize === 8) {
			const candidateByteAddress = context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY;
			if (candidateByteAddress % 8 !== 0) {
				wordAlignedAddress += 1;
			}
		}

		context.namespace.memory[line.arguments[0].value] = {
			numberOfElements,
			elementWordSize,
			// Round up to the 4-byte allocation grid so all data structures stay word-addressable.
			wordAlignedSize: Math.ceil((numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY),
			// Store address in 4-byte words because pointer math/view indexing is word-based.
			wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress,
			id: line.arguments[0].value,
			// Convert the word-grid offset back to a byte address for wasm load/store instructions.
			byteAddress: context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			default: {},
			isInteger: line.instruction.startsWith('int') || line.instruction.includes('*'),
			isPointer: line.instruction.includes('*'),
			isPointingToInteger: line.instruction.startsWith('int') && line.instruction.includes('*'),
			isPointingToPointer: line.instruction.includes('**'),
			type: line.instruction.slice(0, -2) as unknown as MemoryTypes,
			isUnsigned,
		};

		return context;
	}
);

export default buffer;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('buffer instruction compiler', () => {
		it('creates a memory buffer entry', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'values' },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});

		it('creates an int8[] buffer with correct wordAlignedSize', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int8[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'bytes' },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['bytes'];
			expect(memory.elementWordSize).toBe(1);
			expect(memory.numberOfElements).toBe(3);
			// 3 bytes * 1 byte per element = 3 bytes total
			// ceil(3 / 4) = 1 word
			expect(memory.wordAlignedSize).toBe(1);
		});

		it('creates an int8[] buffer requiring alignment padding', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int8[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'bytes' },
						{ type: ArgumentType.LITERAL, value: 5, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['bytes'];
			expect(memory.elementWordSize).toBe(1);
			expect(memory.numberOfElements).toBe(5);
			// 5 bytes * 1 byte per element = 5 bytes total
			// ceil(5 / 4) = 2 words
			expect(memory.wordAlignedSize).toBe(2);
		});

		it('creates an int16[] buffer with correct wordAlignedSize', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int16[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'shorts' },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['shorts'];
			expect(memory.elementWordSize).toBe(2);
			expect(memory.numberOfElements).toBe(3);
			// 3 elements * 2 bytes per element = 6 bytes total
			// ceil(6 / 4) = 2 words
			expect(memory.wordAlignedSize).toBe(2);
		});

		it('creates an int16[] buffer requiring alignment padding', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int16[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'shorts' },
						{ type: ArgumentType.LITERAL, value: 5, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['shorts'];
			expect(memory.elementWordSize).toBe(2);
			expect(memory.numberOfElements).toBe(5);
			// 5 elements * 2 bytes per element = 10 bytes total
			// ceil(10 / 4) = 3 words
			expect(memory.wordAlignedSize).toBe(3);
		});

		it('creates an int32[] buffer with correct wordAlignedSize', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int32[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'ints' },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['ints'];
			expect(memory.elementWordSize).toBe(4);
			expect(memory.numberOfElements).toBe(3);
			// 3 elements * 4 bytes per element = 12 bytes total
			// ceil(12 / 4) = 3 words
			expect(memory.wordAlignedSize).toBe(3);
		});

		it('throws on missing arguments', () => {
			const context = createInstructionCompilerTestContext();

			expect(() => {
				buffer({ lineNumber: 1, instruction: 'int[]', arguments: [] } as AST[number], context);
			}).toThrowError();
		});

		it('creates an int8u[] buffer with unsigned flag', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int8u[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'unsignedBytes' },
						{ type: ArgumentType.LITERAL, value: 5, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['unsignedBytes'];
			expect(memory.elementWordSize).toBe(1);
			expect(memory.numberOfElements).toBe(5);
			expect(memory.isUnsigned).toBe(true);
			expect(memory.isInteger).toBe(true);
		});

		it('creates an int16u[] buffer with unsigned flag', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int16u[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'unsignedShorts' },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['unsignedShorts'];
			expect(memory.elementWordSize).toBe(2);
			expect(memory.numberOfElements).toBe(3);
			expect(memory.isUnsigned).toBe(true);
			expect(memory.isInteger).toBe(true);
		});

		it('creates an int8[] buffer with isUnsigned false', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int8[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'signedBytes' },
						{ type: ArgumentType.LITERAL, value: 5, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['signedBytes'];
			expect(memory.isUnsigned).toBe(false);
		});

		it('creates a float64[] buffer with elementWordSize 8', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'float64[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'doubles' },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['doubles'];
			expect(memory.elementWordSize).toBe(8);
			expect(memory.numberOfElements).toBe(3);
			// 3 elements * 8 bytes per element = 24 bytes total
			// ceil(24 / 4) = 6 words
			expect(memory.wordAlignedSize).toBe(6);
			expect(memory.isInteger).toBe(false);
			expect(memory.isUnsigned).toBe(false);
		});

		it('float64[] byteAddress is 8-byte aligned when starting at byte 0', () => {
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'float64[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'doubles' },
						{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
					],
				} as AST[number],
				context
			);

			expect(context.namespace.memory['doubles'].byteAddress % 8).toBe(0);
		});

		it('float64[] is 8-byte aligned after an odd number of int32 elements', () => {
			// Allocate 3 x int32 (= 3 words = 12 bytes), leaving the next free byte at offset 12.
			// 12 % 8 = 4, so the allocator must add a 4-byte padding word before the float64[]
			// to reach byte offset 16 (16 % 8 = 0).
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int32[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'ints' },
						{ type: ArgumentType.LITERAL, value: 3, isInteger: true },
					],
				} as AST[number],
				context
			);

			buffer(
				{
					lineNumber: 2,
					instruction: 'float64[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'doubles' },
						{ type: ArgumentType.LITERAL, value: 2, isInteger: true },
					],
				} as AST[number],
				context
			);

			const dbl = context.namespace.memory['doubles'];
			expect(dbl.byteAddress % 8).toBe(0);
		});

		it('float64[] is 8-byte aligned after an even number of int32 elements (no padding needed)', () => {
			// Allocate 2 x int32 (= 2 words = 8 bytes). 8 % 8 = 0, no padding required.
			const context = createInstructionCompilerTestContext();

			buffer(
				{
					lineNumber: 1,
					instruction: 'int32[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'ints' },
						{ type: ArgumentType.LITERAL, value: 2, isInteger: true },
					],
				} as AST[number],
				context
			);

			buffer(
				{
					lineNumber: 2,
					instruction: 'float64[]',
					arguments: [
						{ type: ArgumentType.IDENTIFIER, value: 'doubles' },
						{ type: ArgumentType.LITERAL, value: 1, isInteger: true },
					],
				} as AST[number],
				context
			);

			const dbl = context.namespace.memory['doubles'];
			expect(dbl.byteAddress % 8).toBe(0);
			// No padding: float64 should start immediately after the 2-word int32 block.
			expect(dbl.byteAddress).toBe(8);
		});
	});
}
