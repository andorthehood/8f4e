import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import parseMemoryInstructionArguments from '../utils/memoryInstructionParser';
import getMemoryFlags from '../utils/memoryFlags';
import getPointerDepth from '../syntax/getPointerDepth';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { ArgumentType } from '../types';
import int from './int';

import type { AST, InstructionCompiler, MemoryTypes } from '../types';

/**
 * Instruction compiler for `float64`, `float64*`, `float64**`.
 *
 * Scalar `float64` occupies two 4-byte words (elementWordSize = 8) and must
 * start on an even word boundary so its byteAddress is divisible by 8, making
 * Float64Array / DataView access safe.  The global allocation grid stays at
 * 4 bytes; alignment padding (0 or 1 word) is absorbed into wordAlignedSize.
 *
 * Pointer variants (`float64*`, `float64**`) store a 4-byte address, identical
 * to `float*` in allocation width, but carry float64 pointer typing metadata.
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const float64: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const localWordOffset = calculateWordAlignedSizeOfMemory(context.namespace.memory);
		const { id, defaultValue } = parseMemoryInstructionArguments(
			line.arguments,
			line.lineNumber,
			line.instruction,
			context
		);
		const pointerDepth = getPointerDepth(line.instruction);
		const flags = getMemoryFlags('float64', pointerDepth);

		if (pointerDepth > 0) {
			// float64* / float64** store a pointer (4 bytes), same width as float* / int*.
			// No 8-byte alignment required for the pointer slot itself.
			context.namespace.memory[id] = {
				numberOfElements: 1,
				elementWordSize: 4,
				wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset,
				wordAlignedSize: 1,
				byteAddress: context.startingByteAddress + localWordOffset * GLOBAL_ALIGNMENT_BOUNDARY,
				id,
				default: defaultValue,
				type: line.instruction as unknown as MemoryTypes,
				...flags,
			};
		} else {
			// float64 scalar: elementWordSize = 8, requires 8-byte (2-word) start alignment.
			// Compute absolute word address and round up to the next even boundary so that
			// byteAddress = wordAlignedAddress * 4 is always divisible by 8.
			const absoluteWordOffset = context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + localWordOffset;
			const alignedAbsoluteWordOffset = absoluteWordOffset % 2 === 0 ? absoluteWordOffset : absoluteWordOffset + 1;
			// alignmentPadding (0 or 1) is folded into wordAlignedSize so that
			// calculateWordAlignedSizeOfMemory returns the correct next-free offset.
			const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;

			context.namespace.memory[id] = {
				numberOfElements: 1,
				elementWordSize: 8,
				wordAlignedAddress: alignedAbsoluteWordOffset,
				wordAlignedSize: alignmentPadding + 2,
				byteAddress: alignedAbsoluteWordOffset * GLOBAL_ALIGNMENT_BOUNDARY,
				id,
				default: defaultValue,
				type: line.instruction as unknown as MemoryTypes,
				...flags,
			};
		}

		return context;
	}
);

export default float64;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('float64 instruction compiler', () => {
		it('creates a float64 memory entry', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumber: 1,
					instruction: 'float64',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'value' }],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});

		it('float64 scalar has elementWordSize 8', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumber: 1,
					instruction: 'float64',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'value' }],
				} as AST[number],
				context
			);

			expect(context.namespace.memory['value'].elementWordSize).toBe(8);
		});

		it('float64 at offset 0 has byteAddress divisible by 8', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumber: 1,
					instruction: 'float64',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'value' }],
				} as AST[number],
				context
			);

			expect(context.namespace.memory['value'].byteAddress % 8).toBe(0);
		});

		it('aligns second float64 to 8 bytes after odd number of int32 vars', () => {
			const context = createInstructionCompilerTestContext();

			// First float64 (starts at word 0, even)
			float64(
				{
					lineNumber: 1,
					instruction: 'float64',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'a' }],
				} as AST[number],
				context
			);

			// Three int32 variables (odd count) push the offset to an odd word boundary
			int(
				{
					lineNumber: 2,
					instruction: 'int',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'x' }],
				} as AST[number],
				context
			);
			int(
				{
					lineNumber: 3,
					instruction: 'int',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'y' }],
				} as AST[number],
				context
			);
			int(
				{
					lineNumber: 4,
					instruction: 'int',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'z' }],
				} as AST[number],
				context
			);

			// Second float64 must still be 8-byte aligned despite odd preceding offset
			float64(
				{
					lineNumber: 5,
					instruction: 'float64',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'b' }],
				} as AST[number],
				context
			);

			const entry = context.namespace.memory['b'];
			expect(entry.byteAddress % 8).toBe(0);
			expect(entry.wordAlignedAddress % 2).toBe(0);
		});

		it('creates a float64* memory entry with pointer-width allocation', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumber: 1,
					instruction: 'float64*',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'ptr' }],
				} as AST[number],
				context
			);

			const entry = context.namespace.memory['ptr'];
			expect(entry.elementWordSize).toBe(4);
			expect(entry.wordAlignedSize).toBe(1);
			expect(entry.isPointer).toBe(true);
			expect(entry.isInteger).toBe(true);
		});

		it('creates a float64** memory entry with pointer-width allocation', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumber: 1,
					instruction: 'float64**',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'pptr' }],
				} as AST[number],
				context
			);

			const entry = context.namespace.memory['pptr'];
			expect(entry.elementWordSize).toBe(4);
			expect(entry.wordAlignedSize).toBe(1);
			expect(entry.isPointer).toBe(true);
			expect(entry.isPointingToPointer).toBe(true);
		});
	});
}
