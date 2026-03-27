import { getPointerDepth } from '@8f4e/ast-parser';

import { calculateWordAlignedSizeOfMemory } from '../utils/compilation';
import parseMemoryInstructionArguments from '../utils/memoryInstructionParser';
import getMemoryFlags from '../utils/memoryFlags';
import { withValidation } from '../withValidation';
import { GLOBAL_ALIGNMENT_BOUNDARY } from '../consts';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { ArgumentType } from '../types';

import type { AST, InstructionCompiler, MemoryTypes } from '../types';

/**
 * Instruction compiler for `int16*`, `int16**`.
 *
 * Pointer variants store a 4-byte address (elementWordSize = 4), identical
 * to `int*` in allocation width, but carry int16 pointer typing metadata.
 * The pointee width is 2 bytes (signed 16-bit integer).
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int16: InstructionCompiler = withValidation(
	{
		scope: 'module',
	},
	(line, context) => {
		const wordAlignedAddress = calculateWordAlignedSizeOfMemory(context.namespace.memory);
		const { id, defaultValue } = parseMemoryInstructionArguments(line, context);
		const pointerDepth = getPointerDepth(line.instruction);
		const flags = getMemoryFlags('int16', pointerDepth);

		// Truncate any float values to integers (important for fraction literals and float defaults)
		const truncatedDefault = Math.trunc(defaultValue);

		// int16* / int16** store a pointer (4 bytes), same width as int* / float*.
		context.namespace.memory[id] = {
			numberOfElements: 1,
			elementWordSize: 4,
			wordAlignedAddress: context.startingByteAddress / GLOBAL_ALIGNMENT_BOUNDARY + wordAlignedAddress,
			wordAlignedSize: 1,
			byteAddress: context.startingByteAddress + wordAlignedAddress * GLOBAL_ALIGNMENT_BOUNDARY,
			id,
			default: truncatedDefault,
			type: line.instruction as unknown as MemoryTypes,
			...flags,
		};

		return context;
	}
);

export default int16;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('int16 instruction compiler', () => {
		it('creates an int16* memory entry with pointer-width allocation', () => {
			const context = createInstructionCompilerTestContext();

			int16(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int16*',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'ptr' }],
				} as AST[number],
				context
			);

			const entry = context.namespace.memory['ptr'];
			expect(entry.elementWordSize).toBe(4);
			expect(entry.wordAlignedSize).toBe(1);
			expect(entry.isPointer).toBe(true);
			expect(entry.isInteger).toBe(true);
			expect(entry.isPointingToInteger).toBe(true);
			expect(entry.isPointingToInt16).toBe(true);
			expect(entry.isPointingToPointer).toBe(false);
		});

		it('creates an int16** memory entry with pointer-width allocation', () => {
			const context = createInstructionCompilerTestContext();

			int16(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int16**',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'pptr' }],
				} as AST[number],
				context
			);

			const entry = context.namespace.memory['pptr'];
			expect(entry.elementWordSize).toBe(4);
			expect(entry.wordAlignedSize).toBe(1);
			expect(entry.isPointer).toBe(true);
			expect(entry.isInteger).toBe(true);
			expect(entry.isPointingToInt16).toBe(true);
			expect(entry.isPointingToPointer).toBe(true);
		});

		it('stores 4 bytes (pointer slot) regardless of int16 pointee width', () => {
			const context = createInstructionCompilerTestContext();

			int16(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int16*',
					arguments: [{ type: ArgumentType.IDENTIFIER, value: 'p' }],
				} as AST[number],
				context
			);

			// Pointer slot always occupies 1 word (4 bytes)
			expect(context.namespace.memory['p'].wordAlignedSize).toBe(1);
			expect(context.namespace.memory['p'].elementWordSize).toBe(4);
		});
	});
}
