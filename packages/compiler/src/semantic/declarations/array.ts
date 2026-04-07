import { withValidation } from '../../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../../consts';
import createInstructionCompilerTestContext from '../../utils/testUtils';
import { ArgumentType } from '../../types';
import { alignAbsoluteWordOffset, getAbsoluteWordOffset, getByteAddressFromWordOffset } from '../layoutAddresses';

import type { AST, ArrayDeclarationLine, InstructionCompiler, MemoryTypes } from '../../types';

function getElementWordSize(instruction: string): number {
	if (instruction.startsWith('float64') && !instruction.includes('*')) return 8;
	if (instruction.includes('8')) return 1;
	if (instruction.includes('16')) return 2;
	return 4;
}

/**
 * Instruction compiler for typed array declarations such as `int[]`, `float[]`, and `float64[]`.
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const array: InstructionCompiler<ArrayDeclarationLine> = withValidation<ArrayDeclarationLine>(
	{
		scope: 'module',
	},
	(line: ArrayDeclarationLine, context) => {
		const memoryId = line.arguments[0].value;
		const elementCountArg = line.arguments[1];
		const wordAlignedAddress = context.currentModuleNextWordOffset ?? 0;

		const elementWordSize = getElementWordSize(line.instruction);
		const isUnsigned = line.instruction.endsWith('u[]');
		const numberOfElements = elementCountArg.value;

		// Apply 8-byte alignment for float64[] arrays: round up absolute word offset to even
		// so byteAddress is always divisible by 8, making Float64Array / DataView access safe.
		const absoluteWordOffset = getAbsoluteWordOffset(context.startingByteAddress, wordAlignedAddress);
		const alignedAbsoluteWordOffset = alignAbsoluteWordOffset(absoluteWordOffset, elementWordSize);
		const alignmentPadding = alignedAbsoluteWordOffset - absoluteWordOffset;
		const wordAlignedSize = alignmentPadding + Math.ceil((numberOfElements * elementWordSize) / GLOBAL_ALIGNMENT_BOUNDARY);

		context.namespace.memory[memoryId] = {
			numberOfElements,
			elementWordSize,
			// Round up to the 4-byte allocation grid so all data structures stay word-addressable.
			// alignmentPadding reserves any gap needed before float64[] to guarantee 8-byte byte-address alignment.
			wordAlignedSize,
			// Store address in 4-byte words because pointer math/view indexing is word-based.
			wordAlignedAddress: alignedAbsoluteWordOffset,
			id: memoryId,
			// Convert the word-grid offset back to a byte address for wasm load/store instructions.
			byteAddress: getByteAddressFromWordOffset(0, alignedAbsoluteWordOffset),
			default: {},
			isInteger: line.instruction.startsWith('int') || line.instruction.includes('*'),
			isPointingToPointer: line.instruction.includes('**'),
			...(line.instruction.includes('*')
				? {
						pointeeBaseType: line.instruction.startsWith('float64')
							? 'float64'
							: line.instruction.startsWith('int')
								? 'int'
								: 'float',
					}
				: {}),
			type: line.instruction.slice(0, -2) as unknown as MemoryTypes,
			isUnsigned,
		};
		context.currentModuleNextWordOffset = wordAlignedAddress + wordAlignedSize;

		return context;
	}
);

export default array;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('array declaration compiler', () => {
		it('creates a memory array entry', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int[]',
					arguments: [classifyIdentifier('values'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});

		it('creates an int8[] array with correct wordAlignedSize', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int8[]',
					arguments: [classifyIdentifier('bytes'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
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

		it('creates an int8[] array requiring alignment padding', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int8[]',
					arguments: [classifyIdentifier('bytes'), { type: ArgumentType.LITERAL, value: 5, isInteger: true }],
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

		it('creates an int16[] array with correct wordAlignedSize', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int16[]',
					arguments: [classifyIdentifier('shorts'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
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

		it('creates an int16[] array requiring alignment padding', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int16[]',
					arguments: [classifyIdentifier('shorts'), { type: ArgumentType.LITERAL, value: 5, isInteger: true }],
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

		it('creates an int32[] array with correct wordAlignedSize', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int32[]',
					arguments: [classifyIdentifier('ints'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
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

		it('creates an int8u[] array with unsigned flag', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int8u[]',
					arguments: [classifyIdentifier('unsignedBytes'), { type: ArgumentType.LITERAL, value: 5, isInteger: true }],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['unsignedBytes'];
			expect(memory.elementWordSize).toBe(1);
			expect(memory.numberOfElements).toBe(5);
			expect(memory.isUnsigned).toBe(true);
			expect(memory.isInteger).toBe(true);
		});

		it('creates an int16u[] array with unsigned flag', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int16u[]',
					arguments: [classifyIdentifier('unsignedShorts'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['unsignedShorts'];
			expect(memory.elementWordSize).toBe(2);
			expect(memory.numberOfElements).toBe(3);
			expect(memory.isUnsigned).toBe(true);
			expect(memory.isInteger).toBe(true);
		});

		it('creates an int8[] array with isUnsigned false', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int8[]',
					arguments: [classifyIdentifier('signedBytes'), { type: ArgumentType.LITERAL, value: 5, isInteger: true }],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['signedBytes'];
			expect(memory.isUnsigned).toBe(false);
		});

		it('creates a float64[] array with elementWordSize 8', () => {
			const context = createInstructionCompilerTestContext();

			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'float64[]',
					arguments: [classifyIdentifier('doubles'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
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
			array(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int[]',
					arguments: [classifyIdentifier('ints'), { type: ArgumentType.LITERAL, value: 3, isInteger: true }],
				} as AST[number],
				context
			);

			array(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'float64[]',
					arguments: [classifyIdentifier('doubles'), { type: ArgumentType.LITERAL, value: 2, isInteger: true }],
				} as AST[number],
				context
			);

			const memory = context.namespace.memory['doubles'];
			expect(memory.byteAddress % 8).toBe(0);
			expect(memory.wordAlignedAddress % 2).toBe(0);
		});
	});
}
