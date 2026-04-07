import createDeclarationCompiler from './createDeclarationCompiler';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST, InstructionCompiler } from '../../types';

/**
 * Instruction compiler for `int16*`, `int16**`.
 *
 * Pointer variants store a 4-byte address (elementWordSize = 4), identical
 * to `int*` in allocation width, but carry int16 pointer typing metadata.
 * The pointee width is 2 bytes (signed 16-bit integer).
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int16: InstructionCompiler = createDeclarationCompiler({
	baseType: 'int16',
	truncate: true,
	nonPointerElementWordSize: 4,
});

export default int16;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('int16 instruction compiler', () => {
		it('creates an int16* memory entry with pointer-width allocation', () => {
			const context = createInstructionCompilerTestContext();

			int16(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int16*',
					arguments: [classifyIdentifier('ptr')],
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
					arguments: [classifyIdentifier('pptr')],
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
					arguments: [classifyIdentifier('p')],
				} as AST[number],
				context
			);

			// Pointer slot always occupies 1 word (4 bytes)
			expect(context.namespace.memory['p'].wordAlignedSize).toBe(1);
			expect(context.namespace.memory['p'].elementWordSize).toBe(4);
		});
	});
}
