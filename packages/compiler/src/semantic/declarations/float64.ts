import createDeclarationCompiler from './createDeclarationCompiler';
import int from './int';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST, InstructionCompiler } from '../../types';

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
const float64: InstructionCompiler = createDeclarationCompiler({
	baseType: 'float64',
	truncate: false,
	nonPointerElementWordSize: 8,
});

export default float64;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;
	const { classifyIdentifier } = await import('@8f4e/tokenizer');

	describe('float64 instruction compiler', () => {
		it('creates a float64 memory entry', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'float64',
					arguments: [classifyIdentifier('value')],
				} as AST[number],
				context
			);

			expect(context.namespace.memory).toMatchSnapshot();
		});

		it('float64 scalar has elementWordSize 8', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'float64',
					arguments: [classifyIdentifier('value')],
				} as AST[number],
				context
			);

			expect(context.namespace.memory['value'].elementWordSize).toBe(8);
		});

		it('float64 at offset 0 has byteAddress divisible by 8', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'float64',
					arguments: [classifyIdentifier('value')],
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'float64',
					arguments: [classifyIdentifier('a')],
				} as AST[number],
				context
			);

			// Three int32 variables (odd count) push the offset to an odd word boundary
			int(
				{
					lineNumberBeforeMacroExpansion: 2,
					lineNumberAfterMacroExpansion: 2,
					instruction: 'int',
					arguments: [classifyIdentifier('x')],
				} as AST[number],
				context
			);
			int(
				{
					lineNumberBeforeMacroExpansion: 3,
					lineNumberAfterMacroExpansion: 3,
					instruction: 'int',
					arguments: [classifyIdentifier('y')],
				} as AST[number],
				context
			);
			int(
				{
					lineNumberBeforeMacroExpansion: 4,
					lineNumberAfterMacroExpansion: 4,
					instruction: 'int',
					arguments: [classifyIdentifier('z')],
				} as AST[number],
				context
			);

			// Second float64 must still be 8-byte aligned despite odd preceding offset
			float64(
				{
					lineNumberBeforeMacroExpansion: 5,
					lineNumberAfterMacroExpansion: 5,
					instruction: 'float64',
					arguments: [classifyIdentifier('b')],
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
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'float64*',
					arguments: [classifyIdentifier('ptr')],
				} as AST[number],
				context
			);

			const entry = context.namespace.memory['ptr'];
			expect(entry.elementWordSize).toBe(4);
			expect(entry.wordAlignedSize).toBe(1);
			expect(entry.pointeeBaseType).toBe('float64');
			expect(entry.isInteger).toBe(true);
		});

		it('creates a float64** memory entry with pointer-width allocation', () => {
			const context = createInstructionCompilerTestContext();

			float64(
				{
					lineNumberBeforeMacroExpansion: 1,
					lineNumberAfterMacroExpansion: 1,
					instruction: 'float64**',
					arguments: [classifyIdentifier('pptr')],
				} as AST[number],
				context
			);

			const entry = context.namespace.memory['pptr'];
			expect(entry.elementWordSize).toBe(4);
			expect(entry.wordAlignedSize).toBe(1);
			expect(entry.pointeeBaseType).toBe('float64');
			expect(entry.isPointingToPointer).toBe(true);
		});
	});
}
