import createDeclarationCompiler from './createDeclarationCompiler';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST, InstructionCompiler } from '../../types';

/**
 * Instruction compiler for `int8*`, `int8**`.
 *
 * Pointer variants store a 4-byte address (elementWordSize = 4), identical
 * to `int*` in allocation width, but carry int8 pointer typing metadata.
 * The pointee width is 1 byte (signed 8-bit integer).
 *
 * @see [Instruction docs](../../docs/instructions/declarations-and-locals.md)
 */
const int8: InstructionCompiler = createDeclarationCompiler({
	baseType: 'int8',
	truncate: true,
	nonPointerElementWordSize: 4,
});

export default int8;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('int8 instruction compiler', () => {
		it('creates an int8* memory entry with pointer-width allocation', () => {
			const context = createInstructionCompilerTestContext();

			int8(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int8*',
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
			expect(entry.pointeeBaseType).toBe('int8');
			expect(entry.isPointingToPointer).toBe(false);
		});

		it('creates an int8** memory entry with pointer-width allocation', () => {
			const context = createInstructionCompilerTestContext();

			int8(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int8**',
					arguments: [classifyIdentifier('pptr')],
				} as AST[number],
				context
			);

			const entry = context.namespace.memory['pptr'];
			expect(entry.elementWordSize).toBe(4);
			expect(entry.wordAlignedSize).toBe(1);
			expect(entry.isPointer).toBe(true);
			expect(entry.isInteger).toBe(true);
			expect(entry.pointeeBaseType).toBe('int8');
			expect(entry.isPointingToPointer).toBe(true);
		});

		it('stores 4 bytes (pointer slot) regardless of int8 pointee width', () => {
			const context = createInstructionCompilerTestContext();

			int8(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'int8*',
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
