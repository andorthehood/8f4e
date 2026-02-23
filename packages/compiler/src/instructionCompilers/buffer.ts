import { ArgumentType } from '../types';
import { ErrorCode, getError } from '../errors';
import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { resolveConstantValueOrExpressionOrThrow } from '../utils/resolveConstantValue';

import type { AST, InstructionCompiler, MemoryTypes } from '../types';

function getElementWordSize(instruction: string): number {
	if (instruction.startsWith('float64') && !instruction.includes('*')) return 8;
	if (instruction.includes('8')) return 1;
	if (instruction.includes('16')) return 2;
	return 4;
}

/**
 * Instruction compiler for `int[]`, `float[]`, and `float64[]`.
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

		const wordAlignedAddress = calculateWordAlignedSizeOfMemory(context.namespace.memory);

		let numberOfElements = 1;
		const elementWordSize = getElementWordSize(line.instruction);
		const isUnsigned = line.instruction.endsWith('u[]');

		if (line.arguments[1].type === ArgumentType.LITERAL) {
			numberOfElements = line.arguments[1].value;
		} else {
			const constant = resolveConstantValueOrExpressionOrThrow(line.arguments[1].value, line, context);
			numberOfElements = constant.value;
		}

		// Apply 8-byte alignment for float64[] buffers: round up absolute word offset to even
		// so byteAddress is always divisible by 8, making Float64Array / DataView access safe.
		const absoluteWordOffset = context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress;
		const alignedAbsoluteWordOffset =
			elementWordSize === 8 && absoluteWordOffset % 2 !== 0 ? absoluteWordOffset + 1 : absoluteWordOffset;
		const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;

		context.namespace.memory[line.arguments[0].value] = {
			numberOfElements,
			elementWordSize,
			// Round up to the 4-byte allocation grid so all data structures stay word-addressable.
			// alignmentPadding reserves any gap needed before float64[] to guarantee 8-byte byte-address alignment.
			wordAlignedSize: alignmentPadding + Math.ceil((numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY),
			// Store address in 4-byte words because pointer math/view indexing is word-based.
			wordAlignedAddress: alignedAbsoluteWordOffset,
			id: line.arguments[0].value,
			// Convert the word-grid offset back to a byte address for wasm load/store instructions.
			byteAddress: alignedAbsoluteWordOffset * GLOBAL_ALIGNMENT_BOUNDARY,
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
			// 3 elements * 8 bytes each = 24 bytes = 6 words
			expect(memory.wordAlignedSize).toBe(6);
			expect(memory.byteAddress % 8).toBe(0);
		});

		it('aligns float64[] to 8 bytes after an odd number of int32 elements', () => {
			const context = createInstructionCompilerTestContext();

			// Three int32 variables to force an odd word offset
			buffer(
				{
					lineNumber: 1,
					instruction: 'int[]',
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

			const memory = context.namespace.memory['doubles'];
			expect(memory.byteAddress % 8).toBe(0);
			expect(memory.wordAlignedAddress % 2).toBe(0);
		});
	});
}
