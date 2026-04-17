import { describe, expect, it } from 'vitest';

import int8 from './int8';

import createInstructionCompilerTestContext from '../../utils/testUtils';

import type { AST } from '../../types';

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
		expect(entry.isInteger).toBe(true);
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
