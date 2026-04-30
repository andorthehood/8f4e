import { describe, expect, it } from 'vitest';

import int16 from './int16';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST } from '@8f4e/compiler-types';

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
		expect(entry.isInteger).toBe(true);
		expect(entry.pointeeBaseType).toBe('int16');
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
		expect(entry.isInteger).toBe(true);
		expect(entry.pointeeBaseType).toBe('int16');
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
